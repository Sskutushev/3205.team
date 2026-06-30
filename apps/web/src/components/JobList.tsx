import { JobStatus, type JobSummary } from '@url-checker/shared';

type JobListProps = {
  activeJobId: string | null;
  jobs: JobSummary[];
  loading: boolean;
  onSelect: (jobId: string) => void;
};

function formatStatus(status: JobStatus): string {
  return status.replace('_', ' ');
}

export function JobList({
  activeJobId,
  jobs,
  loading,
  onSelect,
}: JobListProps) {
  return (
    <section className="panel">
      <div className="panel-header row-between">
        <div>
          <p className="eyebrow">Jobs</p>
          <h2>Recent runs</h2>
        </div>
        <span className="muted">
          {loading ? 'Refreshing...' : `${jobs.length} total`}
        </span>
      </div>
      <div className="job-list">
        {jobs.length === 0 ? (
          <p className="empty-state">
            Create your first job to see live progress here.
          </p>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              className={`job-card${job.id === activeJobId ? ' is-active' : ''}`}
              onClick={() => onSelect(job.id)}
              type="button"
            >
              <div className="row-between">
                <strong>{job.id.slice(0, 8)}</strong>
                <span className={`status-badge status-${job.status}`}>
                  {formatStatus(job.status)}
                </span>
              </div>
              <p className="muted">
                {new Date(job.createdAt).toLocaleString()}
              </p>
              <div className="stats-row">
                <span>{job.total} URLs</span>
                <span>{job.successCount} ok</span>
                <span>{job.errorCount} error</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
