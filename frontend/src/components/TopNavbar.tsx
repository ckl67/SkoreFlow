import { Link } from 'react-router-dom';

export default function TopNavbar() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <strong>SkoreFlow</strong>

      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/logout">Logout</Link>
    </div>
  );
}
