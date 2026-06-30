import { Injectable } from '@nestjs/common';
import { JobEntity, type JobStore } from '../../domain/index.js';

@Injectable()
export class InMemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, JobEntity>();

  public async create(job: JobEntity): Promise<void> {
    this.jobs.set(job.id, JobEntity.restore(job.toState()));
  }

  public async update(job: JobEntity): Promise<void> {
    this.jobs.set(job.id, JobEntity.restore(job.toState()));
  }

  public async findById(jobId: string): Promise<JobEntity | null> {
    const job = this.jobs.get(jobId);
    return job === undefined ? null : JobEntity.restore(job.toState());
  }

  public async list(): Promise<JobEntity[]> {
    return Array.from(this.jobs.values())
      .map((job) => JobEntity.restore(job.toState()))
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }
}
