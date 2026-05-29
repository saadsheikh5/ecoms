const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { getTransporter, getEmailFrom } = require('../config/email');
const Admin = require('../models/Admin');
const ApiError = require('../utils/apiError');

const RESET_TOKEN_MINUTES = 15;
const EMAIL_VERIFICATION_MINUTES = 30;
const OTP_TOKEN_MINUTES = 5;

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const signOtpChallengeToken = (id) => {
  return jwt.sign({ id, purpose: 'admin-2fa' }, process.env.JWT_SECRET, {
    expiresIn: `${OTP_TOKEN_MINUTES}m`,
  });
};

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isStrongPassword = (password = '') => (
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
);

const validateNewPassword = (password, confirmPassword) => {
  if (!password || !confirmPassword) {
    throw new ApiError('Please provide and confirm your new password.', 400);
  }
  if (password !== confirmPassword) {
    throw new ApiError('New password and confirmation do not match.', 400);
  }
  if (!isStrongPassword(password)) {
    throw new ApiError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 400);
  }
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createUrlWithToken = (baseUrl, token) => (
  `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
);

const createNumericCode = () => String(crypto.randomInt(100000, 1000000));

const getEncryptionKey = () => crypto
  .createHash('sha256')
  .update(process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET)
  .digest();

const encryptSecret = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return [
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
};

const decryptSecret = (encryptedText) => {
  const [ivText, tagText, cipherText] = String(encryptedText || '').split(':');
  if (!ivText || !tagText || !cipherText) return encryptedText;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

const createRecoveryCodes = async () => {
  const codes = Array.from({ length: 8 }, () => (
    crypto.randomBytes(6).toString('hex').match(/.{1,4}/g).join('-').toUpperCase()
  ));
  const hashedCodes = await Promise.all(codes.map(async (code) => ({
    codeHash: await bcrypt.hash(code, 12),
    used: false,
  })));
  return { codes, hashedCodes };
};

const getClientUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const getResetUrl = (token) => {
  const baseUrl = process.env.PASSWORD_RESET_URL || `${getClientUrl()}/#/admin/reset-password`;
  return createUrlWithToken(baseUrl, token);
};

const getEmailVerificationUrl = (token) => {
  const baseUrl = process.env.EMAIL_VERIFICATION_URL || `${getClientUrl()}/#/admin/verify-email`;
  return createUrlWithToken(baseUrl, token);
};

