import type { TranslationKey } from '../i18n/types.js';
import { ApiError } from './api.js';

/**
 * Maps any thrown error to a single user-friendly translation key. Raw
 * technical messages (e.g. "Request failed with status 405") never reach the
 * UI — every failure resolves to one of these understandable messages.
 */
export function toErrorMessageKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.statusCode === 0) {
      return 'toast.error.network';
    }

    if (error.statusCode === 400 || error.statusCode === 422) {
      return 'toast.error.invalidUrls';
    }

    if (error.statusCode === 404) {
      return 'toast.error.notFound';
    }

    if (error.statusCode >= 500) {
      return 'toast.error.server';
    }

    return 'toast.error.generic';
  }

  // Native fetch network failures surface as TypeError before reaching ApiError.
  if (error instanceof TypeError) {
    return 'toast.error.network';
  }

  return 'toast.error.generic';
}
