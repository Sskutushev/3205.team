import { Module } from '@nestjs/common';
import type { JobStore } from '../domain/index.js';
import { JOB_STORE } from '../config/tokens.js';
import { InMemoryJobStore } from './adapters/in-memory-job-store.js';
import { RedisJobStore } from './adapters/redis-job-store.js';

@Module({
  providers: [
    InMemoryJobStore,
    RedisJobStore,
    {
      provide: JOB_STORE,
      inject: [InMemoryJobStore, RedisJobStore],
      useFactory: (
        memory: InMemoryJobStore,
        redis: RedisJobStore,
      ): JobStore => {
        const driver = process.env.STORAGE_DRIVER ?? 'memory';

        switch (driver) {
          case 'memory':
            return memory;
          case 'redis':
            return redis;
          case 'typeorm':
            // EXTENSION: TypeOrmJobStore for SQL persistence + analytics rollups.
            throw new Error(`STORAGE_DRIVER=${driver} is not implemented yet.`);
          default:
            throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
        }
      },
    },
  ],
  exports: [JOB_STORE],
})
export class StorageModule {}
