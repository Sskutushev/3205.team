import { JobStatus } from '@url-checker/shared';

export class InvalidJobTransitionError extends Error {
  public constructor(from: JobStatus, to: JobStatus) {
    super(`Cannot transition job from ${from} to ${to}.`);
    this.name = 'InvalidJobTransitionError';
  }
}
