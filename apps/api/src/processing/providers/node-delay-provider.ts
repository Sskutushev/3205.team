import { Injectable } from '@nestjs/common';
import type { DelayProvider } from '../../domain/index.js';

@Injectable()
export class NodeDelayProvider implements DelayProvider {
  public async wait(durationMs: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    await new Promise<void>((resolve, reject) => {
      const onAbort = (): void => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      };

      const timeoutId = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, durationMs);

      signal.addEventListener('abort', onAbort, { once: true });
    });
  }
}
