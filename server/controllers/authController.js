const bcrypt = require('bcryptjs');
const { findUserByEmail, findUserById, createUser, updatePassword } = require('../models/userModel');
const { createPatientProfile } = require('../models/patientModel');
const { createDoctor } = require('../models/doctorModel');
const { signToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Always create as patient
    const user = await createUser({ name, email, passwordHash, role: 'patient' });
    await createPatientProfile({ userId: user.id });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user,
    });
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
  login,
  adminLogin,
  me,
  changePassword,
};


