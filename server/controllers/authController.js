const bcrypt = require('bcryptjs');
const {
  findUserByEmail,
  findUserById,
  createUser,
  updatePassword,
  setEmailVerificationChallenge,
  isVerificationChallengeActive,
  markEmailVerified,
} = require('../models/userModel');
const { createPatientProfile } = require('../models/patientModel');
const { signToken } = require('../utils/jwt');
const { sendPatientVerificationEmail } = require('../utils/mailer');
const {
  generateSixDigitCode,
  hashVerificationCode,
  verifyStoredCode,
} = require('../utils/verificationCode');

async function register(req, res, next) {
  try {
    const { name, email } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(req.body.password, salt);

    const user = await createUser({
      name,
      email,
      passwordHash,
      role: 'patient',
      emailVerified: false,
    });
    await createPatientProfile({ userId: user.id });

    const code = generateSixDigitCode();
    const codeHash = hashVerificationCode(code);
    await setEmailVerificationChallenge(user.id, codeHash);

    try {
      await sendPatientVerificationEmail(email, name, code);
    } catch (mailErr) {
      console.error('Verification email failed:', mailErr);
      return res.status(503).json({
        message:
          'Account was created but the verification email could not be sent. Try "Resend code" in a moment or contact support.',
        requiresVerification: true,
        email,
      });
    }

    return res.status(201).json({
      requiresVerification: true,
      email,
      message: 'We sent a verification code to your email. Enter it to activate your account.',
    });
  } catch (err) {
    return next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    const user = await findUserByEmail(email);
    if (!user || user.role !== 'patient') {
      return res.status(400).json({ message: 'Invalid verification request' });
    }
    if (user.email_verified) {
      return res.status(400).json({ message: 'This email is already verified. You can sign in.' });
    }
    const challengeActive = await isVerificationChallengeActive(user.id);
    if (!challengeActive) {
      return res.status(400).json({
        message: 'This code has expired. Use "Resend code" to get a new one.',
        code: 'VERIFICATION_EXPIRED',
      });
    }
    if (!verifyStoredCode(code, user.email_verification_code_hash)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await markEmailVerified(user.id);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = signToken(safeUser);

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    return next(err);
  }
}

async function resendVerificationEmail(req, res, next) {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user || user.role !== 'patient' || user.email_verified) {
      return res.json({
        message: 'If an account needs verification, a new code will be sent shortly.',
      });
    }

    const cooldownSec = Number(process.env.EMAIL_VERIFICATION_RESEND_SECONDS || 60);
    if (user.email_verification_sent_at) {
      const sent = new Date(user.email_verification_sent_at).getTime();
      if (Date.now() - sent < cooldownSec * 1000) {
        const waitSec = Math.ceil((cooldownSec * 1000 - (Date.now() - sent)) / 1000);
        return res.status(429).json({
          message: `Please wait ${waitSec} seconds before requesting another code.`,
        });
      }
    }

    const code = generateSixDigitCode();
    const codeHash = hashVerificationCode(code);
    await setEmailVerificationChallenge(user.id, codeHash);

    try {
      await sendPatientVerificationEmail(email, user.name, code);
    } catch (mailErr) {
      console.error('Resend verification email failed:', mailErr);
      return res.status(503).json({ message: 'Could not send email. Try again later.' });
    }

    return res.json({ message: 'A new verification code was sent to your email.' });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'patient' && !user.email_verified) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message:
          'Please verify your email before signing in. Check your inbox for the code, or request a new one from the verification page.',
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.role === 'admin' ? { admin_role: user.admin_role ?? null } : {}),
    };
    const token = signToken(safeUser);

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    return next(err);
  }
}

async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      admin_role: user.admin_role ?? null,
    };
    const token = signToken(safeUser);

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.role === 'admin' ? { admin_role: user.admin_role ?? null } : {}),
    };
    return res.json({ user: safeUser });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user and verify current password
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await updatePassword(userId, passwordHash);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  adminLogin,
  me,
  changePassword,
};


