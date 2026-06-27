import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './../auth/ useAuth';

export default function AvatarMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // 1. Create a reference to cover the entire menu (button + dropdown)
  const menuRef = useRef<HTMLDivElement>(null);

  // 2. Listen for clicks across the entire page
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If the menu is open and the clicked item is NOT in our menuRef
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    // Attach the event if the menu is open
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clear the listener when the component is unmounted or the menu is closed
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  if (!user || !user.username) {
    return null;
  }

  return (
    // 3. We attach the ref to the relative parent div
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 hover:bg-blue-200">
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

          {/* Optional: The menu also closes when you click on a link */}
          <Link
            to="/me"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            My Profile
          </Link>

          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Settings
          </Link>

          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
