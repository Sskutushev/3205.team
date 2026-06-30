import { JobStatus, UrlStatus } from '@url-checker/shared';
import type { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { describe, expect, it } from 'vitest';
import { JobEntity } from '../../domain/index.js';
import { RedisJobStore } from './redis-job-store.js';

function createStore(): RedisJobStore {
  return new RedisJobStore(new RedisMock() as unknown as Redis);
}

describe('RedisJobStore', () => {
  it('persists, retrieves, and lists jobs newest-first', async () => {
    const store = createStore();
    const older = JobEntity.create({
      id: 'older',
      createdAt: new Date(1000),
      urls: ['https://a.test'],
    });
    const newer = JobEntity.create({
      id: 'newer',
      createdAt: new Date(2000),
      urls: ['https://b.test', 'https://c.test'],
    });

    await store.create(older);
    await store.create(newer);

    const fetched = await store.findById('older');
    expect(fetched?.id).toBe('older');
    expect(fetched?.status).toBe(JobStatus.pending);
    expect(fetched?.totalUrls).toBe(1);

    const list = await store.list();
    expect(list.map((job) => job.id)).toEqual(['newer', 'older']);

    expect(await store.findById('missing')).toBeNull();
  });

  it('round-trips url result statuses and dates through update', async () => {
    const store = createStore();
    const job = JobEntity.create({
      id: 'x',
      createdAt: new Date(0),
      urls: ['https://x.test'],
    });
    job.startProcessing();
    job.updateUrlResult(0, (result) => ({
      ...result,
      status: UrlStatus.success,
      httpStatus: 200,
      startedAt: new Date(10),
      finishedAt: new Date(40),
      durationMs: 30,
    }));

    await store.update(job);

    const fetched = await store.findById('x');
    expect(fetched?.status).toBe(JobStatus.inProgress);
    expect(fetched?.results[0]).toMatchObject({
      status: UrlStatus.success,
      httpStatus: 200,
      durationMs: 30,
    });
    expect(fetched?.results[0]?.startedAt instanceof Date).toBe(true);
    expect(fetched?.results[0]?.finishedAt?.getTime()).toBe(40);
  });
});
