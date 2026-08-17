import { router } from 'expo-router';
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ENDPOINTS } from '@attend/shared';
import { useAuthStore } from '@/store/auth';

const BACKEND_PORT = (process.env.EXPO_PUBLIC_API_PORT || '8000').trim();

/**
 * Same host Expo/Metro uses — works on physical device over WiFi without hardcoding IP.
 * See apps/mobile/DEV-SETUP.md
 */
function getExpoDevHost(): string | null {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost?.split(':').shift();
  if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
    return debuggerHost;
  }
  const hostUri = Constants.expoConfig?.hostUri?.split(':').shift();
  if (hostUri && hostUri !== 'localhost' && hostUri !== '127.0.0.1') {
    return hostUri;
  }
  return null;
}

function getApiBase(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // Explicit override in apps/mobile/.env (optional)
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  // Physical device: derive LAN IP from Expo dev server (same WiFi as Metro)
  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:${BACKEND_PORT}`;
  }

  // Android emulator → host machine
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s for photo uploads and slow networks
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
