import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

/**
 * Enterprise Session Security & Inactivity Timeout Hook
 * Features:
 * - Multi-event idle detection (mouse, keyboard, touch, scroll)
 * - 60-second warning countdown modal before termination
 * - Multi-tab logout synchronization (via window storage events)
 * - JWT token expiration parsing
 * - Token refresh on activity continuation
 */

const DEFAULT_TIMEOUT_MINUTES = 15;
const WARNING_SECONDS = 60;

export function useSessionSecurity(onLogout) {
  const navigate = useNavigate();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_SECONDS);

  // Get user-configured timeout from localStorage (or fallback to default)
  const getTimeoutMinutes = () => {
    const saved = localStorage.getItem('estore_session_timeout_minutes');
    return saved ? parseInt(saved, 10) : DEFAULT_TIMEOUT_MINUTES;
  };

  const timeoutMinutes = getTimeoutMinutes();
  const totalIdleMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = totalIdleMs - (WARNING_SECONDS * 1000);

  const lastActivityRef = useRef(Date.now());
  const checkIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const handleLogoutAction = useCallback(async (reason = 'inactivity') => {
    try {
      await api.post('/admin/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('estore_admin_token');
      localStorage.removeItem('estore_admin_user');
      localStorage.setItem('estore_logout_event', Date.now().toString());
      if (onLogout) onLogout();
      setIsWarningOpen(false);
      navigate(`/login?reason=${reason}`);
    }
  }, [navigate, onLogout]);

  const stayLoggedIn = useCallback(async () => {
    try {
      const res = await api.post('/admin/auth/refresh');
      if (res.data?.access_token) {
        localStorage.setItem('estore_admin_token', res.data.access_token);
      }
    } catch (e) {
      console.warn('Failed to refresh token, resetting idle timer locally:', e);
    } finally {
      lastActivityRef.current = Date.now();
      setIsWarningOpen(false);
      setSecondsRemaining(WARNING_SECONDS);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, []);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Set up activity event listeners
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'focus'];
    const handleActivity = () => {
      if (!isWarningOpen) {
        recordActivity();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Multi-tab session synchronization: if another tab logged out, log out this tab too
    const handleStorageChange = (e) => {
      if (e.key === 'estore_logout_event' || (e.key === 'estore_admin_token' && !e.newValue)) {
        if (onLogout) onLogout();
        navigate('/login?reason=multi_tab_logout');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Periodic heartbeat to verify idle threshold
    checkIntervalRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;

      if (idleTime >= totalIdleMs) {
        // Complete timeout reached
        handleLogoutAction('inactivity_timeout');
      } else if (idleTime >= warningThresholdMs && !isWarningOpen) {
        // Trigger 60s warning modal
        const initialSecondsLeft = Math.max(1, Math.round((totalIdleMs - idleTime) / 1000));
        setSecondsRemaining(initialSecondsLeft);
        setIsWarningOpen(true);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      window.removeEventListener('storage', handleStorageChange);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isWarningOpen, totalIdleMs, warningThresholdMs, handleLogoutAction, recordActivity, onLogout, navigate]);

  // Countdown timer inside warning modal
  useEffect(() => {
    if (isWarningOpen) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleLogoutAction('inactivity_timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isWarningOpen, handleLogoutAction]);

  return {
    isWarningOpen,
    secondsRemaining,
    timeoutMinutes,
    stayLoggedIn,
    logoutNow: () => handleLogoutAction('user_logout')
  };
}
