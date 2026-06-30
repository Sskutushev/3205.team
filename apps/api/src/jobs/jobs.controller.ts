import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import type {
  CreateJobResponse,
  JobDetails,
  JobSummary,
} from '@url-checker/shared';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JobsService } from './jobs.service.js';

@Controller('api/jobs')
export class JobsController {
  public constructor(
    @Inject(JobsService) private readonly jobsService: JobsService,
  ) {}

  @Post()
  public async createJob(
    @Body() dto: CreateJobDto,
  ): Promise<CreateJobResponse> {
    return this.jobsService.createJob(dto);
  }

  @Get()
  public async listJobs(): Promise<JobSummary[]> {
    return this.jobsService.listJobs();
  }

  @Get(':id')
  public async getJob(@Param('id') id: string): Promise<JobDetails> {
    return this.jobsService.getJob(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async cancelJob(@Param('id') id: string): Promise<void> {
    await this.jobsService.cancelJob(id);
  }
}
