import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  API_STATUS,
  checkApiHealth,
  getApiStatusSnapshot,
  subscribeToApiStatus,
} from '../api/status';

const ApiStatusContext = createContext(null);

export function ApiStatusProvider({ children }) {
  const [apiStatus, setApiStatusState] = useState(getApiStatusSnapshot);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(async () => {
    setApiStatusState((current) => ({
      ...current,
      status: API_STATUS.CHECKING,
      error: '',
    }));
    try {
      await checkApiHealth();
      setRetryCount((count) => count + 1);
    } catch {
      setRetryCount((count) => count + 1);
    }
  }, []);

  useEffect(() => subscribeToApiStatus(setApiStatusState), []);

  useEffect(() => {
    let isMounted = true;

    const runHealthCheck = async () => {
      try {
        await checkApiHealth();
      } catch {
        if (isMounted) {
          // The shared status service already published the offline state.
        }
      }
    };

    runHealthCheck();
    const intervalId = window.setInterval(runHealthCheck, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const value = useMemo(() => ({
    ...apiStatus,
    retry,
    retryCount,
    isChecking: apiStatus.status === API_STATUS.CHECKING,
  }), [apiStatus, retry, retryCount]);

  return (
    <ApiStatusContext.Provider value={value}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  const context = useContext(ApiStatusContext);
  if (!context) {
    throw new Error('useApiStatus must be used inside ApiStatusProvider.');
  }
  return context;
}
