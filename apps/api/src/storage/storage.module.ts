import { Module } from '@nestjs/common';
import { JOB_STORE } from '../config/tokens.js';
import { InMemoryJobStore } from './adapters/in-memory-job-store.js';

@Module({
  providers: [
    InMemoryJobStore,
    {
      provide: JOB_STORE,
      inject: [InMemoryJobStore],
      useFactory: (store: InMemoryJobStore): InMemoryJobStore => {
        const driver = process.env.STORAGE_DRIVER ?? 'memory';

        switch (driver) {
          case 'memory':
            return store;
          case 'redis':
          case 'typeorm':
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
