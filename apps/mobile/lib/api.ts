import { router } from 'expo-router';
import axios from 'axios';
import { Platform } from 'react-native';
import { ENDPOINTS } from '@attend/shared';
import { useAuthStore } from '@/store/auth';

/** Your Mac's IP - update when it changes (ipconfig getifaddr en0). Used for device + emulator. */
const DEV_API_URL = 'http://10.94.29.247:8000';

function getApiBase(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  // Native (iOS/Android): always use your machine's IP - works on physical device and emulator
  return DEV_API_URL;
}

export const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      useAuthStore.getState().logout();
      router.replace('/(auth)/login');
    }
    return Promise.reject(err);
  }
);

export { ENDPOINTS };
