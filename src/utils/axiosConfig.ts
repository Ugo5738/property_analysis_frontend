import axios from 'axios';

const instance = axios.create({
  // baseURL: 'http://localhost:8000',
  baseURL: 'http://3.238.8.99:8000',
//   baseURL: import.meta.env.VITE_API_URL || 'https://api.resumeguru.pro',
  withCredentials: true, // This is important for sending cookies
});

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1];
}

instance.interceptors.request.use(
  function (config) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    // const accessToken = localStorage.getItem('accessToken');
    // if (accessToken) {
    //   config.headers['Authorization'] = `Bearer ${accessToken}`;
    // }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // const originalRequest = error.config;
    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;
    //   try {
    //     const refreshToken = localStorage.getItem('refreshToken');
    //     const response = await axios.post(
    //       `${instance.defaults.baseURL}/api/auth/token/refresh/`,
    //       { refresh: refreshToken },
    //       { withCredentials: true },
    //     );
    //     localStorage.setItem('accessToken', response.data.access);
    //     if (response.data.refresh) {
    //       localStorage.setItem('refreshToken', response.data.refresh);
    //     }
    //     originalRequest.headers[
    //       'Authorization'
    //     ] = `Bearer ${response.data.access}`;
    //     return instance(originalRequest);
    //   } catch (refreshError) {
    //     console.error('Token refresh failed:', refreshError);
    //     localStorage.removeItem('accessToken');
    //     localStorage.removeItem('refreshToken');
    //     // You might want to redirect to login page or dispatch a logout action here
    //     return Promise.reject(refreshError);
    //   }
    // }
    return Promise.reject(error);
  },
);

export const isAxiosError = axios.isAxiosError;

export default instance;
