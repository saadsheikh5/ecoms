import React, { useMemo, useState } from 'react';
import {
  adminLogin,
  requestPasswordReset,
  resetAdminPassword,
  resetAdminPasswordWithCode,
  verifyAdminEmailChange,
  verifyAdminOtp,
} from '../../api/services';

const getResetTokenFromHash = () => {
  const query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  return new URLSearchParams(query).get('token') || '';
};

const getEmailVerificationTokenFromHash = () => {
  const query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  return new URLSearchParams(query).get('token') || '';
};

export default function AdminLogin({ onLogin, initialError = '', apiAvailable = true }) {
  const resetToken = useMemo(getResetTokenFromHash, []);
  const emailVerificationToken = useMemo(getEmailVerificationTokenFromHash, []);
  const [mode, setMode] = useState(() => {
    if (window.location.hash.startsWith('#/admin/verify-email')) return 'verifyEmail';
    return resetToken ? 'reset' : 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClass = 'w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all';
  const buttonClass = 'w-full bg-[#d9006c] text-white py-3 rounded uppercase tracking-widest text-sm font-semibold hover:bg-[#ec4899] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2';

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const goToLogin = () => {
    setMode('login');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setOtpCode('');
    setChallengeToken('');
    clearFeedback();
    if (window.location.hash.includes('reset-password')) {
      window.history.replaceState('', document.title, `${window.location.pathname}${window.location.search}#admin`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!apiAvailable) {
      setError('Admin sign-in is temporarily unavailable while the backend API is down.');
      return;
    }

    clearFeedback();
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      if (data.success && data.twoFactorRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setMode('otp');
        setPassword('');
        return;
      }
      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token);
        onLogin();
        return;
      }
      throw new Error('Unable to sign in. Please try again.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const data = await verifyAdminOtp(challengeToken, otpCode);
      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token);
        onLogin();
        return;
      }
      throw new Error('Unable to verify code. Please try again.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const data = await requestPasswordReset(email);
      setSuccess(data.message || 'If an admin account exists for that email, a password reset link and code have been sent.');
      setMode('resetCode');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithCode = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const data = await resetAdminPasswordWithCode(email, resetCode, password, confirmPassword);
      setSuccess(data.message || 'Password reset successfully. Please sign in.');
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const data = await resetAdminPassword(resetToken, password, confirmPassword);
      setSuccess(data.message || 'Password reset successfully. Please sign in.');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      window.history.replaceState('', document.title, `${window.location.pathname}${window.location.search}#admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const data = await verifyAdminEmailChange(emailVerificationToken);
      localStorage.removeItem('adminToken');
      setSuccess(data.message || 'Email verified successfully. Please sign in with your new email.');
      setMode('login');
      window.history.replaceState('', document.title, `${window.location.pathname}${window.location.search}#admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot'
    ? 'Forgot Password'
    : mode === 'reset'
      ? 'Reset Password'
      : mode === 'resetCode'
        ? 'Reset Password'
      : mode === 'verifyEmail'
        ? 'Verify Email'
      : mode === 'otp'
        ? 'Verify Code'
        : 'Sign In';

  return (
    <div className="min-h-screen bg-[#f6f2ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-5xl font-bentley-script text-[#d9006c] mb-2">JTS Beauty</h1>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Admin Portal</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] p-8">
          <h2 className="text-2xl font-bold text-[#d9006c] uppercase tracking-wide mb-6">
            {title}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded mb-5">
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button type="submit" disabled={loading || !apiAvailable} className={buttonClass}>
                {!apiAvailable ? 'Service Unavailable' : loading ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setMode('forgot');
                }}
                className="w-full text-center text-xs font-semibold uppercase tracking-widest text-[#d9006c] hover:text-[#ec4899] transition-colors"
              >
                Forgot Password?
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className={inputClass}
                  placeholder="123456"
                />
              </div>

              <button type="submit" disabled={loading || !apiAvailable} className={buttonClass}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={goToLogin} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Back To Sign In
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button type="submit" disabled={loading || !apiAvailable} className={buttonClass}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={goToLogin} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Back To Sign In
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-gray-500">
                Minimum 8 characters with uppercase, lowercase, number, and special character.
              </p>

              <button type="submit" disabled={loading || !apiAvailable || !resetToken} className={buttonClass}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button" onClick={goToLogin} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Back To Sign In
              </button>
            </form>
          )}

          {mode === 'resetCode' && (
            <form onSubmit={handleResetPasswordWithCode} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Reset Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={inputClass}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-gray-500">
                Minimum 8 characters with uppercase, lowercase, number, and special character.
              </p>

              <button type="submit" disabled={loading || !apiAvailable || resetCode.length !== 6} className={buttonClass}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setMode('forgot')} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Send Another Code
              </button>
              <button type="button" onClick={goToLogin} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Back To Sign In
              </button>
            </form>
          )}

          {mode === 'verifyEmail' && (
            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <button type="submit" disabled={loading || !apiAvailable || !emailVerificationToken} className={buttonClass}>
                {loading ? 'Verifying...' : 'Verify Email Address'}
              </button>
              <button type="button" onClick={goToLogin} className="w-full text-center text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[#d9006c]">
                Back To Sign In
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          (c) 2026 JTS Beauty World
        </p>
      </div>
    </div>
  );
}
