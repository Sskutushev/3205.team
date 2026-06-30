import { create } from 'zustand';
import {
  JobStatus,
  UrlStatus,
  type JobDetails,
  type JobSummary,
} from '@url-checker/shared';
import { ApiError, createApiClient } from '../lib/api.js';

const POLL_INTERVAL_MS = 1500;

const api = createApiClient();

type JobsState = {
  jobs: JobSummary[];
  activeJobId: string | null;
  activeJobDetails: JobDetails | null;
  loading: boolean;
  jobsLoading: boolean;
  error: string | null;
  pollEpoch: number;
  pollRequest: AbortController | null;
  pollTimer: number | null;
  jobsRequest: AbortController | null;
  createJob: (rawInput: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  selectJob: (jobId: string) => Promise<void>;
  cancelActiveJob: () => Promise<void>;
  stopPolling: () => void;
};

function isTerminalStatus(status: JobStatus): boolean {
  return (
    status === JobStatus.completed ||
    status === JobStatus.cancelled ||
    status === JobStatus.failed
  );
}

function toCancelledJob(details: JobDetails): JobDetails {
  return {
    ...details,
    status: JobStatus.cancelled,
    results: details.results.map((result) =>
      result.status === UrlStatus.pending ||
      result.status === UrlStatus.inProgress
        ? {
            ...result,
            status: UrlStatus.cancelled,
          }
        : result,
    ),
  };
}

function updateJobList(jobs: JobSummary[], next: JobSummary): JobSummary[] {
  const filtered = jobs.filter((job) => job.id !== next.id);
  return [next, ...filtered].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

function normalizeUrls(rawInput: string): string[] {
  return rawInput
    .split(/\r?\n/u)
    .map((url) => url.trim())
    .filter((url) => url !== '');
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  activeJobDetails: null,
  loading: false,
  jobsLoading: false,
  error: null,
  pollEpoch: 0,
  pollRequest: null,
  pollTimer: null,
  jobsRequest: null,

  async createJob(rawInput) {
    const urls = normalizeUrls(rawInput);

    set({ error: null, loading: true });

    try {
      const response = await api.createJob({ urls });
      await get().selectJob(response.jobId);
      await get().refreshJobs();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create job.',
      });
    } finally {
      set({ loading: false });
    }
  },

  async refreshJobs() {
    get().jobsRequest?.abort();
    const controller = new AbortController();

    set({ jobsLoading: true, jobsRequest: controller });

    try {
      const jobs = await api.getJobs(controller.signal);
      set((state) => ({
        jobs,
        jobsLoading: false,
        jobsRequest:
          state.jobsRequest === controller ? null : state.jobsRequest,
      }));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      set({
        error: error instanceof Error ? error.message : 'Failed to load jobs.',
        jobsLoading: false,
        jobsRequest: null,
      });
    }
  },

  async selectJob(jobId) {
    const nextEpoch = get().pollEpoch + 1;
    get().stopPolling();

    set({
      activeJobId: jobId,
      error: null,
      loading: true,
      pollEpoch: nextEpoch,
    });

    const poll = async (epoch: number): Promise<void> => {
      const requestController = new AbortController();

      set({ pollRequest: requestController, pollEpoch: epoch });

      try {
        const details = await api.getJob(jobId, requestController.signal);

        if (get().activeJobId !== jobId || get().pollEpoch !== epoch) {
          return;
        }

        set((state) => ({
          activeJobDetails: details,
          jobs: updateJobList(state.jobs, {
            id: details.id,
            createdAt: details.createdAt,
            status: details.status,
            total: details.total,
            successCount: details.successCount,
            errorCount: details.errorCount,
          }),
          loading: false,
          pollRequest: null,
        }));

        if (isTerminalStatus(details.status)) {
          set({ pollTimer: null });
          return;
        }

        const timer = window.setTimeout(() => {
          void poll(epoch);
        }, POLL_INTERVAL_MS);

        set({ pollTimer: timer });
      } catch (error) {
        if (requestController.signal.aborted) {
          return;
        }

        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load job details.',
          loading: false,
          pollRequest: null,
          pollTimer: null,
        });
      }
    };

    await poll(nextEpoch);
  },

  async cancelActiveJob() {
    const { activeJobDetails, activeJobId } = get();

    if (activeJobId === null || activeJobDetails === null) {
      return;
    }

    get().stopPolling();

    set((state) => ({
      activeJobDetails: toCancelledJob(activeJobDetails),
      jobs: updateJobList(state.jobs, {
        ...activeJobDetails,
        status: JobStatus.cancelled,
      }),
      error: null,
    }));

    try {
      await api.cancelJob(activeJobId);
      await get().refreshJobs();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to cancel the active job.';
      set({ error: message });
      await get().selectJob(activeJobId);
    }
  },

  stopPolling() {
    const { pollRequest, pollTimer } = get();

    pollRequest?.abort();

    if (pollTimer !== null) {
      window.clearTimeout(pollTimer);
    }

    set((state) => ({
      pollEpoch: state.pollEpoch + 1,
      pollRequest: null,
      pollTimer: null,
    }));
  },
}));
