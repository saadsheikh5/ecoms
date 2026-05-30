const express = require('express');
const router = express.Router();
const {
  login,
  verifyTwoFactorLogin,
  getMe,
  forgotPassword,
  resetPassword,
  resetPasswordWithCode,
  changePassword,
  requestEmailChange,
  resendEmailVerification,
  verifyEmailChange,
  verifyEmailChangeCode,
  getTwoFactorStatus,
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  createAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/2fa/verify-login', verifyTwoFactorLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password-code', resetPasswordWithCode);
router.post('/change-email/verify', verifyEmailChange);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/change-email/request', protect, requestEmailChange);
router.post('/change-email/resend', protect, resendEmailVerification);
router.post('/change-email/verify-code', protect, verifyEmailChangeCode);
router.get('/2fa/status', protect, getTwoFactorStatus);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/confirm', protect, confirmTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);
// Enable only while bootstrapping the first production admin.
if (process.env.ALLOW_ADMIN_BOOTSTRAP === 'true' || process.env.NODE_ENV !== 'production') {
  router.post('/create-admin', createAdmin);
}

module.exports = router;
