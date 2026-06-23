import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AvatarMenu from './AvatarMenu';

export default function TopNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 h-full">
      <img src="images/linear-300x64.png" alt="SkoreFlow" className="h-8 w-auto" />

      {!isAuthenticated ? (
        <Link to="/login" className="rounded border px-3 py-2 hover:bg-gray-100">
          Login
        </Link>
      ) : (
        <AvatarMenu />
      )}
    </div>
  );
}
