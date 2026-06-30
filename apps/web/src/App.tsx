import { useEffect } from 'react';
import { CreateJobForm } from './components/CreateJobForm.js';
import { JobDetails } from './components/JobDetails.js';
import { JobList } from './components/JobList.js';
import { Toaster } from './components/Toaster.js';
import { TopBar } from './components/TopBar.js';
import { useTranslation } from './i18n/I18nProvider.js';
import { useJobsStore } from './store/jobs.js';
import './App.css';

export function App() {
  const { t } = useTranslation();
  const {
    activeJobDetails,
    activeJobId,
    cancelActiveJob,
    createJob,
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
    <div className="app-shell">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-blob-1" />
        <span className="aurora-blob aurora-blob-2" />
        <span className="aurora-blob aurora-blob-3" />
      </div>

      <TopBar />

      <main className="workspace">
        <section className="intro">
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </section>

        <div className="dashboard">
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
        </div>
      </main>

      <Toaster />
    </div>
  );
}
