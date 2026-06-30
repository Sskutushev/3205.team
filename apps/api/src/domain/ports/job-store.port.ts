import type { JobEntity } from '../entities/job.entity.js';

export interface JobStore {
  create(job: JobEntity): Promise<void>;
  update(job: JobEntity): Promise<void>;
  findById(jobId: string): Promise<JobEntity | null>;
  list(): Promise<JobEntity[]>;
}
