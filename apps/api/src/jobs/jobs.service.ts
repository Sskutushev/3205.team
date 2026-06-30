import { randomUUID } from 'node:crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type CreateJobResponse,
  type JobDetails,
  type JobSummary,
  UrlStatus,
} from '@url-checker/shared';
import { CLOCK, JOB_QUEUE, JOB_STORE } from '../config/tokens.js';
import {
  JobEntity,
  type Clock,
  type JobQueue,
  type JobStore,
} from '../domain/index.js';
import { CreateJobDto } from './dto/create-job.dto.js';

@Injectable()
export class JobsService {
  public constructor(
    @Inject(JOB_STORE) private readonly jobStore: JobStore,
    @Inject(JOB_QUEUE) private readonly jobQueue: JobQueue,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  public async createJob(dto: CreateJobDto): Promise<CreateJobResponse> {
    // `dto.urls` is already trimmed, de-duplicated and validated by CreateJobDto.
    const job = JobEntity.create({
      id: randomUUID(),
      createdAt: this.clock.now(),
      urls: dto.urls,
    });

    await this.jobStore.create(job);
    await this.jobQueue.enqueue(job.id);

    return { jobId: job.id };
  }

  public async listJobs(): Promise<JobSummary[]> {
    const jobs = await this.jobStore.list();
    return jobs.map((job) => this.toJobSummary(job));
  }

  public async getJob(jobId: string): Promise<JobDetails> {
    const job = await this.jobStore.findById(jobId);

    if (job === null) {
      throw new NotFoundException(`Job ${jobId} was not found.`);
    }

    return {
      ...this.toJobSummary(job),
      results: job.results.map((result) => ({
        ...result,
        startedAt: result.startedAt?.toISOString(),
        finishedAt: result.finishedAt?.toISOString(),
      })),
    };
  }

  public async cancelJob(jobId: string): Promise<void> {
    const job = await this.jobStore.findById(jobId);

    if (job === null) {
      throw new NotFoundException(`Job ${jobId} was not found.`);
    }

    await this.jobQueue.cancel(jobId);
  }

  private toJobSummary(job: JobEntity): JobSummary {
    const successCount = job.results.filter(
      (result) => result.status === UrlStatus.success,
    ).length;
    const errorCount = job.results.filter(
      (result) => result.status === UrlStatus.error,
    ).length;

    return {
      id: job.id,
      createdAt: job.createdAt.toISOString(),
      status: job.status,
      total: job.totalUrls,
      successCount,
      errorCount,
    };
  }
}
