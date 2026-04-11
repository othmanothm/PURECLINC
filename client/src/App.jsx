import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { AuthProvider } from './auth/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientBillingPage from './pages/patient/PatientBillingPage';
import MedicalProfilePage from './pages/patient/MedicalProfilePage';
import AppointmentsPage from './pages/patient/AppointmentsPage';
import MessagesPage from './pages/patient/MessagesPage';
import StorePage from './pages/patient/StorePage';
import ProductDetailPage from './pages/patient/ProductDetailPage';
import CartPage from './pages/patient/CartPage';
import OrdersPage from './pages/patient/OrdersPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import PatientsPage from './pages/doctor/PatientsPage';
import PatientRecordPage from './pages/doctor/PatientRecordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import DoctorsPage from './pages/admin/DoctorsPage';
import ProductsPage from './pages/admin/ProductsPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminPatientHistoryPage from './pages/admin/AdminPatientHistoryPage';
import SettingsPage from './pages/SettingsPage';
import ReviewsTestPage from './pages/ReviewsTestPage';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <AuthProvider>
        <div className="min-h-screen bg-bg-secondary dark:bg-slate-900 text-text-primary dark:text-slate-100 transition-colors duration-200">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-slate-800 dark:text-slate-100',
              style: {
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                className: 'dark:bg-slate-800 dark:text-slate-100',
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                className: 'dark:bg-slate-800 dark:text-slate-100',
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reviews-test" element={<ReviewsTestPage />} />

          {/* Patient */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medical-profile"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <MedicalProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/billing"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <PatientBillingPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <AppointmentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/messages"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <StorePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/store/product/:id"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <ProductDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <CartPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="patient">
                <Layout>
                  <OrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Doctor */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute role="doctor">
                <Layout>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute role="doctor">
                <Layout>
                  <DoctorAppointmentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute role="doctor">
                <Layout>
                  <PatientsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId"
            element={
              <ProtectedRoute role="doctor">
                <Layout>
                  <PatientRecordPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/messages"
            element={
              <ProtectedRoute role="doctor">
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Settings - Available for all authenticated users */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <DoctorsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <AdminOrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patient-history"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <AdminPatientHistoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
