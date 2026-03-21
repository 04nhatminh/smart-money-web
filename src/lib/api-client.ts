const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Connected to backend at ${API_URL}${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Failed to connect to backend at ${API_URL}${endpoint}:`, error);
      throw error;
    }
  },
};
