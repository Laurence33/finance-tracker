import axios from 'axios';
const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = error.response.data;
    const fieldErrors = parseFieldErrors(data.errors);
    throw new HttpError(
      data.message || 'Unknown error occurred.',
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
