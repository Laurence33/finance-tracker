import axios from 'axios';
const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class HttpClient {
  static async get<T>(url: string): Promise<T> {
    const response = await httpClient.get<T>(url);
    return response.data;
  }

  static async post<T>(url: string, data: any): Promise<T> {
    const response = await httpClient.post<T>(url, data);
    return response.data;
  }

  static async put<T>(url: string, data: any): Promise<T> {
    const response = await httpClient.put<T>(url, data);
    return response.data;
  }

  static async delete<T>(url: string): Promise<T> {
    const response = await httpClient.delete<T>(url);
    return response.data;
  }
}