import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/ useAuth';

export default function AvatarMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user || !user.username) {
    return null;
  }

  return (
    <div className="relative">
      {/* Avatar button */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200  hover:bg-blue-200">
          {user.username.charAt(0).toUpperCase() || '?'}
        </div>

        <span>{user.username}</span>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-12 w-56 rounded-md border bg-white shadow-lg">
          <div className="border-b px-4 py-3">
            <div className="font-medium">{user.username}</div>

            <div className="text-sm text-gray-500">{user.email}</div>
          </div>

          <Link to="/me" className="block px-4 py-2 hover:bg-gray-100">
            My Profile
          </Link>

          <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">
            Settings
          </Link>

          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
