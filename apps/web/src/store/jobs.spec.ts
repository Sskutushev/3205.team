import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JobStatus,
  UrlStatus,
  type JobDetails,
  type JobSummary,
} from '@url-checker/shared';
import type { ApiClient } from '../lib/api.js';
import { createJobsStore } from './jobs.js';

function createJobSummary(overrides?: Partial<JobSummary>): JobSummary {
  return {
    id: 'job-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: JobStatus.pending,
    total: 1,
    successCount: 0,
    errorCount: 0,
    ...overrides,
  };
}

function createJobDetails(overrides?: Partial<JobDetails>): JobDetails {
  return {
    ...createJobSummary(),
    results: [
      {
        url: 'https://example.com',
        status: UrlStatus.pending,
      },
    ],
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, reject, resolve };
}

describe('jobs store', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('ignores stale job details after switching the active job', async () => {
    const firstRequest = createDeferred<JobDetails>();
    const secondRequest = createDeferred<JobDetails>();

    const api: ApiClient = {
      cancelJob: vi.fn(),
      createJob: vi.fn(),
      getJobs: vi.fn(),
      getJob: vi
        .fn()
        .mockImplementationOnce(() => firstRequest.promise)
        .mockImplementationOnce(() => secondRequest.promise),
    };

    const store = createJobsStore(api);

    const firstSelection = store.getState().selectJob('job-1');
    const secondSelection = store.getState().selectJob('job-2');

    secondRequest.resolve(
      createJobDetails({
        id: 'job-2',
        status: JobStatus.completed,
        results: [
          {
            url: 'https://two.test',
            status: UrlStatus.success,
            httpStatus: 200,
          },
        ],
      }),
    );

    await secondSelection;

    firstRequest.resolve(
      createJobDetails({
        id: 'job-1',
        status: JobStatus.completed,
        results: [
          {
            url: 'https://one.test',
            status: UrlStatus.success,
            httpStatus: 200,
          },
        ],
      }),
    );

    await firstSelection;

    expect(store.getState().activeJobId).toBe('job-2');
    expect(store.getState().activeJobDetails?.id).toBe('job-2');
  });

  it('stops polling and marks pending urls cancelled optimistically', async () => {
    vi.useFakeTimers();

    const api: ApiClient = {
      cancelJob: vi.fn().mockResolvedValue(undefined),
      createJob: vi.fn(),
      getJobs: vi.fn().mockResolvedValue([]),
      getJob: vi.fn().mockResolvedValue(
        createJobDetails({
          id: 'job-1',
          status: JobStatus.inProgress,
          results: [
            { url: 'https://one.test', status: UrlStatus.inProgress },
            { url: 'https://two.test', status: UrlStatus.pending },
          ],
          total: 2,
        }),
      ),
    };

    const store = createJobsStore(api);
    await store.getState().selectJob('job-1');

    expect(store.getState().pollTimer).not.toBeNull();

    await store.getState().cancelActiveJob();

    expect(store.getState().pollTimer).toBeNull();
    expect(store.getState().activeJobDetails?.status).toBe(JobStatus.cancelled);
    expect(
      store.getState().activeJobDetails?.results.map((result) => result.status),
    ).toEqual([UrlStatus.cancelled, UrlStatus.cancelled]);
  });
});
