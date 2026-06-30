import { UrlStatus } from '@url-checker/shared';

export type UrlResultEntity = {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
};

export function createPendingUrlResult(url: string): UrlResultEntity {
  return {
    url,
    status: UrlStatus.pending,
  };
}
