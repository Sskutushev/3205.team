import { JobStatus } from '@url-checker/shared';
import { InvalidJobTransitionError } from '../errors/invalid-job-transition.error.js';
import {
  createPendingUrlResult,
  type UrlResultEntity,
} from './url-result.entity.js';

const ALLOWED_TRANSITIONS: Record<JobStatus, ReadonlySet<JobStatus>> = {
  [JobStatus.pending]: new Set([
    JobStatus.inProgress,
    JobStatus.cancelled,
    JobStatus.failed,
  ]),
  [JobStatus.inProgress]: new Set([
    JobStatus.completed,
    JobStatus.cancelled,
    JobStatus.failed,
  ]),
  [JobStatus.completed]: new Set(),
  [JobStatus.cancelled]: new Set(),
  [JobStatus.failed]: new Set(),
};

export type JobEntityState = {
  id: string;
  createdAt: Date;
  status: JobStatus;
  results: UrlResultEntity[];
};

export class JobEntity {
  public readonly id: string;

  public readonly createdAt: Date;

  private statusValue: JobStatus;

  private readonly resultsValue: UrlResultEntity[];

  private constructor(state: JobEntityState) {
    this.id = state.id;
    this.createdAt = new Date(state.createdAt);
    this.statusValue = state.status;
    this.resultsValue = state.results.map((result) => ({
      ...result,
      startedAt:
        result.startedAt === undefined ? undefined : new Date(result.startedAt),
      finishedAt:
        result.finishedAt === undefined
          ? undefined
          : new Date(result.finishedAt),
    }));
  }

  public static create(params: {
    id: string;
    createdAt: Date;
    urls: string[];
  }): JobEntity {
    return new JobEntity({
      id: params.id,
      createdAt: params.createdAt,
      status: JobStatus.pending,
      results: params.urls.map((url) => createPendingUrlResult(url)),
    });
  }

  public static restore(state: JobEntityState): JobEntity {
    return new JobEntity(state);
  }

  public get status(): JobStatus {
    return this.statusValue;
  }

  public get results(): UrlResultEntity[] {
    return this.resultsValue.map((result) => ({ ...result }));
  }

  public startProcessing(): void {
    this.transitionTo(JobStatus.inProgress);
  }

  public complete(): void {
    this.transitionTo(JobStatus.completed);
  }

  public fail(): void {
    this.transitionTo(JobStatus.failed);
  }

  public cancel(): void {
    this.transitionTo(JobStatus.cancelled);
  }

  public toState(): JobEntityState {
    return {
      id: this.id,
      createdAt: new Date(this.createdAt),
      status: this.statusValue,
      results: this.results,
    };
  }

  private transitionTo(nextStatus: JobStatus): void {
    const allowedTransitions = ALLOWED_TRANSITIONS[this.statusValue];

    if (!allowedTransitions.has(nextStatus)) {
      throw new InvalidJobTransitionError(this.statusValue, nextStatus);
    }

    this.statusValue = nextStatus;
  }
}
