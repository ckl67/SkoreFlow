import { Outlet } from 'react-router-dom';
import { config } from './../config/config';
import { useState } from 'react';
import TopNavbar from '../components/layouts/TopNavbar';
import SideNavbar from '../components/layouts/SideNavbar';
import DevPanel from '../dev/DevPanel';

// +----------------------+
// | TopNavbar            |
// +----------------------+
// | Side |   Content     |
// | Nav  |               |
// | bar  |               |
// +----------------------+

export default function MainLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col">
      {/* TOP BAR */}
      <header className="h-16 border-b">
        <TopNavbar />
      </header>

      {/* BODY */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR: displayed only if isOpen is true */}
        {isOpen && (
          <aside className="w-32 p-2 border-r bg-white flex flex-col justify-between">
            <SideNavbar />
            <button
              className="text-sm text-gray-500 hover:text-gray-700 pt-4 border-t"
              onClick={() => setIsOpen(false)}
            >
              ✕ Close Sidebar menu
            </button>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>

        {/* BUTTON: appears if the sidebar is CLOSED */}
        {!isOpen && (
          <button
            className="fixed bottom-4 left-4 rounded-full bg-gray-300 p-3 text-white shadow-lg hover:scale-105 "
            onClick={() => setIsOpen(true)}
            title="Open the sidebar"
          >
            🎭
          </button>
        )}
      </div>

      {config.testMode && <DevPanel />}
    </div>
  );
}
