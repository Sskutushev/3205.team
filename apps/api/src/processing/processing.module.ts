import { Module } from '@nestjs/common';
import {
  CLOCK,
  DELAY_PROVIDER,
  HTTP_CHECKER,
  JOB_QUEUE,
  RANDOM_PROVIDER,
} from '../config/tokens.js';
import { StorageModule } from '../storage/storage.module.js';
import { InMemoryJobQueue } from './adapters/in-memory-job-queue.js';
import { FetchHttpChecker } from './providers/fetch-http-checker.js';
import { NativeRandomProvider } from './providers/native-random-provider.js';
import { NodeDelayProvider } from './providers/node-delay-provider.js';
import { SystemClock } from './providers/system-clock.js';

@Module({
  imports: [StorageModule],
  providers: [
    InMemoryJobQueue,
    FetchHttpChecker,
    NativeRandomProvider,
    NodeDelayProvider,
    SystemClock,
    {
      provide: JOB_QUEUE,
      inject: [InMemoryJobQueue],
      useFactory: (queue: InMemoryJobQueue): InMemoryJobQueue => {
        const driver = process.env.QUEUE_DRIVER ?? 'memory';

        switch (driver) {
          case 'memory':
            return queue;
          case 'bullmq':
            throw new Error(`QUEUE_DRIVER=${driver} is not implemented yet.`);
          default:
            throw new Error(`Unsupported QUEUE_DRIVER: ${driver}`);
        }
      },
    },
    {
      provide: HTTP_CHECKER,
      useExisting: FetchHttpChecker,
    },
    {
      provide: DELAY_PROVIDER,
      useExisting: NodeDelayProvider,
    },
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: RANDOM_PROVIDER,
      useExisting: NativeRandomProvider,
    },
  ],
  exports: [JOB_QUEUE, HTTP_CHECKER, DELAY_PROVIDER, CLOCK, RANDOM_PROVIDER],
})
export class ProcessingModule {}
