import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';
import AvatarMenu from './AvatarMenu';
import { User } from 'lucide-react';
import { PanelLeftOpen } from 'lucide-react';

type TopNavbarProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

export default function TopNavbar({ isOpen, setIsOpen }: TopNavbarProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 h-full">
      {/* Left-hand group: Sidebar button + Logo */}
      <div className="flex items-center gap-3">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-slate-400 hover:text-indigo-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100"
            title="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}

        <Link to="/">
          <img
            src="/images/linear-300x64.png"
            alt="SkoreFlow"
            className="h-8 w-auto cursor-pointer"
          />
        </Link>
      </div>

      {/* Right-hand group: Auth / Avatar */}
      <div className="flex items-center">
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
    </div>
  );
}
