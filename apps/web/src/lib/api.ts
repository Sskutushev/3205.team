import type {
  CreateJobRequest,
  CreateJobResponse,
  JobDetails,
  JobSummary,
} from '@url-checker/shared';

export class ApiError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : (payload?.message ?? `Request failed with status ${response.status}`);

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createApiClient() {
  return {
    async createJob(
      payload: CreateJobRequest,
      signal?: AbortSignal,
    ): Promise<CreateJobResponse> {
      return requestJson<CreateJobResponse>('/api/jobs', {
        body: JSON.stringify(payload),
        method: 'POST',
        signal,
      });
    },
    async getJobs(signal?: AbortSignal): Promise<JobSummary[]> {
      return requestJson<JobSummary[]>('/api/jobs', { signal });
    },
    async getJob(jobId: string, signal?: AbortSignal): Promise<JobDetails> {
      return requestJson<JobDetails>(`/api/jobs/${jobId}`, { signal });
    },
    async cancelJob(jobId: string, signal?: AbortSignal): Promise<void> {
      await requestJson<void>(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        signal,
      });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
