import { create } from 'zustand';
import {
  JobStatus,
  UrlStatus,
  type JobDetails,
  type JobSummary,
} from '@url-checker/shared';
import { createApiClient, type ApiClient } from '../lib/api.js';
import { toErrorMessageKey } from '../lib/errors.js';
import { useToastStore } from './toasts.js';

const POLL_INTERVAL_MS = 1500;

function notifyError(error: unknown): void {
  useToastStore.getState().pushError(toErrorMessageKey(error));
}

type JobsState = {
  jobs: JobSummary[];
  activeJobId: string | null;
  activeJobDetails: JobDetails | null;
  loading: boolean;
  jobsLoading: boolean;
  pollEpoch: number;
  pollRequest: AbortController | null;
  pollTimer: ReturnType<typeof globalThis.setTimeout> | null;
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

export function createJobsStore(api: ApiClient) {
  return create<JobsState>((set, get) => ({
    jobs: [],
    activeJobId: null,
    activeJobDetails: null,
    loading: false,
    jobsLoading: false,
    pollEpoch: 0,
    pollRequest: null,
    pollTimer: null,
    jobsRequest: null,

    async createJob(rawInput) {
      const urls = normalizeUrls(rawInput);

      if (urls.length === 0) {
        useToastStore.getState().pushError('toast.error.emptyUrls');
        return;
      }

      set({ loading: true });

      try {
        const response = await api.createJob({ urls });
        useToastStore.getState().pushSuccess('toast.success.created');
        await get().selectJob(response.jobId);
        await get().refreshJobs();
      } catch (error) {
        notifyError(error);
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

        notifyError(error);
        set({ jobsLoading: false, jobsRequest: null });
      }
    },

    async selectJob(jobId) {
      const nextEpoch = get().pollEpoch + 1;
      get().stopPolling();

      set({
        activeJobId: jobId,
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

          const timer = globalThis.setTimeout(() => {
            void poll(epoch);
          }, POLL_INTERVAL_MS);

          set({ pollTimer: timer });
        } catch (error) {
          if (requestController.signal.aborted) {
            return;
          }

          notifyError(error);
          set({ loading: false, pollRequest: null, pollTimer: null });
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
      }));

      try {
        await api.cancelJob(activeJobId);
        useToastStore.getState().pushSuccess('toast.success.cancelled');
        await get().refreshJobs();
      } catch (error) {
        notifyError(error);
        await get().selectJob(activeJobId);
      }
    },

    stopPolling() {
      const { pollRequest, pollTimer } = get();

      pollRequest?.abort();

      if (pollTimer !== null) {
        globalThis.clearTimeout(pollTimer);
      }

      set((state) => ({
        pollEpoch: state.pollEpoch + 1,
        pollRequest: null,
        pollTimer: null,
      }));
    },
  }));
}

export const useJobsStore = createJobsStore(createApiClient());
