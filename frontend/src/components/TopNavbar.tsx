import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function TopNavbar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <strong>SkoreFlow</strong>

      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/logout">Logout</Link>

      {isAuthenticated ? (
        <>
          <span>{isAuthenticated ? `Connected as ${user?.username}` : 'Guest'}</span>
          <Link to="/me">My Profile</Link>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
}
