export interface DelayProvider {
  wait(durationMs: number, signal: AbortSignal): Promise<void>;
}
