import { Injectable, Optional, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  JobEntity,
  type JobEntityState,
  type JobStore,
} from '../../domain/index.js';

const JOB_KEY_PREFIX = 'job:';
const JOB_INDEX_KEY = 'jobs:index';
// EXTENSION: make the retention window configurable per deployment.
const JOB_TTL_SECONDS = 60 * 60;

/**
 * Redis-backed {@link JobStore}. State lives in Redis so multiple API
 * instances share it (horizontal scaling) and a TTL bounds memory growth.
 *
 * The client is created lazily on first use, so selecting another driver never
 * opens a connection and the app boots without waiting on Redis.
 */
@Injectable()
export class RedisJobStore implements JobStore, OnModuleDestroy {
  private client: Redis | null;

  private readonly ownsClient: boolean;

  // A client can be injected for tests; otherwise it is built lazily from env.
  // @Optional() stops Nest from trying to resolve `Redis` as a DI dependency.
  public constructor(@Optional() client?: Redis) {
    this.client = client ?? null;
    this.ownsClient = client === undefined;
  }

  public async create(job: JobEntity): Promise<void> {
    await this.persist(job);
  }

  public async update(job: JobEntity): Promise<void> {
    await this.persist(job);
  }

  public async findById(jobId: string): Promise<JobEntity | null> {
    const raw = await this.getClient().get(JOB_KEY_PREFIX + jobId);
    return raw === null ? null : this.deserialize(raw);
  }

  public async list(): Promise<JobEntity[]> {
    const client = this.getClient();
    const ids = await client.zrevrange(JOB_INDEX_KEY, 0, -1);

    if (ids.length === 0) {
      return [];
    }

    const rows = await client.mget(ids.map((id) => JOB_KEY_PREFIX + id));
    const jobs: JobEntity[] = [];
    const expired: string[] = [];

    ids.forEach((id, index) => {
      const raw = rows[index];

      if (raw === null || raw === undefined) {
        expired.push(id);
        return;
      }

      jobs.push(this.deserialize(raw));
    });

    // Drop index entries whose job payloads have already expired.
    if (expired.length > 0) {
      await client.zrem(JOB_INDEX_KEY, ...expired);
    }

    return jobs;
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client !== null && this.ownsClient) {
      await this.client.quit();
    }
  }

  private async persist(job: JobEntity): Promise<void> {
    const client = this.getClient();
    const state = job.toState();

    await client
      .multi()
      .set(
        JOB_KEY_PREFIX + job.id,
        JSON.stringify(state),
        'EX',
        JOB_TTL_SECONDS,
      )
      .zadd(JOB_INDEX_KEY, state.createdAt.getTime(), job.id)
      .exec();
  }

  private deserialize(raw: string): JobEntity {
    return JobEntity.restore(JSON.parse(raw) as JobEntityState);
  }

  private getClient(): Redis {
    if (this.client === null) {
      this.client = new Redis(
        process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
        {
          // Keep the process responsive if Redis is slow/unavailable rather
          // than hanging requests forever.
          maxRetriesPerRequest: 2,
          retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
        },
      );
    }

    return this.client;
  }
}
