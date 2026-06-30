export const LANGUAGES = ['en', 'es', 'ru', 'de', 'zh'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Flat translation dictionary. Keys are dot-namespaced for readability only;
 * lookups are plain object access. A `{value}` placeholder is interpolated by
 * {@link translate}.
 *
 * Kept intentionally dependency-free (no i18next) so the bundle and Docker
 * image stay lean. The shape is a drop-in for a future react-i18next swap.
 */
export type TranslationKey =
  | 'app.title'
  | 'app.subtitle'
  | 'topbar.brand'
  | 'topbar.theme.toLight'
  | 'topbar.theme.toDark'
  | 'topbar.language'
  | 'create.eyebrow'
  | 'create.title'
  | 'create.label'
  | 'create.placeholder'
  | 'create.hint'
  | 'create.submit'
  | 'create.submitting'
  | 'list.eyebrow'
  | 'list.title'
  | 'list.total'
  | 'list.refreshing'
  | 'list.empty'
  | 'list.urls'
  | 'list.ok'
  | 'list.errors'
  | 'details.eyebrow.empty'
  | 'details.empty.title'
  | 'details.empty.subtitle'
  | 'details.eyebrow.active'
  | 'details.progress'
  | 'details.succeeded'
  | 'details.errors'
  | 'details.cancel'
  | 'details.cancelling'
  | 'table.url'
  | 'table.status'
  | 'table.http'
  | 'table.duration'
  | 'table.error'
  | 'status.pending'
  | 'status.in_progress'
  | 'status.completed'
  | 'status.cancelled'
  | 'status.failed'
  | 'status.success'
  | 'status.error'
  | 'units.ms'
  | 'toast.error.network'
  | 'toast.error.invalidUrls'
  | 'toast.error.emptyUrls'
  | 'toast.error.notFound'
  | 'toast.error.server'
  | 'toast.error.generic'
  | 'toast.success.created'
  | 'toast.success.cancelled'
  | 'toast.dismiss';

export type Dictionary = Record<TranslationKey, string>;
