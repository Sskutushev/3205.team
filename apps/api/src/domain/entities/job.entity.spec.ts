import { describe, expect, it } from 'vitest';
import { JobStatus, UrlStatus } from '@url-checker/shared';
import { JobEntity } from './job.entity.js';
import { InvalidJobTransitionError } from '../errors/invalid-job-transition.error.js';
import {
  calculateJobSummary,
  deriveJobStatus,
} from '../services/job-summary.js';

describe('JobEntity', () => {
  it('starts in pending state with pending URL results', () => {
    const job = JobEntity.create({
      id: 'job-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    expect(job.status).toBe(JobStatus.pending);
    expect(job.results).toEqual([
      {
        url: 'https://a.test',
        status: UrlStatus.pending,
      },
    ]);
  });

  it('allows pending to in_progress to completed transition', () => {
    const job = JobEntity.create({
      id: 'job-2',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    job.startProcessing();
    job.complete();

    expect(job.status).toBe(JobStatus.completed);
  });

  it('allows cancellation from pending', () => {
    const job = JobEntity.create({
      id: 'job-3',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    job.cancel();

    expect(job.status).toBe(JobStatus.cancelled);
  });

  it('allows failure from pending and in_progress', () => {
    const pendingJob = JobEntity.create({
      id: 'job-4',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    pendingJob.fail();

    const activeJob = JobEntity.create({
      id: 'job-5',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    activeJob.startProcessing();
    activeJob.fail();

    expect(pendingJob.status).toBe(JobStatus.failed);
    expect(activeJob.status).toBe(JobStatus.failed);
  });

  it('rejects forbidden transitions', () => {
    const job = JobEntity.create({
      id: 'job-6',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      urls: ['https://a.test'],
    });

    expect(() => job.complete()).toThrow(InvalidJobTransitionError);

    job.startProcessing();
    job.complete();

    expect(() => job.cancel()).toThrow(InvalidJobTransitionError);
  });
});

describe('deriveJobStatus', () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  it('returns pending for empty results', () => {
    expect(deriveJobStatus([])).toBe(JobStatus.pending);
    expect(
      calculateJobSummary({
        id: 'job-empty',
        createdAt,
        results: [],
      }),
    ).toEqual({
      id: 'job-empty',
      createdAt: createdAt.toISOString(),
      status: JobStatus.pending,
      total: 0,
      successCount: 0,
      errorCount: 0,
    });
  });

  it('returns in_progress while some urls are still pending', () => {
    const summary = calculateJobSummary({
      id: 'job-mixed',
      createdAt,
      results: [
        { url: 'https://a.test', status: UrlStatus.success },
        { url: 'https://b.test', status: UrlStatus.pending },
      ],
    });

    expect(summary.status).toBe(JobStatus.inProgress);
    expect(summary.successCount).toBe(1);
    expect(summary.errorCount).toBe(0);
  });

  it('returns completed when all urls finished with errors', () => {
    const summary = calculateJobSummary({
      id: 'job-errors',
      createdAt,
      results: [
        { url: 'https://a.test', status: UrlStatus.error, error: 'timeout' },
        { url: 'https://b.test', status: UrlStatus.error, error: 'dns' },
      ],
    });

    expect(summary.status).toBe(JobStatus.completed);
    expect(summary.successCount).toBe(0);
    expect(summary.errorCount).toBe(2);
  });

  it('returns cancelled when every url is cancelled', () => {
    expect(
      deriveJobStatus([
        { url: 'https://a.test', status: UrlStatus.cancelled },
        { url: 'https://b.test', status: UrlStatus.cancelled },
      ]),
    ).toBe(JobStatus.cancelled);
  });

  it('returns completed for a single successful url', () => {
    const summary = calculateJobSummary({
      id: 'job-single',
      createdAt,
      results: [{ url: 'https://a.test', status: UrlStatus.success }],
    });

    expect(summary).toEqual({
      id: 'job-single',
      createdAt: createdAt.toISOString(),
      status: JobStatus.completed,
      total: 1,
      successCount: 1,
      errorCount: 0,
    });
  });
});
