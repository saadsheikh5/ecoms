import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Mail, ShieldCheck, UploadCloud, Save, X } from 'lucide-react';
import {
  changeAdminPassword,
  confirmTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  requestAdminEmailChange,
  resendAdminEmailVerification,
  setupTwoFactor,
  verifyAdminEmailChangeCode,
} from '../../api/services';

const SETTINGS_STORAGE_KEY = 'jtsAdminSettings';
const DEFAULT_LOGO = 'images/logonew.png';

const getSavedSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }

  return {};
};

const isStrongPassword = (password = '') => (
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
);

export default function AdminSettings({ onLogout }) {
  const fileInputRef = useRef(null);
  const savedSettings = getSavedSettings();
  const [settings, setSettings] = useState({
    storeName: 'JTS Beauty',
    currency: 'USD ($)',
    supportEmail: 'contact@jtsbeauty.com',
    instagram: '@jtsbeauty',
    tiktok: '@jtsbeauty_official',
    logo: DEFAULT_LOGO,
    ...savedSettings,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [emailForm, setEmailForm] = useState({
    currentPassword: '',
    newEmail: '',
    code: '',
  });
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '', pendingEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false, recoveryCodesRemaining: 0 });
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorRecoveryCodes, setTwoFactorRecoveryCodes] = useState([]);
  const [twoFactorMessage, setTwoFactorMessage] = useState({ type: '', message: '' });
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getTwoFactorStatus()
      .then((status) => {
        if (isMounted) setTwoFactorStatus(status);
      })
      .catch(() => {
        if (isMounted) {
          setTwoFactorMessage({ type: 'error', message: 'Unable to load two-factor status.' });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const persistSettings = (nextSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new CustomEvent('jts-settings-updated', { detail: nextSettings }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    persistSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose a PNG, JPG, WebP, or SVG image.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo image must be smaller than 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextSettings = { ...settings, logo: reader.result };
      setSettings(nextSettings);
      persistSettings(nextSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    };
    reader.onerror = () => setLogoError('Unable to read that image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    const nextSettings = { ...settings, logo: DEFAULT_LOGO };
    setSettings(nextSettings);
    persistSettings(nextSettings);
    setLogoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordStatus({ type: 'error', message: 'Use 8+ characters with uppercase, lowercase, number, and special character.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await changeAdminPassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setPasswordStatus({ type: 'success', message: response.message || 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      localStorage.removeItem('adminToken');
      setTimeout(() => onLogout?.(), 1200);
    } catch (error) {
      setPasswordStatus({ type: 'error', message: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestEmailChange = async () => {
    setEmailStatus({ type: '', message: '', pendingEmail: emailStatus.pendingEmail });
    setEmailLoading(true);
    try {
      const response = await requestAdminEmailChange(emailForm.currentPassword, emailForm.newEmail);
      setEmailStatus({
        type: 'success',
        message: response.message || 'Verification link sent to the new email address.',
        pendingEmail: response.data?.pendingEmail || emailForm.newEmail,
      });
      setEmailForm({ currentPassword: '', newEmail: '', code: '' });
    } catch (error) {
      setEmailStatus({ type: 'error', message: error.message, pendingEmail: emailStatus.pendingEmail });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmailVerification = async () => {
    setEmailLoading(true);
    try {
      const response = await resendAdminEmailVerification();
      setEmailStatus({
        type: 'success',
        message: response.message || 'Verification link resent.',
        pendingEmail: response.data?.pendingEmail || emailStatus.pendingEmail,
      });
    } catch (error) {
      setEmailStatus({ type: 'error', message: error.message, pendingEmail: emailStatus.pendingEmail });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    setEmailLoading(true);
    try {
      const response = await verifyAdminEmailChangeCode(emailForm.code);
      setEmailStatus({
        type: 'success',
        message: response.message || 'Email verified successfully. Please sign in with your new email.',
        pendingEmail: '',
      });
      setEmailForm({ currentPassword: '', newEmail: '', code: '' });
      localStorage.removeItem('adminToken');
      setTimeout(() => onLogout?.(), 1400);
    } catch (error) {
      setEmailStatus({ type: 'error', message: error.message, pendingEmail: emailStatus.pendingEmail });
    } finally {
      setEmailLoading(false);
    }
  };

  const refreshTwoFactorStatus = async () => {
    const status = await getTwoFactorStatus();
    setTwoFactorStatus(status);
  };

  const handleStartTwoFactorSetup = async () => {
    setTwoFactorMessage({ type: '', message: '' });
    setTwoFactorLoading(true);
    try {
      const setup = await setupTwoFactor(twoFactorPassword);
      setTwoFactorSetup(setup);
      setTwoFactorCode('');
      setTwoFactorMessage({ type: 'success', message: 'Scan the QR code, then enter the 6-digit code.' });
    } catch (error) {
      setTwoFactorMessage({ type: 'error', message: error.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    setTwoFactorMessage({ type: '', message: '' });
    setTwoFactorLoading(true);
    try {
      const response = await confirmTwoFactor(twoFactorCode);
      setTwoFactorRecoveryCodes(response.data?.recoveryCodes || []);
      setTwoFactorSetup(null);
      setTwoFactorPassword('');
      setTwoFactorCode('');
      await refreshTwoFactorStatus();
      setTwoFactorMessage({ type: 'success', message: response.message || 'Two-factor authentication enabled.' });
    } catch (error) {
      setTwoFactorMessage({ type: 'error', message: error.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setTwoFactorMessage({ type: '', message: '' });
    setTwoFactorLoading(true);
    try {
      const response = await disableTwoFactor(twoFactorPassword);
      setTwoFactorPassword('');
      setTwoFactorSetup(null);
      setTwoFactorRecoveryCodes([]);
      await refreshTwoFactorStatus();
      setTwoFactorMessage({ type: 'success', message: response.message || 'Two-factor authentication disabled.' });
    } catch (error) {
      setTwoFactorMessage({ type: 'error', message: error.message });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Configuration</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Settings</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
          <div className="p-6 border-b border-[#e7e1d8] bg-[#fcfbf9]">
            <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wide">General Info</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your store's primary details.</p>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Store Name</label>
                <input 
                  type="text" 
                  value={settings.storeName}
                  onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Currency</label>
                <select 
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="CAD ($)">CAD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Support Email</label>
              <input 
                type="email" 
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                className="w-full md:w-1/2 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Branding & Logo */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
          <div className="p-6 border-b border-[#e7e1d8] bg-[#fcfbf9]">
            <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wide">Branding</h3>
            <p className="text-sm text-gray-500 mt-1">Upload your store logo and assets.</p>
          </div>
          <div className="p-6 sm:p-8">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Store Logo</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              <div className="w-full sm:w-32 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={settings.logo || DEFAULT_LOGO}
                  alt="Current store logo"
                  className="max-h-20 max-w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_LOGO;
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-white border border-[#d9006c] text-[#d9006c] px-4 py-2 rounded text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <UploadCloud size={16} />
                    Upload New Logo
                  </button>
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <X size={16} />
                    Reset
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">Recommended size: 400x100px. PNG, JPG, WebP, or SVG under 2MB.</p>
                {logoError && <p className="text-xs font-semibold text-red-600">{logoError}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
          <div className="p-6 border-b border-[#e7e1d8] bg-[#fcfbf9]">
            <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wide">Social Media</h3>
            <p className="text-sm text-gray-500 mt-1">Connect your store to social platforms.</p>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Instagram Handle</label>
                <input 
                  type="text" 
                  value={settings.instagram}
                  onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">TikTok Handle</label>
                <input 
                  type="text" 
                  value={settings.tiktok}
                  onChange={(e) => setSettings({...settings, tiktok: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
          <div className="p-6 border-b border-[#e7e1d8] bg-[#fcfbf9]">
            <h3 className="text-lg font-bold text-[#d9006c] uppercase tracking-wide">Security</h3>
            <p className="text-sm text-gray-500 mt-1">Manage password and admin sign-in protection.</p>
          </div>
          <div className="p-6 sm:p-8 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} />
                <h4 className="font-bold uppercase tracking-wide text-[#d9006c]">Change Email</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="password"
                  value={emailForm.currentPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                  placeholder="Current password"
                  className="border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />
                <input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  placeholder="New email address"
                  className="border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />
              </div>
              {emailStatus.message && (
                <div className={`text-sm px-4 py-3 rounded mt-4 ${emailStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {emailStatus.message}
                  {emailStatus.pendingEmail ? <span className="block mt-1 font-semibold">Pending: {emailStatus.pendingEmail}</span> : null}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleRequestEmailChange}
                  disabled={emailLoading}
                  className="bg-[#d9006c] text-white px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#ec4899] transition-colors disabled:opacity-60"
                >
                  {emailLoading ? 'Sending...' : 'Send Verification'}
                </button>
                {emailStatus.pendingEmail && (
                  <button
                    type="button"
                    onClick={handleResendEmailVerification}
                    disabled={emailLoading}
                    className="border border-[#d9006c] text-[#d9006c] px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#d9006c] hover:text-white transition-colors disabled:opacity-60"
                  >
                    Resend Verification
                  </button>
                )}
              </div>
              {emailStatus.pendingEmail && (
                <div className="mt-5 border border-[#e7e1d8] rounded-lg p-4 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Email Verification Code</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={emailForm.code}
                      onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="123456"
                      className="w-full sm:w-48 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailCode}
                      disabled={emailLoading || emailForm.code.length !== 6}
                      className="bg-[#d9006c] text-white px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#ec4899] transition-colors disabled:opacity-60"
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#e7e1d8] pt-8">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={18} />
                <h4 className="font-bold uppercase tracking-wide text-[#d9006c]">Change Password</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Current password"
                  className="border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="New password"
                  className="border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Use 8+ characters with uppercase, lowercase, number, and special character.</p>
              {passwordStatus.message && (
                <p className={`text-sm font-semibold mt-3 ${passwordStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {passwordStatus.message}
                </p>
              )}
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="mt-4 bg-[#d9006c] text-white px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#ec4899] transition-colors disabled:opacity-60"
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>

            <div className="border-t border-[#e7e1d8] pt-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} />
                <h4 className="font-bold uppercase tracking-wide text-[#d9006c]">Two-Factor Authentication</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Status: <span className="font-semibold">{twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                {twoFactorStatus.enabled ? ` (${twoFactorStatus.recoveryCodesRemaining} recovery codes remaining)` : ''}
              </p>

              {twoFactorMessage.message && (
                <div className={`text-sm px-4 py-3 rounded mb-4 ${twoFactorMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {twoFactorMessage.message}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full md:w-1/2 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                />

                {!twoFactorStatus.enabled && !twoFactorSetup && (
                  <button
                    type="button"
                    onClick={handleStartTwoFactorSetup}
                    disabled={twoFactorLoading}
                    className="block bg-[#d9006c] text-white px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#ec4899] transition-colors disabled:opacity-60"
                  >
                    {twoFactorLoading ? 'Preparing...' : 'Enable 2FA'}
                  </button>
                )}

                {twoFactorSetup && (
                  <div className="border border-[#e7e1d8] rounded-lg p-5 space-y-4">
                    <img src={twoFactorSetup.qrCodeDataUrl} alt="2FA QR code" className="w-44 h-44" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full md:w-1/2 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmTwoFactor}
                      disabled={twoFactorLoading}
                      className="block bg-[#d9006c] text-white px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-[#ec4899] transition-colors disabled:opacity-60"
                    >
                      {twoFactorLoading ? 'Confirming...' : 'Confirm 2FA'}
                    </button>
                  </div>
                )}

                {twoFactorStatus.enabled && (
                  <button
                    type="button"
                    onClick={handleDisableTwoFactor}
                    disabled={twoFactorLoading}
                    className="block border border-red-300 text-red-700 px-5 py-2.5 rounded uppercase tracking-widest text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                )}

                {twoFactorRecoveryCodes.length > 0 && (
                  <div className="bg-[#fcfbf9] border border-[#e7e1d8] rounded-lg p-4">
                    <p className="text-sm font-semibold text-[#d9006c] mb-3">Save these recovery codes now. They will not be shown again.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {twoFactorRecoveryCodes.map((code) => (
                        <code key={code} className="bg-white border border-[#e7e1d8] rounded px-3 py-2 text-sm text-gray-700">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-4">
          {isSaved && <span className="text-green-600 font-semibold text-sm">Settings saved successfully!</span>}
          <button 
            type="submit"
            className="flex items-center gap-2 bg-[#d9006c] text-white px-8 py-3 rounded uppercase tracking-widest text-sm hover:bg-[#ec4899] transition-colors shadow-sm"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}



