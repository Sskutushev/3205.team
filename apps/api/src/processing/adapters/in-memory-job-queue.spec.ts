import { JobStatus } from '@url-checker/shared';
import { describe, expect, it, vi } from 'vitest';
import { JobEntity } from '../../domain/index.js';
import type {
  Clock,
  DelayProvider,
  HttpChecker,
  RandomProvider,
} from '../../domain/index.js';
import { InMemoryJobStore } from '../../storage/adapters/in-memory-job-store.js';
import { InMemoryJobQueue } from './in-memory-job-queue.js';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('InMemoryJobQueue', () => {
  it('skips processing when a job is cancelled before it starts', async () => {
    const store = new InMemoryJobStore();
    const check = vi.fn<HttpChecker['check']>(async () => ({
      statusCode: 200,
    }));
    const httpChecker: HttpChecker = { check };
    const delayProvider: DelayProvider = { wait: async () => undefined };
    const clock: Clock = { now: () => new Date(0) };
    const randomProvider: RandomProvider = { nextInt: () => 0 };

    const queue = new InMemoryJobQueue(
      store,
      httpChecker,
      delayProvider,
      clock,
      randomProvider,
    );

    const job = JobEntity.create({
      id: 'race',
      createdAt: new Date(0),
      urls: ['https://race.test'],
    });
    await store.create(job);

    // DELETE wins the race before processing is registered.
    await queue.cancel('race');
    await queue.enqueue('race');
    await flushMicrotasks();

    const stored = await store.findById('race');
    expect(stored?.status).toBe(JobStatus.cancelled);
    // The forbidden transition never runs because processing is skipped.
    expect(check).not.toHaveBeenCalled();
  });
});
