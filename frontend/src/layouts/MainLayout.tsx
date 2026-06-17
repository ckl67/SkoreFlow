import { Outlet } from 'react-router-dom';

import TopNavbar from '../components/TopNavbar';
import SideNavbar from '../components/SideNavbar';
import DevPanel from '../dev/DevPanel';
const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true';

// +----------------------+
// | TopNavbar            |
// +----------------------+
// | Side |   Content     |
// | Nav  |               |
// | bar  |               |
// +----------------------+

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col">
      {/* TOP BAR */}
      <header className="h-16 border-b ">
        <TopNavbar />
      </header>

      {/* BODY */}
      <div className="flex flex-1">
        <aside className="w-64 p-4 border-r">
          <SideNavbar />
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>

      {TEST_MODE && <DevPanel />}
    </div>
  );
}
