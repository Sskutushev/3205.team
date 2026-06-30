import { Module } from '@nestjs/common';
import { ProcessingModule } from '../processing/processing.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [StorageModule, ProcessingModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
