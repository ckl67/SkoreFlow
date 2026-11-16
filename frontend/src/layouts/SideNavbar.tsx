import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';
import { UserRole } from '../../../shared/frontend/enums/userRoles';
// https://lucide.dev/icons/
import {
  Users,
  FileText,
  Feather,
  GraduationCap,
  Sliders,
  ListMusic,
  Lectern,
  Settings,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export default function SideNavbar() {
  const { user } = useAuth();

  return (
    <nav className="flex flex-col h-full justify-between w-full py-2">
      <ul className="space-y-2">
        {/*  --- Composers --- */}
        <li>
          <Link
            to="/composers"
            title="Composers"
            className="
              flex items-center justify-center
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
              "
          >
            <Feather className="w-5 h-5" />
          </Link>
        </li>
        {/*  --- Scores --- */}
        <li>
          <Link
            to="/scores"
            title="Scores"
            className="
              flex items-center justify-center
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
             "
          >
            <ListMusic className="w-5 h-5" />
          </Link>
        </li>
        {/*  --- Conductor --- */}
        <li>
          <Link
            to="/pending"
            title="Conductor"
            className="
              flex items-center justify-center
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
              "
          >
            <Lectern className="w-5 h-5" />
          </Link>
        </li>
      </ul>
      {/*  --- Preferences --- */}
      <ul>
        <li>
          <Link
            to="/pending"
            title="Preferences"
            className="
              flex items-center justify-center
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
              "
          >
            <Settings className="w-5 h-5" />
          </Link>
        </li>
        {/*  --- Moderator --- */}
        {(user?.role === UserRole.Moderator ||
          user?.role === UserRole.Admin) && (
          <li>
            <Link
              to="/pending"
              title="Moderator"
              className="
              flex items-center justify-center
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
              "
            >
              <Shield className="w-5 h-5" />
            </Link>
          </li>
        )}

        {/*  --- Admin --- */}
        {user?.role === UserRole.Admin && (
          <li>
            <Link
              to="/pending"
              title="Admin"
              className="
              flex items-center justify-center
              text-red-600
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              w-full
              py-2
              "
            >
              <ShieldAlert className="w-5 h-5" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
