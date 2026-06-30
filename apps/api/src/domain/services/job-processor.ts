import { JobStatus, UrlStatus } from '@url-checker/shared';
import type { JobEntity } from '../entities/job.entity.js';
import type { Clock } from '../ports/clock.port.js';
import type { DelayProvider } from '../ports/delay-provider.port.js';
import type { HttpChecker } from '../ports/http-checker.port.js';
import type { JobStore } from '../ports/job-store.port.js';
import type { RandomProvider } from '../ports/random-provider.port.js';
import { deriveJobStatus } from './job-summary.js';

const MAX_CONCURRENCY = 5;
const MAX_DELAY_MS = 10_001;
// EXTENSION: add a global outbound concurrency cap across all jobs.

export type JobProcessorDeps = {
  jobStore: JobStore;
  httpChecker: HttpChecker;
  delayProvider: DelayProvider;
  clock: Clock;
  randomProvider: RandomProvider;
};

export class JobProcessor {
  private readonly abortController = new AbortController();

  private nextIndex = 0;

  public constructor(private readonly deps: JobProcessorDeps) {}

  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public abort(): void {
    this.abortController.abort();
  }

  public async process(job: JobEntity): Promise<void> {
    job.startProcessing();
    await this.deps.jobStore.update(job);

    try {
      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENCY, job.totalUrls) },
        () => this.runWorker(job),
      );

      await Promise.all(workers);
      await this.finishJob(job);
    } catch (error) {
      if (this.signal.aborted) {
        await this.markCancelled(job);
        return;
      }

      job.fail();
      await this.deps.jobStore.update(job);
      throw error;
    }
  }

  private async runWorker(job: JobEntity): Promise<void> {
    while (true) {
      const index = this.takeNextIndex(job.totalUrls);

      if (index === null) {
        return;
      }

      if (this.signal.aborted) {
        this.markNotStartedAsCancelled(job, index);
        await this.deps.jobStore.update(job);
        return;
      }

      await this.processUrl(job, index);
    }
  }

  private takeNextIndex(total: number): number | null {
    if (this.nextIndex >= total) {
      return null;
    }

    const current = this.nextIndex;
    this.nextIndex += 1;
    return current;
  }

  private async processUrl(job: JobEntity, index: number): Promise<void> {
    const startedAt = this.deps.clock.now();

    job.updateUrlResult(index, (result) => ({
      ...result,
      status: UrlStatus.inProgress,
      startedAt,
      error: undefined,
      finishedAt: undefined,
      durationMs: undefined,
      httpStatus: undefined,
    }));
    await this.deps.jobStore.update(job);

    try {
      const result = job.results[index];

      if (result === undefined) {
        throw new Error(`URL result at index ${index} does not exist.`);
      }

      const response = await this.deps.httpChecker.check(
        result.url,
        this.signal,
      );
      const delayMs = this.deps.randomProvider.nextInt(MAX_DELAY_MS);

      await this.deps.delayProvider.wait(delayMs, this.signal);

      const finishedAt = this.deps.clock.now();

      job.updateUrlResult(index, (current) => ({
        ...current,
        status: UrlStatus.success,
        httpStatus: response.statusCode,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      }));
      await this.deps.jobStore.update(job);
    } catch (error) {
      const finishedAt = this.deps.clock.now();

      if (this.signal.aborted) {
        job.updateUrlResult(index, (current) => ({
          ...current,
          status: UrlStatus.cancelled,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          error: undefined,
          httpStatus: undefined,
        }));
        await this.deps.jobStore.update(job);
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown URL check error.';

      job.updateUrlResult(index, (current) => ({
        ...current,
        status: UrlStatus.error,
        error: message,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      }));
      await this.deps.jobStore.update(job);
    }
  }

  private async finishJob(job: JobEntity): Promise<void> {
    const status = deriveJobStatus(job.results);

    if (status === JobStatus.cancelled) {
      await this.markCancelled(job);
      return;
    }

    job.complete();
    await this.deps.jobStore.update(job);
  }

  private async markCancelled(job: JobEntity): Promise<void> {
    this.markNotStartedAsCancelled(job, 0);

    if (job.status !== JobStatus.cancelled) {
      job.cancel();
    }

    await this.deps.jobStore.update(job);
  }

  private markNotStartedAsCancelled(job: JobEntity, fromIndex: number): void {
    for (let index = fromIndex; index < job.totalUrls; index += 1) {
      const result = job.results[index];

      if (result?.status !== UrlStatus.pending) {
        continue;
      }

      job.updateUrlResult(index, (current) => ({
        ...current,
        status: UrlStatus.cancelled,
      }));
    }
  }
}
