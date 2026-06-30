export enum JobStatus {
  pending = 'pending',
  inProgress = 'in_progress',
  completed = 'completed',
  cancelled = 'cancelled',
  failed = 'failed',
}

export enum UrlStatus {
  pending = 'pending',
  inProgress = 'in_progress',
  success = 'success',
  error = 'error',
  cancelled = 'cancelled',
}

export type UrlResult = {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};

export type Job = {
  id: string;
  createdAt: string;
  status: JobStatus;
  results: UrlResult[];
};

export type CreateJobRequest = {
  urls: string[];
};

export type CreateJobResponse = {
  jobId: string;
};

export type JobSummary = {
  id: string;
  createdAt: string;
  status: JobStatus;
  total: number;
  successCount: number;
  errorCount: number;
};

export type JobDetails = JobSummary & {
  results: UrlResult[];
};
