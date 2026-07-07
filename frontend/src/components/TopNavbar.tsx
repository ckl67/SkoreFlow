import { Link } from 'react-router-dom';
import { useAuth } from '../auth/ useAuth';
import AvatarMenu from './AvatarMenu';
import { User } from 'lucide-react';

export default function TopNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 h-full">
      <Link to="/">
        <img src="images/linear-300x64.png" alt="SkoreFlow" className="h-8 w-auto cursor-pointer" />
      </Link>

      {!isAuthenticated ? (
        <Link
          to="/login"
          className="text-slate-400 hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100"
          title="Sign in"
        >
          <User className="w-6 h-6" />
        </Link>
      ) : (
        <AvatarMenu />
      )}
    </div>
  );
}
