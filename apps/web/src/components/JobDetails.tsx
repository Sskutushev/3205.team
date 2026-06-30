import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Loader2,
  MousePointerClick,
} from 'lucide-react';
import {
  UrlStatus,
  type JobDetails as JobDetailsModel,
} from '@url-checker/shared';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CancelButton } from './CancelButton.js';
import { StatusBadge } from './StatusBadge.js';

type JobDetailsProps = {
  details: JobDetailsModel | null;
  loading: boolean;
  onCancel: () => Promise<void>;
};

function countProcessed(details: JobDetailsModel): number {
  return details.results.filter(
    (result) =>
      result.status !== UrlStatus.pending &&
      result.status !== UrlStatus.inProgress,
  ).length;
}

export function JobDetails({ details, loading, onCancel }: JobDetailsProps) {
  const { t } = useTranslation();

  if (details === null) {
    return (
      <section className="panel details-panel details-empty">
        <div className="empty-block">
          <MousePointerClick size={30} strokeWidth={1.6} />
          <h2>{t('details.empty.title')}</h2>
          <p className="muted">{t('details.empty.subtitle')}</p>
        </div>
      </section>
    );
  }

  const processedCount = countProcessed(details);
  const progressPercent =
    details.total === 0
      ? 0
      : Math.round((processedCount / details.total) * 100);

  return (
    <section className="panel details-panel">
      <div className="panel-header details-header">
        <div className="details-title">
          <p className="eyebrow">{t('details.eyebrow.active')}</p>
          <h2 className="job-id">{details.id}</h2>
        </div>
        <div className="actions-row">
          <StatusBadge status={details.status} />
          <CancelButton
            disabled={loading}
            onCancel={onCancel}
            status={details.status}
          />
        </div>
      </div>

      <div className="summary-grid">
        <div className="metric">
          <span className="metric-label">
            <ListChecks size={14} strokeWidth={2.2} />
            {t('details.progress')}
          </span>
          <strong>
            {processedCount} / {details.total}
          </strong>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="metric">
          <span className="metric-label metric-ok">
            <CheckCircle2 size={14} strokeWidth={2.4} />
            {t('details.succeeded')}
          </span>
          <strong>{details.successCount}</strong>
        </div>
        <div className="metric">
          <span className="metric-label metric-error">
            <AlertTriangle size={14} strokeWidth={2.4} />
            {t('details.errors')}
          </span>
          <strong>{details.errorCount}</strong>
        </div>
      </div>

      <div className="result-table scroll-area">
        <div className="result-table-head">
          <span>{t('table.url')}</span>
          <span>{t('table.status')}</span>
          <span>{t('table.http')}</span>
          <span>{t('table.duration')}</span>
          <span>{t('table.error')}</span>
        </div>
        {details.results.map((result) => (
          <div className="result-row" key={`${details.id}-${result.url}`}>
            <span className="url-cell" title={result.url}>
              {result.url}
            </span>
            <span className="cell-status">
              <StatusBadge status={result.status} />
            </span>
            <span className="cell-http" data-label={t('table.http')}>
              {result.httpStatus ?? '—'}
            </span>
            <span className="cell-duration" data-label={t('table.duration')}>
              {result.status === UrlStatus.inProgress ? (
                <Loader2 className="spin" size={14} strokeWidth={2.4} />
              ) : result.durationMs === undefined ? (
                '—'
              ) : (
                t('units.ms', { value: result.durationMs })
              )}
            </span>
            <span className="muted cell-error" data-label={t('table.error')}>
              {result.error ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
