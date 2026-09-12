import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      // Navigation to auth would happen elsewhere or via event emitter
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('userToken', token);
  } else {
    await AsyncStorage.removeItem('userToken');
  }
};

export default api;
