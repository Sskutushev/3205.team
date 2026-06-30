import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  LoaderCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { JobStatus, UrlStatus } from '@url-checker/shared';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/types.js';

type Status = JobStatus | UrlStatus;

type StatusMeta = { Icon: LucideIcon; key: TranslationKey; spin?: boolean };

// JobStatus and UrlStatus share string values (pending/in_progress/cancelled),
// so a single value-keyed map covers both enums without duplicate keys.
const META: Record<string, StatusMeta> = {
  pending: { Icon: Clock, key: 'status.pending' },
  in_progress: { Icon: LoaderCircle, key: 'status.in_progress', spin: true },
  completed: { Icon: CheckCircle2, key: 'status.completed' },
  cancelled: { Icon: Ban, key: 'status.cancelled' },
  failed: { Icon: XCircle, key: 'status.failed' },
  success: { Icon: CheckCircle2, key: 'status.success' },
  error: { Icon: AlertTriangle, key: 'status.error' },
};

const FALLBACK: StatusMeta = { Icon: AlertTriangle, key: 'status.error' };

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation();
  const { Icon, key, spin } = META[status] ?? FALLBACK;

  return (
    <span className={`status-badge status-${status}`}>
      <Icon className={spin ? 'spin' : undefined} size={14} strokeWidth={2.4} />
      {t(key)}
    </span>
  );
}
