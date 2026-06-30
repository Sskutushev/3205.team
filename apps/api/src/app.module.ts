import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ProcessingModule } from './processing/processing.module.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [StorageModule, ProcessingModule, JobsModule, HealthModule],
})
export class AppModule {}
