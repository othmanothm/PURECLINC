const { findUserById, findUserByEmail } = require('../models/userModel');
const { getReviewsByPatientUserId, getReviewById, deleteReviewById } = require('../models/reviewModel');
const { getAllDoctors, createDoctor, updateDoctor } = require('../models/doctorModel');
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../models/productModel');
const { getAllOrders } = require('../models/orderModel');
const { getDb } = require('../config/db');

async function getStats(req, res, next) {
  try {
    const db = getDb();

    // Total patients
    const [patientsCount] = await db.query(
      "SELECT COUNT(*) as count FROM Users WHERE role = 'patient'"
    );

    // Total appointments
    const [appointmentsCount] = await db.query('SELECT COUNT(*) as count FROM Appointments');

    // Total sales: paid store orders + amount collected on treatment sessions
    const [storeSalesRow] = await db.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM Orders
       WHERE payment_status = 'paid' AND status != 'cancelled'`
    );
    const [treatmentPaidRow] = await db.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total FROM TreatmentSessions`
    );
    const totalSales =
      parseFloat(storeSalesRow[0].total || 0) + parseFloat(treatmentPaidRow[0].total || 0);

    // Recent orders (last 7 days)
    const [recentOrders] = await db.query(
      `SELECT COUNT(*) as count FROM Orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    return res.json({
      stats: {
        totalPatients: patientsCount[0].count,
        totalAppointments: appointmentsCount[0].count,
        totalSales,
        recentOrders: recentOrders[0].count,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/** Minimal list for patient financial history picker (Users.id for patients). */
async function getPatientUserOptions(req, res, next) {
  try {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email FROM Users u
       WHERE u.role = 'patient'
       ORDER BY u.name ASC
       LIMIT 500`
    );
    return res.json({ users: rows });
  } catch (err) {
    return next(err);
  }
}

