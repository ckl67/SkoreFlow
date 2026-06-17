import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function TopNavbar() {
  const { user, isAuthenticated, logout } = useAuth();

  console.log('RAW USER', user);
  console.log('USERNAME', user?.username);
  console.log('KEYS', user ? Object.keys(user) : null);

  console.log('TopNavbar: isAuthenticated', isAuthenticated, 'user', user?.username);

  return (
    <div className="flex items-center justify-between px-4 h-full">
      {/* LEFT: Logo */}
      <div className="flex items-center">
        <img src="images/linear-300x64.png" alt="SkoreFlow" className="h-8 w-auto" />
      </div>
      {/* CENTER: Navigation */}
      <div className="flex gap-4 text-sm">
        <Link className="hover:text-blue-500" to="/login">
          Login
        </Link>

        <Link className="hover:text-blue-500" to="/register">
          Register
        </Link>
      </div>

      {/* RIGHT: Auth */}
      <div className="flex gap-3 items-center text-sm">
        {isAuthenticated ? (
          <>
            <span className="text-gray-600"> {user?.username}</span>

            <Link className="hover:text-blue-500" to="/me">
              Profile
            </Link>

            <button onClick={logout} className="text-red-500 hover:text-red-600">
              Logout
            </button>
          </>
        ) : (
          <Link className="text-blue-600 hover:text-blue-700" to="/login">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
