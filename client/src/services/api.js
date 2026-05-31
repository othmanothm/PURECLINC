import axios from 'axios';

const FALLBACK_LOCAL_API_URL = 'http://localhost:5000/api';

function isLocalhostHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalhostUrl(url) {
  try {
    const parsed = new URL(url);
    return isLocalhostHost(parsed.hostname);
  } catch {
    return false;
  }
}

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    // Local Vite dev must hit local backend — even if .env points at production.
    if (isLocalhostHost(hostname)) {
      if (envUrl && isLocalhostUrl(envUrl)) {
        return envUrl;
      }
      return FALLBACK_LOCAL_API_URL;
    }

    if (!isLocalhostHost(hostname)) {
      if (envUrl && !isLocalhostUrl(envUrl)) {
        return envUrl;
      }
      return `${protocol}//${hostname}:9072/api`;
    }
  }

  if (envUrl && !isLocalhostUrl(envUrl)) {
    return envUrl;
  }

  return envUrl || FALLBACK_LOCAL_API_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token to headers if available
api.interceptors.request.use(
  (config) => {
    const stored = window.localStorage.getItem('pureskin_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401/403 and auto-logout
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCredentialRequest = /\/auth\/(login|admin-login|register|verify-email|resend-verification)(\/|$|\?)/.test(
      url
    );
    if ((status === 401 || status === 403) && !isAuthCredentialRequest) {
      window.localStorage.removeItem('pureskin_auth');
      const onLoginPage =
        typeof window !== 'undefined' && window.location.pathname === '/login';
      if (!onLoginPage) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

