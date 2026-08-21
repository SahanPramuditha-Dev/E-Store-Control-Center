import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('estore_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('estore_admin_token');
      localStorage.removeItem('estore_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
