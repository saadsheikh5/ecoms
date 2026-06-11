import axios from 'axios';

export const API_STATUS = {
  CHECKING: 'checking',
  ONLINE: 'online',
  OFFLINE: 'offline',
};

export const isMockDataAllowed = import.meta.env.DEV;
const PRODUCTION_API_URL = 'https://api.jtsbeautyllc.com/api';

const normalizeApiUrl = (url) => {
  if (!url) return '';
  const trimmedUrl = String(url).trim();
  if (!trimmedUrl) return '';
  const absoluteUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  return absoluteUrl.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : PRODUCTION_API_URL));
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const isApiConfigured = Boolean(API_BASE_URL);

const listeners = new Set();

let currentStatus = {
  status: isApiConfigured ? API_STATUS.CHECKING : API_STATUS.OFFLINE,
  isAvailable: false,
  lastCheckedAt: null,
  error: isApiConfigured ? '' : 'Live API URL is not configured.',
};

export function getApiStatusSnapshot() {
  return currentStatus;
}

export function subscribeToApiStatus(listener) {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function setApiStatus(nextStatus) {
  currentStatus = {
    ...currentStatus,
    ...nextStatus,
    lastCheckedAt: nextStatus.lastCheckedAt || new Date().toISOString(),
  };
  listeners.forEach((listener) => listener(currentStatus));
}

export function markApiAvailable() {
  setApiStatus({
    status: API_STATUS.ONLINE,
    isAvailable: true,
    error: '',
  });
}

export function markApiUnavailable(error = 'The API is unavailable.') {
  setApiStatus({
    status: API_STATUS.OFFLINE,
    isAvailable: false,
    error,
  });
}

export async function checkApiHealth() {
  if (!isApiConfigured) {
    markApiUnavailable('Live API URL is not configured.');
    return currentStatus;
  }

  try {
    // Keep health checks independent from the app axios instance to avoid interceptor loops.
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });

    const data = response.data;
    if (!data?.success || data?.status !== 'ok') {
      throw new Error('The API health response was invalid.');
    }

    markApiAvailable();
    return currentStatus;
  } catch (error) {
    markApiUnavailable(error.message || 'The API health check failed.');
    throw error;
  }
}
