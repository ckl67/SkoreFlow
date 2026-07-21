import { Outlet } from 'react-router-dom';
import { config } from './../config/config';

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

      {config.testMode && <DevPanel />}
    </div>
  );
}
