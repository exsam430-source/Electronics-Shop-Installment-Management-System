import axios from 'axios';

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const api = axios.create({
  baseURL: isFileProtocol ? 'http://localhost:5000/api' : '/api'
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eshop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle unauthorized redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/setup') {
        localStorage.removeItem('eshop_token');
        localStorage.removeItem('eshop_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
