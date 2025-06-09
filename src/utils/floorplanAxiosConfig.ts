import axios from 'axios';

// Create an axios instance with the base URL for the floorplan API
const floorplanAxiosInstance = axios.create({
  baseURL: 'https://floorplan.supersami.com/api/floorplan',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - useful for adding auth tokens if needed
floorplanAxiosInstance.interceptors.request.use(
  (config) => {
    // You can add authentication tokens here if needed
    // const token = localStorage.getItem('floorplan_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - useful for handling global error responses
floorplanAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global error responses here
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors
      console.error('Unauthorized access to floorplan API');
      // If you have authentication: window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default floorplanAxiosInstance;
