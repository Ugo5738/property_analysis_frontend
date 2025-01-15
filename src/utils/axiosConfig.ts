import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:8000',
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'https://api.supersami.com',
  // baseURL: import.meta.env.VITE_BACKEND_API_URL || 'https://api-test.supersami.com',
  withCredentials: true, // Important for sending cookies if needed
});

// Function to get access token from localStorage
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

// Function to get refresh token from localStorage
function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

// Function to set tokens in localStorage
function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

// Function to remove tokens from localStorage
function removeTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1];
}

// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  function (config) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 errors and refresh tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/api/auth/token/refresh/`,
          { refresh: getRefreshToken() },
        );
        const { access, refresh } = response.data;
        setTokens(access, refresh);
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        removeTokens();
        // Optionally, redirect to login page or notify the user
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const isAxiosError = axios.isAxiosError;

export default axiosInstance;
