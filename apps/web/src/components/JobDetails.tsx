import {
  JobStatus,
  UrlStatus,
  type JobDetails as JobDetailsModel,
} from '@url-checker/shared';
import { CancelButton } from './CancelButton.js';

type JobDetailsProps = {
  details: JobDetailsModel | null;
  loading: boolean;
  onCancel: () => Promise<void>;
};

function formatStatus(status: JobStatus | UrlStatus): string {
  return status.replace('_', ' ');
}

function countProcessed(details: JobDetailsModel): number {
  return details.results.filter(
    (result) =>
      result.status !== UrlStatus.pending &&
      result.status !== UrlStatus.inProgress,
  ).length;
}

export function JobDetails({ details, loading, onCancel }: JobDetailsProps) {
  if (details === null) {
    return (
      <section className="panel details-panel">
        <div className="panel-header">
          <p className="eyebrow">Details</p>
          <h2>Select a job to inspect each URL result</h2>
        </div>
      </section>
    );
  }

  const processedCount = countProcessed(details);

  return (
    <section className="panel details-panel">
      <div className="panel-header row-between">
        <div>
          <p className="eyebrow">Active Job</p>
          <h2>{details.id}</h2>
        </div>
        <div className="actions-row">
          <span className={`status-badge status-${details.status}`}>
            {formatStatus(details.status)}
          </span>
          <CancelButton
            disabled={loading}
            onCancel={onCancel}
            status={details.status}
          />
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <span className="metric-label">Progress</span>
          <strong>
            {processedCount} / {details.total}
          </strong>
        </div>
        <div>
          <span className="metric-label">Succeeded</span>
          <strong>{details.successCount}</strong>
        </div>
        <div>
          <span className="metric-label">Errors</span>
          <strong>{details.errorCount}</strong>
        </div>
      </div>

      <div className="result-table">
        <div className="result-table-head">
          <span>URL</span>
          <span>Status</span>
          <span>HTTP</span>
          <span>Duration</span>
          <span>Error</span>
        </div>
        {details.results.map((result) => (
          <div className="result-row" key={`${details.id}-${result.url}`}>
            <span className="url-cell">{result.url}</span>
            <span className={`status-badge status-${result.status}`}>
              {formatStatus(result.status)}
            </span>
            <span>{result.httpStatus ?? '-'}</span>
            <span>
              {result.durationMs === undefined
                ? '-'
                : `${result.durationMs} ms`}
            </span>
            <span className="muted">{result.error ?? '-'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
