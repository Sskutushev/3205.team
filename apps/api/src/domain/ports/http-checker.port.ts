export type HttpCheckResult = {
  statusCode: number;
};

export interface HttpChecker {
  check(url: string, signal: AbortSignal): Promise<HttpCheckResult>;
}
