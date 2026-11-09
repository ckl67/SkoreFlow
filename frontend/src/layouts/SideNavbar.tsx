import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';
import { UserRole } from '../../../shared/frontend/enums/userRoles';
export default function SideNavbar() {
  const { user } = useAuth();

  return (
    <nav className="flex flex-col h-full justify-between w-full py-2">
      <ul className="space-y-2">
        <li>
          <Link
            to="/composers"
            className="
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              block
              w-full
              px-2 py-2
              text-center
              "
          >
            Composers
          </Link>
        </li>

        <li>
          <Link
            to="/scores"
            className="
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              block
              w-full
              px-2 py-2
              text-center
              "
          >
            Scores
          </Link>
        </li>
        <li>
          <Link
            to="/pending"
            className="
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              block
              w-full
              px-2 py-2
              text-center
              "
          >
            Conductor
          </Link>
        </li>
      </ul>
      {/*  --- Preferences / Admin --- */}
      <ul>
        <li>
          <Link
            to="/pending"
            className="
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              block
              w-full
              px-2 py-2
              text-center
              "
          >
            Preferences
          </Link>
        </li>

        {user?.role === UserRole.Admin && (
          <li>
            <Link
              to="/pending"
              className="
              text-red-600
              hover:bg-gray-200
              hover:text-indigo-800
              transition-colors
              rounded-md
              block
              w-full
              px-2 py-2
              text-center
              "
            >
              Admin
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
