import { describe, expect, it } from 'vitest';
import { JobStatus, UrlStatus } from '@url-checker/shared';
import { JobEntity } from '../entities/job.entity.js';
import type { Clock } from '../ports/clock.port.js';
import type { DelayProvider } from '../ports/delay-provider.port.js';
import type { HttpChecker } from '../ports/http-checker.port.js';
import type { JobStore } from '../ports/job-store.port.js';
import type { RandomProvider } from '../ports/random-provider.port.js';
import { JobProcessor } from './job-processor.js';

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

class FakeClock implements Clock {
  private currentMs = 0;

  public now(): Date {
    return new Date(this.currentMs);
  }

  public advanceBy(ms: number): void {
    this.currentMs += ms;
  }
}

class InMemoryJobStore implements JobStore {
  public updates = 0;

  public latest: JobEntity | null = null;

  public async create(job: JobEntity): Promise<void> {
    this.latest = JobEntity.restore(job.toState());
  }

  public async update(job: JobEntity): Promise<void> {
    this.updates += 1;
    this.latest = JobEntity.restore(job.toState());
  }

  public async findById(jobId: string): Promise<JobEntity | null> {
    void jobId;
    return this.latest;
  }

  public async list(): Promise<JobEntity[]> {
    return this.latest === null ? [] : [this.latest];
  }
}

class ImmediateDelayProvider implements DelayProvider {
  public constructor(private readonly clock: FakeClock) {}

  public async wait(durationMs: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    this.clock.advanceBy(durationMs);
  }
}

class SequenceRandomProvider implements RandomProvider {
  public constructor(private readonly values: number[]) {}

  private index = 0;

  public nextInt(maxExclusive: number): number {
    void maxExclusive;
    const value = this.values[this.index] ?? 0;
    this.index += 1;
    return value;
  }
}

describe('JobProcessor', () => {
  it('keeps per-job HTTP concurrency at five', async () => {
    const store = new InMemoryJobStore();
    const clock = new FakeClock();
    let active = 0;
    let peak = 0;
    const gate = createDeferred<void>();
    const firstFiveStarted = createDeferred<void>();

    const httpChecker: HttpChecker = {
      check: async () => {
        active += 1;
        peak = Math.max(peak, active);

        if (peak === 5) {
          firstFiveStarted.resolve();
        }

        await gate.promise;
        active -= 1;
        clock.advanceBy(5);

        return { statusCode: 200 };
      },
    };

    const processor = new JobProcessor({
      jobStore: store,
      httpChecker,
      delayProvider: new ImmediateDelayProvider(clock),
      clock,
      randomProvider: new SequenceRandomProvider([0, 0, 0, 0, 0, 0]),
    });
    const job = JobEntity.create({
      id: 'job-concurrency',
      createdAt: new Date(0),
      urls: Array.from(
        { length: 6 },
        (_, index) => `https://example-${index}.test`,
      ),
    });

    const processing = processor.process(job);
    await firstFiveStarted.promise;

    expect(peak).toBe(5);

    gate.resolve();

    await processing;

    expect(job.status).toBe(JobStatus.completed);
    expect(
      job.results.every((result) => result.status === UrlStatus.success),
    ).toBe(true);
  });

  it('cancels in-flight and not-yet-started urls after abort', async () => {
    const store = new InMemoryJobStore();
    const clock = new FakeClock();
    const inFlightRequest = createDeferred<{ statusCode: number }>();
    const firstStarted = createDeferred<void>();
    let started = 0;

    const httpChecker: HttpChecker = {
      check: async (_url, signal) => {
        started += 1;

        if (started === 1) {
          firstStarted.resolve();
          signal.addEventListener(
            'abort',
            () => inFlightRequest.reject(new Error('Aborted')),
            {
              once: true,
            },
          );

          return await inFlightRequest.promise;
        }

        return { statusCode: 200 };
      },
    };

    const delayProvider: DelayProvider = {
      wait: async (_durationMs, signal) => {
        if (signal.aborted) {
          throw new Error('Aborted');
        }
      },
    };

    const processor = new JobProcessor({
      jobStore: store,
      httpChecker,
      delayProvider,
      clock,
      randomProvider: new SequenceRandomProvider([0, 0, 0, 0, 0, 0]),
    });
    const job = JobEntity.create({
      id: 'job-cancel',
      createdAt: new Date(0),
      urls: Array.from(
        { length: 6 },
        (_, index) => `https://cancel-${index}.test`,
      ),
    });

    const processing = processor.process(job);
    await firstStarted.promise;

    processor.abort();
    await processing;

    expect(job.status).toBe(JobStatus.cancelled);
    expect(
      job.results.every((result) => result.status === UrlStatus.cancelled),
    ).toBe(true);
  });

  it('records duration from start to finish for successful urls', async () => {
    const store = new InMemoryJobStore();
    const clock = new FakeClock();
    const httpChecker: HttpChecker = {
      check: async () => {
        clock.advanceBy(25);
        return { statusCode: 204 };
      },
    };

    const processor = new JobProcessor({
      jobStore: store,
      httpChecker,
      delayProvider: new ImmediateDelayProvider(clock),
      clock,
      randomProvider: new SequenceRandomProvider([40]),
    });
    const job = JobEntity.create({
      id: 'job-duration',
      createdAt: new Date(0),
      urls: ['https://duration.test'],
    });

    await processor.process(job);

    expect(job.status).toBe(JobStatus.completed);
    expect(job.results[0]).toMatchObject({
      status: UrlStatus.success,
      httpStatus: 204,
      durationMs: 65,
    });
  });
});
