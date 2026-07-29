import { getToken, getRefreshToken, setToken, setRefreshToken, clearAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smartmoney-haibang.duckdns.org';

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

// Helper function to extract error message from response
const extractErrorMessage = (data: any): string => {
  if (data?.message) {
    return data.message;
  }

  if (data?.errors && typeof data.errors === 'object') {
    const errorMessages = Object.entries(data.errors)
      .map(([field, error]: [string, any]) => {
        if (typeof error === 'string') {
          return error;
        }
        if (Array.isArray(error)) {
          return error.join(', ');
        }
        return String(error);
      })
      .filter(msg => msg.length > 0);

    if (errorMessages.length > 0) {
      return errorMessages.join('\n');
    }
  }

  return 'An error occurred';
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleUnauthorized = () => {
  clearAuth();
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1] && ['vi', 'en'].includes(pathParts[1]) ? pathParts[1] : 'en';
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = `/${locale}/login`;
    }
  }
};

const tryRefreshToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    handleUnauthorized();
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      handleUnauthorized();
      throw new Error('Refresh token invalid or expired');
    }

    const data = await response.json();
    const refreshData = data.data || data;

    if (refreshData && refreshData.accessToken) {
      setToken(refreshData.accessToken);
      if (refreshData.refreshToken) {
        setRefreshToken(refreshData.refreshToken);
      }
      return refreshData.accessToken;
    } else {
      handleUnauthorized();
      throw new Error('Invalid token response from refresh endpoint');
    }
  } catch (err) {
    handleUnauthorized();
    throw err;
  }
};

async function handleResponse<T>(
  response: Response,
  endpoint: string,
  retryFn: () => Promise<T>
): Promise<T> {
  const isAuthEndpoint =
    endpoint.includes('/api/v1/auth/login') ||
    endpoint.includes('/api/v1/auth/refresh-token') ||
    endpoint.includes('/api/v1/auth/register');

  if (response.status === 401 && !isAuthEndpoint) {
    if (isRefreshing) {
      await new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
      return retryFn();
    }

    isRefreshing = true;

    try {
      const newToken = await tryRefreshToken();
      processQueue(null, newToken);
      isRefreshing = false;
      return retryFn();
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      throw refreshErr;
    }
  }

  // Handle empty response body
  let data: any;
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  if (contentLength === '0' || !contentType?.includes('application/json')) {
    data = {};
  } else {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(data);
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  if (data && data.success === false) {
    const errorMessage = extractErrorMessage(data);
    const error = new Error(errorMessage);
    (error as any).status = response.status || 400;
    (error as any).data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.get<T>(endpoint));
    } catch (error) {
      throw error;
    }
  },

  async post<T>(endpoint: string, body: unknown, config?: { headers?: Record<string, string> }): Promise<T> {
    try {
      const headers = { ...getHeaders(), ...(config?.headers || {}) };

      const isFormData = body instanceof FormData;
      let fetchBody: string | FormData;

      if (isFormData) {
        fetchBody = body;
        delete headers['Content-Type'];
      } else {
        const jsonBody = JSON.stringify(body);
        fetchBody = jsonBody;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: fetchBody,
        credentials: 'include',
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.post<T>(endpoint, body, config));
    } catch (error) {
      throw error;
    }
  },

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.put<T>(endpoint, body));
    } catch (error) {
      throw error;
    }
  },

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.patch<T>(endpoint, body));
    } catch (error) {
      throw error;
    }
  },

  async postFormData<T>(endpoint: string, body: Record<string, string>): Promise<T> {
    try {
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.postFormData<T>(endpoint, body));
    } catch (error) {
      throw error;
    }
  },

  async putFormData<T>(endpoint: string, body: FormData): Promise<T> {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body,
        credentials: 'include',
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.putFormData<T>(endpoint, body));
    } catch (error) {
      throw error;
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      return await handleResponse<T>(response, endpoint, () => apiClient.delete<T>(endpoint));
    } catch (error) {
      throw error;
    }
  },
};
