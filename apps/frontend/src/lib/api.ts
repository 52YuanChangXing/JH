import axios from 'axios';

const baseURL =
  import.meta.env.FRONTEND_API_BASE_URL ||
  import.meta.env.VITE_FRONTEND_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080/api/v1' : '/api/v1');

export const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jianhao-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jianhao-access-token');
    }
    return Promise.reject(error);
  }
);

export type ApiResponse<T> = {
  data: T;
  message: string;
  error?: string;
};
