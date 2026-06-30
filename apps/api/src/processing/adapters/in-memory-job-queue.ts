import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { JobStatus, UrlStatus } from '@url-checker/shared';
import {
  CLOCK,
  DELAY_PROVIDER,
  HTTP_CHECKER,
  JOB_STORE,
  RANDOM_PROVIDER,
} from '../../config/tokens.js';
import {
  JobProcessor,
  type Clock,
  type DelayProvider,
  type HttpChecker,
  type JobQueue,
  type JobStore,
  type RandomProvider,
} from '../../domain/index.js';

@Injectable()
export class InMemoryJobQueue implements JobQueue, OnModuleDestroy {
  private readonly processors = new Map<string, JobProcessor>();

  public constructor(
    @Inject(JOB_STORE) private readonly jobStore: JobStore,
    @Inject(HTTP_CHECKER) private readonly httpChecker: HttpChecker,
    @Inject(DELAY_PROVIDER) private readonly delayProvider: DelayProvider,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(RANDOM_PROVIDER) private readonly randomProvider: RandomProvider,
  ) {}

  public async enqueue(jobId: string): Promise<void> {
    queueMicrotask(() => {
      void this.process(jobId);
    });
  }

  public async cancel(jobId: string): Promise<void> {
    const processor = this.processors.get(jobId);

    if (processor !== undefined) {
      processor.abort();
      return;
    }

    const job = await this.jobStore.findById(jobId);

    if (job === null) {
      return;
    }

    if (job.status === JobStatus.completed || job.status === JobStatus.failed) {
      return;
    }

    for (let index = 0; index < job.totalUrls; index += 1) {
      const result = job.results[index];

      if (
        result?.status !== UrlStatus.pending &&
        result?.status !== UrlStatus.inProgress
      ) {
        continue;
      }

      job.updateUrlResult(index, (current) => ({
        ...current,
        status: UrlStatus.cancelled,
      }));
    }

    if (
      job.status === JobStatus.pending ||
      job.status === JobStatus.inProgress
    ) {
      job.cancel();
    }

    await this.jobStore.update(job);
  }

  public async onModuleDestroy(): Promise<void> {
    for (const processor of this.processors.values()) {
      processor.abort();
    }
  }

  private async process(jobId: string): Promise<void> {
    const job = await this.jobStore.findById(jobId);

    if (job === null) {
      return;
    }

    // A DELETE can win the race against this microtask and mark the job
    // cancelled in the store before processing starts. Bail out instead of
    // attempting the forbidden pending->in_progress transition on it.
    if (job.status !== JobStatus.pending) {
      return;
    }

    const processor = new JobProcessor({
      jobStore: this.jobStore,
      httpChecker: this.httpChecker,
      delayProvider: this.delayProvider,
      clock: this.clock,
      randomProvider: this.randomProvider,
    });

    this.processors.set(jobId, processor);

    try {
      await processor.process(job);
    } finally {
      this.processors.delete(jobId);
    }
  }
}