/** Recent store activity + low stock — for admin dashboard widgets */
async function getStoreSummary(req, res, next) {
  try {
    const db = getDb();
    const [lowStockProducts] = await db.query(
      `SELECT id, name, stock, low_stock_threshold, is_active
       FROM Products
       WHERE stock > 0 AND (
         (low_stock_threshold IS NOT NULL AND stock <= low_stock_threshold) OR
         (low_stock_threshold IS NULL AND stock <= 5)
       )
       ORDER BY stock ASC
       LIMIT 12`
    );
    const [recentOrders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.payment_status, o.created_at,
              u.name AS patient_name, u.email AS patient_email
       FROM Orders o
       JOIN Patients p ON o.patient_id = p.id
       JOIN Users u ON p.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 8`
    );
    const [paidRow] = await db.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total FROM Orders
       WHERE payment_status = 'paid' AND status != 'cancelled'`
    );
    return res.json({
      summary: {
        lowStockProducts,
        recentOrders,
        paidOrdersRevenue: parseFloat(paidRow[0].total || 0),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const db = getDb();
    const { limit = 50, offset = 0, search } = req.query;
    const searchTrim = typeof search === 'string' ? search.trim() : '';

    let sql = 'SELECT id, name, email, role, created_at FROM Users';
    const params = [];

    if (searchTrim) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${searchTrim}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

    const [users] = await db.query(sql, params);

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Get current user to check role change
    const currentUser = await findUserById(parseInt(id));
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const db = getDb();
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role !== undefined) {
      if (!['patient', 'doctor', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.json({ user: currentUser });
    }

    // Handle role change - update profiles
    if (role !== undefined && role !== currentUser.role) {
      const { getPatientByUserId, createPatientProfile } = require('../models/patientModel');
      const { getDoctorByUserId, createDoctor } = require('../models/doctorModel');

      const currentPatient = await getPatientByUserId(parseInt(id));
      const currentDoctor = await getDoctorByUserId(parseInt(id));

      // Remove old profile based on current role
      if (currentUser.role === 'patient' && currentPatient) {
        // Delete patient profile (cascade will handle MedicalRecords)
        await db.query('DELETE FROM Patients WHERE user_id = ?', [parseInt(id)]);
      } else if (currentUser.role === 'doctor' && currentDoctor) {
        // Delete doctor profile
        await db.query('DELETE FROM Doctors WHERE user_id = ?', [parseInt(id)]);
      }
      // If current role is 'admin', no profile to delete

      // Create new profile based on new role
      if (role === 'patient') {
        // Create patient profile
        await createPatientProfile({ userId: parseInt(id) });
      } else if (role === 'doctor') {
        // Create doctor profile
        await createDoctor({ userId: parseInt(id), specialization: null });
      }
      // If new role is 'admin', no profile needed
    }

    // Update user
    params.push(id);
    await db.query(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await findUserById(parseInt(id));
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.query('DELETE FROM Users WHERE id = ?', [id]);
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

async function getPatientUserReviews(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'patient') {
      return res.status(400).json({ message: 'User is not a patient' });
    }
    const statusFilter = req.query.status === undefined || req.query.status === '' ? 'all' : req.query.status;
    const reviews = await getReviewsByPatientUserId(userId, { status: statusFilter });
    return res.json({ reviews });
  } catch (err) {
    return next(err);
  }
}

async function deleteAdminReview(req, res, next) {
  try {
    const reviewId = parseInt(req.params.reviewId, 10);
    const existing = await getReviewById(reviewId);
    if (!existing) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await deleteReviewById(reviewId);
    return res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

async function getDoctorsList(req, res, next) {
  try {
    const doctors = await getAllDoctors();
    return res.json({ doctors });
  } catch (err) {
    return next(err);
  }
}

async function createDoctorController(req, res, next) {
  try {
    const { email, name, specialization, password } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'email and name are required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'password is required and must be at least 6 characters' });
    }

    // Check if user exists
    let user = await findUserByEmail(email);
    if (!user) {
      // Create user with doctor role
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const db = getDb();
      const [result] = await db.query(
        'INSERT INTO Users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)',
        [name, email, passwordHash, 'doctor']
      );
      user = { id: result.insertId, name, email, role: 'doctor' };
    } else {
      // Update existing user to doctor role and update password if provided
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const db = getDb();
      await db.query(
        'UPDATE Users SET role = ?, name = ?, password = ?, email_verified = 1 WHERE id = ?',
        ['doctor', name, passwordHash, user.id]
      );
      user.role = 'doctor';
      user.name = name;
    }

    // Create or update doctor profile
    const { getDoctorByUserId } = require('../models/doctorModel');
    let doctor = await getDoctorByUserId(user.id);
    if (!doctor) {
      doctor = await createDoctor({ userId: user.id, specialization });
    } else {
      doctor = await updateDoctor(doctor.id, { specialization });
    }

    return res.status(201).json({ user, doctor });
  } catch (err) {
    return next(err);
  }
}

async function updateDoctorController(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, specialization } = req.body;

    const { getDoctorById } = require('../models/doctorModel');
    const doctor = await getDoctorById(parseInt(id));
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const db = getDb();
    if (name || email) {
      await db.query('UPDATE Users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?', [
        name || null,
        email || null,
        doctor.user_id,
      ]);
    }

    if (specialization !== undefined) {
      await updateDoctor(doctor.id, { specialization });
    }

    const updated = await getDoctorById(doctor.id);
    return res.json({ doctor: updated });
  } catch (err) {
    return next(err);
  }
}

async function deleteDoctorController(req, res, next) {
  try {
    const { id } = req.params;
    const { getDoctorById } = require('../models/doctorModel');
    const doctor = await getDoctorById(parseInt(id));
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete user (cascade will delete doctor)
    const db = getDb();
    await db.query('DELETE FROM Users WHERE id = ?', [doctor.user_id]);
    return res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStats,
  getPatientUserOptions,
  getStoreSummary,
  getAllUsers,
  updateUser,
  deleteUser,
  getPatientUserReviews,
  deleteAdminReview,
  getDoctorsList,
  createDoctorController,
  updateDoctorController,
  deleteDoctorController,
};

