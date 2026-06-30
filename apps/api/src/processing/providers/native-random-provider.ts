import { Injectable } from '@nestjs/common';
import type { RandomProvider } from '../../domain/index.js';

@Injectable()
export class NativeRandomProvider implements RandomProvider {
  public nextInt(maxExclusive: number): number {
    return Math.floor(Math.random() * maxExclusive);
  }
}
