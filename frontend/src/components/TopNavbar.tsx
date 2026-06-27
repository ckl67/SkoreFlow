import { Link } from 'react-router-dom';
import { useAuth } from '../auth/ useAuth';
import AvatarMenu from './AvatarMenu';

export default function TopNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 h-full">
      <Link to="/">
        <img src="images/linear-300x64.png" alt="SkoreFlow" className="h-8 w-auto cursor-pointer" />
      </Link>

      {!isAuthenticated ? (
        <Link to="/login" className="C">
          Sign In
        </Link>
      ) : (
        <AvatarMenu />
      )}
    </div>
  );
}
