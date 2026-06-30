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

export function updateUrlResult(
  current: UrlResultEntity,
  updater: (result: UrlResultEntity) => UrlResultEntity,
): UrlResultEntity {
  const next = updater({ ...current });

  return {
    ...next,
    startedAt:
      next.startedAt === undefined ? undefined : new Date(next.startedAt),
    finishedAt:
      next.finishedAt === undefined ? undefined : new Date(next.finishedAt),
  };
}