const sendEmail = async ({ to, subject, text, html, fallbackUrl }) => {
  const transporter = getTransporter();
  if (process.env.NODE_ENV === 'development' && fallbackUrl) {
    console.info(`Development email link for ${to}: ${fallbackUrl}`);
  }

  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Email not sent because SMTP is not configured. URL: ${fallbackUrl}`);
      return;
    }
    throw new Error('SMTP is not configured.');
  }

  const info = await transporter.sendMail({
    from: getEmailFrom(),
    to,
    subject,
    text,
    html,
  });

  console.info(`Email accepted by SMTP for ${to}: ${info.messageId || info.response}`);
};

const sendPasswordResetEmail = async (admin, resetUrl, resetCode) => {
  await sendEmail({
    to: admin.email,
    subject: 'Reset your JTS Beauty admin password',
    text: `Use this link within ${RESET_TOKEN_MINUTES} minutes to reset your admin password: ${resetUrl}\n\nOr enter this code on the admin reset screen: ${resetCode}`,
    html: `<p>Use this link within ${RESET_TOKEN_MINUTES} minutes to reset your admin password:</p><p><a href="${resetUrl}">Reset password</a></p><p>Or enter this code on the admin reset screen:</p><p><strong style="font-size:20px;letter-spacing:4px;">${resetCode}</strong></p>`,
    fallbackUrl: resetUrl,
  });
};

const sendEmailChangeVerification = async (admin, verifyUrl, verificationCode) => {
  await sendEmail({
    to: admin.pendingEmail,
    subject: 'Verify your new JTS Beauty admin email',
    text: `Use this link within ${EMAIL_VERIFICATION_MINUTES} minutes to verify your new admin email: ${verifyUrl}\n\nOr enter this code in Admin Settings: ${verificationCode}`,
    html: `<p>Use this link within ${EMAIL_VERIFICATION_MINUTES} minutes to verify your new admin email:</p><p><a href="${verifyUrl}">Verify email</a></p><p>Or enter this code in Admin Settings:</p><p><strong style="font-size:20px;letter-spacing:4px;">${verificationCode}</strong></p>`,
    fallbackUrl: verifyUrl,
  });
};

const buildAdminResponse = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  emailVerified: Boolean(admin.emailVerified),
  pendingEmail: admin.pendingEmail,
  twoFactorEnabled: Boolean(admin.twoFactorEnabled),
});

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError('Please provide email and password.', 400));
    }

    const admin = await Admin.findOne({ email: normalizeEmail(email) }).select('+password +twoFactorSecret');
    if (!admin) {
      return next(new ApiError('Invalid email or password.', 401));
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError('Invalid email or password.', 401));
    }

    if (admin.twoFactorEnabled && admin.twoFactorSecret) {
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        challengeToken: signOtpChallengeToken(admin._id),
        message: 'Two-factor verification required.',
      });
    }

    res.status(200).json({
      success: true,
      token: signToken(admin._id),
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/2fa/verify-login
// @access  Public
const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    const { challengeToken, code } = req.body;
    if (!challengeToken || !code) {
      return next(new ApiError('Please provide the verification code.', 400));
    }

    const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'admin-2fa') {
      return next(new ApiError('Invalid verification session.', 401));
    }

    const admin = await Admin.findById(decoded.id).select('+twoFactorSecret +twoFactorRecoveryCodes');
    if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      return next(new ApiError('Invalid verification session.', 401));
    }

    const cleanCode = String(code).trim();
    const isTotpValid = /^[0-9]{6}$/.test(cleanCode) && speakeasy.totp.verify({
      secret: decryptSecret(admin.twoFactorSecret),
      encoding: 'base32',
      token: cleanCode,
      window: 1,
    });

    let usedRecoveryCode = false;
    if (!isTotpValid && cleanCode) {
      for (const recoveryCode of admin.twoFactorRecoveryCodes || []) {
        if (!recoveryCode.used && await bcrypt.compare(cleanCode.toUpperCase(), recoveryCode.codeHash)) {
          recoveryCode.used = true;
          usedRecoveryCode = true;
          break;
        }
      }
    }

    if (!isTotpValid && !usedRecoveryCode) {
      return next(new ApiError('Invalid verification code.', 401));
    }

    if (usedRecoveryCode) {
      await admin.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      token: signToken(admin._id),
      admin: buildAdminResponse(admin),
      usedRecoveryCode,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @access  Private (admin only)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const admin = email ? await Admin.findOne({ email }).select('+passwordResetToken +passwordResetCodeHash +passwordResetExpires') : null;

    if (admin) {
      if (process.env.NODE_ENV === 'development') {
        console.info(`Password reset requested for existing admin: ${admin.email}`);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetCode = createNumericCode();
      admin.passwordResetToken = hashToken(resetToken);
      admin.passwordResetCodeHash = await bcrypt.hash(resetCode, 12);
      admin.passwordResetExpires = Date.now() + RESET_TOKEN_MINUTES * 60 * 1000;
      await admin.save({ validateBeforeSave: false });

      try {
        await sendPasswordResetEmail(admin, getResetUrl(resetToken), resetCode);
      } catch (error) {
        admin.passwordResetToken = undefined;
        admin.passwordResetCodeHash = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save({ validateBeforeSave: false });
        console.error(`Password reset email failed: ${error.message}`);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.info(`Password reset requested for non-admin email: ${email || '(empty)'}`);
    }

    res.status(200).json({
      success: true,
      message: 'If an admin account exists for that email, a password reset link and code have been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    validateNewPassword(password, confirmPassword);

    if (!token) {
      return next(new ApiError('Reset token is required.', 400));
    }

    const admin = await Admin.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!admin) {
      return next(new ApiError('Password reset link is invalid or has expired.', 400));
    }

    admin.password = password;
    admin.passwordChangedAt = new Date(Date.now() - 1000);
    admin.passwordResetToken = undefined;
    admin.passwordResetCodeHash = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    console.info(`Admin password reset completed for ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/reset-password-code
// @access  Public
const resetPasswordWithCode = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const { password, confirmPassword } = req.body;
    validateNewPassword(password, confirmPassword);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ApiError('Please provide the admin email address.', 400));
    }

    if (!/^[0-9]{6}$/.test(code)) {
      return next(new ApiError('Please enter the 6-digit reset code.', 400));
    }

    const admin = await Admin.findOne({
      email,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password +passwordResetToken +passwordResetCodeHash +passwordResetExpires');

    if (!admin?.passwordResetCodeHash) {
      return next(new ApiError('Password reset code is invalid or has expired.', 400));
    }

    const isMatch = await bcrypt.compare(code, admin.passwordResetCodeHash);
    if (!isMatch) {
      return next(new ApiError('Invalid password reset code.', 401));
    }

    admin.password = password;
    admin.passwordChangedAt = new Date(Date.now() - 1000);
    admin.passwordResetToken = undefined;
    admin.passwordResetCodeHash = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    console.info(`Admin password reset by code completed for ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    validateNewPassword(newPassword, confirmPassword);

    const admin = await Admin.findById(req.admin._id).select('+password');
    if (!admin || !await admin.comparePassword(currentPassword || '')) {
      return next(new ApiError('Current password is incorrect.', 401));
    }

    admin.password = newPassword;
    admin.passwordChangedAt = new Date(Date.now() - 1000);
    await admin.save();

    console.info(`Admin password changed for ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please sign in again.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/change-email/request
// @access  Private
const requestEmailChange = async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newEmail = normalizeEmail(req.body.newEmail);

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return next(new ApiError('Please provide a valid new email address.', 400));
    }

    const admin = await Admin.findById(req.admin._id).select('+password +pendingEmail +emailVerificationToken +emailVerificationCodeHash +emailVerificationExpires');
    if (!admin || !await admin.comparePassword(currentPassword)) {
      return next(new ApiError('Password confirmation failed.', 401));
    }

    if (newEmail === admin.email) {
      return next(new ApiError('New email must be different from the current email.', 400));
    }

    const existing = await Admin.findOne({ email: newEmail, _id: { $ne: admin._id } });
    if (existing) {
      return next(new ApiError('That email address is already in use.', 400));
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = createNumericCode();
    admin.pendingEmail = newEmail;
    admin.emailVerificationToken = hashToken(verificationToken);
    admin.emailVerificationCodeHash = await bcrypt.hash(verificationCode, 12);
    admin.emailVerificationExpires = Date.now() + EMAIL_VERIFICATION_MINUTES * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    try {
      await sendEmailChangeVerification(admin, getEmailVerificationUrl(verificationToken), verificationCode);
    } catch (error) {
      console.error(`Email verification send failed: ${error.message}`);
      return next(new ApiError('Unable to send verification email. Please try again later.', 502));
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Enter the 6-digit code here or use the email link.',
      data: {
        pendingEmail: admin.pendingEmail,
        emailVerified: Boolean(admin.emailVerified),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/change-email/resend
// @access  Private
const resendEmailVerification = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+pendingEmail +emailVerificationToken +emailVerificationCodeHash +emailVerificationExpires');
    if (!admin?.pendingEmail) {
      return next(new ApiError('There is no pending email change to verify.', 400));
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = createNumericCode();
    admin.emailVerificationToken = hashToken(verificationToken);
    admin.emailVerificationCodeHash = await bcrypt.hash(verificationCode, 12);
    admin.emailVerificationExpires = Date.now() + EMAIL_VERIFICATION_MINUTES * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    try {
      await sendEmailChangeVerification(admin, getEmailVerificationUrl(verificationToken), verificationCode);
    } catch (error) {
      console.error(`Email verification resend failed: ${error.message}`);
      return next(new ApiError('Unable to send verification email. Please try again later.', 502));
    }

    res.status(200).json({
      success: true,
      message: 'Verification email resent. Enter the latest 6-digit code here or use the email link.',
      data: {
        pendingEmail: admin.pendingEmail,
      },
    });
  } catch (error) {
    next(error);
  }
};

const completeEmailChange = async (admin) => {
  const existing = await Admin.findOne({ email: admin.pendingEmail, _id: { $ne: admin._id } });
  if (existing) {
    throw new ApiError('That email address is already in use.', 400);
  }

  admin.email = admin.pendingEmail;
  admin.pendingEmail = undefined;
  admin.emailVerified = true;
  admin.emailVerificationToken = undefined;
  admin.emailVerificationCodeHash = undefined;
  admin.emailVerificationExpires = undefined;
  admin.passwordChangedAt = new Date(Date.now() - 1000);
  await admin.save({ validateBeforeSave: false });
  console.info(`Admin email changed for account ${admin._id}`);
};

// @route   POST /api/auth/change-email/verify
// @access  Public
const verifyEmailChange = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(new ApiError('Email verification token is required.', 400));
    }

    const admin = await Admin.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+pendingEmail +emailVerificationToken +emailVerificationExpires');

    if (!admin?.pendingEmail) {
      return next(new ApiError('Email verification link is invalid or has expired.', 400));
    }

    await completeEmailChange(admin);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please sign in with your new email address.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/change-email/verify-code
// @access  Private
const verifyEmailChangeCode = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!/^[0-9]{6}$/.test(code)) {
      return next(new ApiError('Please enter the 6-digit verification code.', 400));
    }

    const admin = await Admin.findById(req.admin._id).select('+pendingEmail +emailVerificationCodeHash +emailVerificationExpires +emailVerificationToken');
    if (!admin?.pendingEmail || !admin.emailVerificationCodeHash || !admin.emailVerificationExpires || admin.emailVerificationExpires <= Date.now()) {
      return next(new ApiError('Email verification code is invalid or has expired.', 400));
    }

    const isMatch = await bcrypt.compare(code, admin.emailVerificationCodeHash);
    if (!isMatch) {
      return next(new ApiError('Invalid verification code.', 401));
    }

    await completeEmailChange(admin);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please sign in with your new email address.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/2fa/status
// @access  Private
const getTwoFactorStatus = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+twoFactorRecoveryCodes');
    res.status(200).json({
      success: true,
      data: {
        enabled: Boolean(admin.twoFactorEnabled),
        recoveryCodesRemaining: (admin.twoFactorRecoveryCodes || []).filter((code) => !code.used).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/2fa/setup
// @access  Private
const setupTwoFactor = async (req, res, next) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password +twoFactorPendingSecret');
    if (!admin || !await admin.comparePassword(password || '')) {
      return next(new ApiError('Password confirmation failed.', 401));
    }

    const secret = speakeasy.generateSecret({
      name: `${process.env.TWO_FACTOR_ISSUER || 'JTS Beauty'} (${admin.email})`,
      issuer: process.env.TWO_FACTOR_ISSUER || 'JTS Beauty',
      length: 20,
    });

    admin.twoFactorPendingSecret = encryptSecret(secret.base32);
    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        qrCodeDataUrl: await qrcode.toDataURL(secret.otpauth_url),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/2fa/confirm
// @access  Private
const confirmTwoFactor = async (req, res, next) => {
  try {
    const { code } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+twoFactorPendingSecret +twoFactorRecoveryCodes');
    if (!admin?.twoFactorPendingSecret) {
      return next(new ApiError('Start two-factor setup before confirming.', 400));
    }

    const secret = decryptSecret(admin.twoFactorPendingSecret);
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(code || '').trim(),
      window: 1,
    });

    if (!isValid) {
      return next(new ApiError('Invalid verification code.', 401));
    }

    const { codes, hashedCodes } = await createRecoveryCodes();
    admin.twoFactorEnabled = true;
    admin.twoFactorSecret = admin.twoFactorPendingSecret;
    admin.twoFactorPendingSecret = undefined;
    admin.twoFactorRecoveryCodes = hashedCodes;
    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled.',
      data: { recoveryCodes: codes },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/2fa/disable
// @access  Private
const disableTwoFactor = async (req, res, next) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password +twoFactorSecret +twoFactorPendingSecret +twoFactorRecoveryCodes');
    if (!admin || !await admin.comparePassword(password || '')) {
      return next(new ApiError('Password confirmation failed.', 401));
    }

    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    admin.twoFactorPendingSecret = undefined;
    admin.twoFactorRecoveryCodes = [];
    await admin.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/create-admin  (run once to create first admin)
// @access  Public - DISABLE THIS IN PRODUCTION after creating your admin!
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await Admin.findOne({ email: normalizeEmail(email) });
    if (existing) {
      return next(new ApiError('Admin with this email already exists.', 400));
    }

    const admin = await Admin.create({ name, email: normalizeEmail(email), password });
    const token = signToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      admin: buildAdminResponse(admin),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
