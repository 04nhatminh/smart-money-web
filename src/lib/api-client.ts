import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || `API error: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).data = data;
        throw error;
      }

      // Even if HTTP status is 200, check if API indicates failure
      if (data && data.success === false) {
        const error = new Error(data.message || 'Request failed');
        (error as any).data = data;
        throw error;
      }

      console.log(`Connected to backend at ${API_URL}${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Failed to connect to backend at ${API_URL}${endpoint}:`, error);
      throw error;
    }
  },

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Check if response is not ok OR if the API returns success: false
      if (!response.ok) {
        const errorMessage = data?.message || `API error: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).data = data;
        throw error;
      }

      // Even if HTTP status is 200, check if API indicates failure
      if (data && data.success === false) {
        const error = new Error(data.message || 'Request failed');
        (error as any).data = data;
        throw error;
      }

      console.log(`Connected to backend at ${API_URL}${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Failed to connect to backend at ${API_URL}${endpoint}:`, error);
      throw error;
    }
  },

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || `API error: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).data = data;
        throw error;
      }

      // Even if HTTP status is 200, check if API indicates failure
      if (data && data.success === false) {
        const error = new Error(data.message || 'Request failed');
        (error as any).data = data;
        throw error;
      }

      console.log(`Connected to backend at ${API_URL}${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Failed to connect to backend at ${API_URL}${endpoint}:`, error);
      throw error;
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || `API error: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).data = data;
        throw error;
      }

      // Even if HTTP status is 200, check if API indicates failure
      if (data && data.success === false) {
        const error = new Error(data.message || 'Request failed');
        (error as any).data = data;
        throw error;
      }

      console.log(`Connected to backend at ${API_URL}${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Failed to connect to backend at ${API_URL}${endpoint}:`, error);
      throw error;
    }
  },
};
