import { CheckCircle2, History, Inbox, Link2, XCircle } from 'lucide-react';
import { type JobSummary } from '@url-checker/shared';
import { useTranslation } from '../i18n/I18nProvider.js';
import { StatusBadge } from './StatusBadge.js';

type JobListProps = {
  activeJobId: string | null;
  jobs: JobSummary[];
  loading: boolean;
  onSelect: (jobId: string) => void;
};

export function JobList({
  activeJobId,
  jobs,
  loading,
  onSelect,
}: JobListProps) {
  const { t, language } = useTranslation();

  return (
    <section className="panel list-panel">
      <div className="panel-header row-between">
        <div>
          <p className="eyebrow">
            <History size={13} strokeWidth={2.6} />
            {t('list.eyebrow')}
          </p>
          <h2>{t('list.title')}</h2>
        </div>
        <span className="muted">
          {loading
            ? t('list.refreshing')
            : t('list.total', { value: jobs.length })}
        </span>
      </div>

      <div className="job-list scroll-area">
        {jobs.length === 0 ? (
          <div className="empty-block">
            <Inbox size={26} strokeWidth={1.6} />
            <p>{t('list.empty')}</p>
          </div>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              className={`job-card${job.id === activeJobId ? ' is-active' : ''}`}
              onClick={() => onSelect(job.id)}
              type="button"
            >
              <div className="row-between">
                <span className="job-id">{job.id.slice(0, 8)}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="muted job-date">
                {new Date(job.createdAt).toLocaleString(language)}
              </p>
              <div className="stats-row">
                <span className="stat">
                  <Link2 size={13} strokeWidth={2.2} />
                  {t('list.urls', { value: job.total })}
                </span>
                <span className="stat stat-ok">
                  <CheckCircle2 size={13} strokeWidth={2.4} />
                  {t('list.ok', { value: job.successCount })}
                </span>
                <span className="stat stat-error">
                  <XCircle size={13} strokeWidth={2.4} />
                  {t('list.errors', { value: job.errorCount })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
