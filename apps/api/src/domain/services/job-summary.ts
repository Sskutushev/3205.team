import { JobStatus, UrlStatus, type JobSummary } from '@url-checker/shared';
import type { UrlResultEntity } from '../entities/url-result.entity.js';

export function deriveJobStatus(results: UrlResultEntity[]): JobStatus {
  if (results.length === 0) {
    return JobStatus.pending;
  }

  const statuses = results.map((result) => result.status);

  if (statuses.every((status) => status === UrlStatus.pending)) {
    return JobStatus.pending;
  }

  if (statuses.some((status) => status === UrlStatus.inProgress)) {
    return JobStatus.inProgress;
  }

  if (statuses.some((status) => status === UrlStatus.pending)) {
    return JobStatus.inProgress;
  }

  if (statuses.every((status) => status === UrlStatus.cancelled)) {
    return JobStatus.cancelled;
  }

  return JobStatus.completed;
}

export function calculateJobSummary(params: {
  id: string;
  createdAt: Date;
  results: UrlResultEntity[];
}): JobSummary {
  const successCount = params.results.filter(
    (result) => result.status === UrlStatus.success,
  ).length;
  const errorCount = params.results.filter(
    (result) => result.status === UrlStatus.error,
  ).length;

  return {
    id: params.id,
    createdAt: params.createdAt.toISOString(),
    status: deriveJobStatus(params.results),
    total: params.results.length,
    successCount,
    errorCount,
  };
}
