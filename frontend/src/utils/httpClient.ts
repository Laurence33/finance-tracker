import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { createRequestQueue } from './requestQueue';

const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

// The usage plan allows 5rps / 10 burst per user. Capping GETs keeps fan-outs
// like the dashboard's inside it. Mutations are never queued: a POST stuck
// behind four slow GETs makes every form in the app feel broken.
const MAX_CONCURRENT_GETS = 4;
const getQueue = createRequestQueue(MAX_CONCURRENT_GETS);

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Per-request flag so the api-key bootstrap call skips x-api-key injection (avoids recursion).
type RequestConfig = Parameters<typeof httpClient.request>[0] & {
  skipApiKey?: boolean;
  __release?: () => void;
};

// The user's throttling key, fetched once from GET /me/api-key and memoized for the session.
let apiKeyPromise: Promise<string | undefined> | null = null;

// Usage plans/keys aren't enforced by `sam local`, and fetching one would hit real
// AWS from a dev machine — so skip the bootstrap entirely against a local API.
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(
  process.env.NEXT_PUBLIC_API_URL ?? '',
);

function getApiKey(): Promise<string | undefined> {
  if (isLocalApi) return Promise.resolve(undefined);
  if (!apiKeyPromise) {
    apiKeyPromise = httpClient
      .get<{ apiKey: string }>('/me/api-key', { skipApiKey: true } as RequestConfig)
      .then((res) => res.data?.apiKey)
      .catch((err) => {
        // Reset so a later request can retry the bootstrap instead of caching the failure.
        apiKeyPromise = null;
        throw err;
      });
  }
  return apiKeyPromise;
}

// Clears the memoized key so the next signed-in user re-fetches their own.
export function resetApiKey(): void {
  apiKeyPromise = null;
}

httpClient.interceptors.request.use(async (config) => {
  // `skipApiKey` marks the /me/api-key bootstrap, which is awaited *inside* this
  // interceptor by every other request. Queueing it would let four GETs hold all
  // four slots while each waits on a call that needs a fifth — a deadlock.
  const queued = config.method?.toLowerCase() === 'get' && !(config as RequestConfig).skipApiKey;
  if (queued) {
    (config as RequestConfig).__release = await getQueue.acquire();
  }

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Not signed in — request will fail at API Gateway
  }

  // Attach the per-user throttling key — but not on the bootstrap call that fetches it.
  if (!(config as RequestConfig).skipApiKey) {
    try {
      const apiKey = await getApiKey();
      if (apiKey) {
        config.headers['x-api-key'] = apiKey;
      }
    } catch {
      // Key unavailable — request proceeds and is rejected/throttled at the gateway
    }
  }
  return config;
});

// Registered before the retry interceptor so the slot is freed *before* a retry
// calls httpClient.request() again — otherwise a retry would queue behind the
// slot its own original request is still holding.
const releaseSlot = (config: AxiosRequestConfig | undefined) => {
  const release = (config as RequestConfig | undefined)?.__release;
  if (release) {
    (config as RequestConfig).__release = undefined;
    release();
  }
};

httpClient.interceptors.response.use(
  (response) => {
    releaseSlot(response.config);
    return response;
  },
  (error: AxiosError) => {
    releaseSlot(error.config);
    return Promise.reject(error);
  },
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

httpClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (AxiosRequestConfig & { __retryCount?: number }) | undefined;
  if (!config) return Promise.reject(error);
  const status = error.response?.status;
  const isNetworkOrCorsFailure = !error.response;
  const isRetryableStatus = status !== undefined && RETRYABLE_STATUSES.has(status);
  if (!isNetworkOrCorsFailure && !isRetryableStatus) {
    return Promise.reject(error);
  }
  config.__retryCount = (config.__retryCount || 0) + 1;
  if (config.__retryCount > MAX_RETRIES) {
    return Promise.reject(error);
  }
  const delay = 300 * 2 ** (config.__retryCount - 1) + Math.random() * 200;
  await sleep(delay);
  return httpClient.request(config);
});

export class HttpError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

function parseFieldErrors(
  errors: Record<string, { errors?: string[] }> | undefined
): Record<string, string[]> {
  if (!errors || typeof errors !== 'object') return {};
  const result: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (value?.errors?.length) {
      result[field] = value.errors;
    }
  }
  return result;
}

function handleHttpException(error: any): void {
  if (error.response) {
    const requestId = error.response.headers?.['x-request-id'];
    if (requestId) {
      console.error(`Request failed. x-request-id: ${requestId}`, error.response);
    }
    if (error.response.status === 401) {
      resetApiKey();
      signOut().catch(() => {});
      throw new HttpError('Session expired. Please sign in again.');
    }
    const data = error.response.data;
    const fieldErrors = parseFieldErrors(data.errors);
    const suffix = requestId ? ` (request id: ${requestId})` : '';
    throw new HttpError(
      (data.message || 'Unknown error occurred.') + suffix,
      fieldErrors,
    );
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    throw new Error('No response received from server.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message);
  }
}

export class HttpClient {
  static async get<T>(url: string): Promise<T | void> {
    try {
      const response = await httpClient.get<T>(url);
      return response.data;
    } catch (error: any) {
      return handleHttpException(error);
    }
  }

  static async post<T>(url: string, data: any): Promise<T | void> {
    try {
      const response = await httpClient.post<T>(url, data);
      return response.data;
    } catch (error: any) {
      return handleHttpException(error);
    }
  }

  static async put<T>(url: string, data: any): Promise<T | void> {
    try {
      const response = await httpClient.put<T>(url, data);
      return response.data;
    } catch (error: any) {
      return handleHttpException(error);
    }
  }

  static async patch<T>(url: string, data: any): Promise<T | void> {
    try {
      const response = await httpClient.patch<T>(url, data);
      return response.data;
    } catch (error: any) {
      return handleHttpException(error);
    }
  }

  static async delete<T>(url: string): Promise<T | void> {
    try {
      const response = await httpClient.delete<T>(url);
      return response.data;
    } catch (error: any) {
      return handleHttpException(error);
    }
  }
}
