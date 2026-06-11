import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterConfirmPage from './pages/RegisterConfirmPage';
import RegisterResendPage from './pages/RegisterResendPage';
import PasswordForgotPage from './pages/PasswordForgotPage';
import PasswordResetPage from './pages/PasswordResetPage';

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-registration" element={<RegisterConfirmPage />} />
        <Route path="/resend-registration" element={<RegisterResendPage />} />
        <Route path="/forgot-password" element={<PasswordForgotPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
      </Routes>
    </>
  );
}
