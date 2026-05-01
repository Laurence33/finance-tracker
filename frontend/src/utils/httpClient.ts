import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Not signed in — request will fail at API Gateway
  }
  return config;
});

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
