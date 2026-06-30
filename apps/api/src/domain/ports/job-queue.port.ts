export interface JobQueue {
  enqueue(jobId: string): Promise<void>;
  cancel(jobId: string): Promise<void>;
}
