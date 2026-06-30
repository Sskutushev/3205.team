import { Injectable } from '@nestjs/common';
import type { HttpCheckResult, HttpChecker } from '../../domain/index.js';

@Injectable()
export class FetchHttpChecker implements HttpChecker {
  public async check(
    url: string,
    signal: AbortSignal,
  ): Promise<HttpCheckResult> {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
    });

    return { statusCode: response.status };
  }
}
