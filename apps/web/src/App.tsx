import { useEffect } from 'react';
import { CreateJobForm } from './components/CreateJobForm.js';
import { JobDetails } from './components/JobDetails.js';
import { JobList } from './components/JobList.js';
import { useJobsStore } from './store/jobs.js';
import './App.css';

export function App() {
  const {
    activeJobDetails,
    activeJobId,
    cancelActiveJob,
    createJob,
    error,
    jobs,
    jobsLoading,
    loading,
    refreshJobs,
    selectJob,
    stopPolling,
  } = useJobsStore();

  useEffect(() => {
    void refreshJobs();

    return () => {
      stopPolling();
    };
  }, [refreshJobs, stopPolling]);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Async URL Verification</p>
        <h1>Track long-running HEAD checks without stale UI updates.</h1>
        <p>
          Submit a batch, watch per-URL progress, and switch between jobs
          safely. The active view ignores delayed responses from stale polling
          cycles.
        </p>
      </header>

      {error === null ? null : <div className="flash-error">{error}</div>}

      <section className="dashboard">
        <div className="sidebar">
          <CreateJobForm disabled={loading} onSubmit={createJob} />
          <JobList
            activeJobId={activeJobId}
            jobs={jobs}
            loading={jobsLoading}
            onSelect={(jobId) => void selectJob(jobId)}
          />
        </div>
        <div className="content">
          <JobDetails
            details={activeJobDetails}
            loading={loading}
            onCancel={cancelActiveJob}
          />
        </div>
      </section>
    </main>
  );
}
