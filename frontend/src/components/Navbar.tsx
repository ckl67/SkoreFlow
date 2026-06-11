import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav>
      <Link to="/login">Login</Link>
      {' | '}
      <Link to="/register">Register</Link>
      {' | '}
      <Link to="/confirm-registration">Confirm</Link>
      {' | '}
      <Link to="/resend-registration">Resend</Link>
      {' | '}
      <Link to="/forgot-password">Forgot</Link>
      {' | '}
      <Link to="/reset-password">Reset</Link>
    </nav>
  );
}
