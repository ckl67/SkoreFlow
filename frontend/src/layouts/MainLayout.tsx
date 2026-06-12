import { Outlet } from 'react-router-dom';

import TopNavbar from '../components/TopNavbar';
import SideNavbar from '../components/SideNavbar';
import DevPanel from '../dev/DevPanel';
const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true';

import './MainLayout.css';

// +----------------------+
// | TopNavbar            |
// +----------------------+
// | Side |   Content     |
// | Nav  |               |
// | bar  |               |
// +----------------------+

export default function MainLayout() {
  return (
    <div className="layout">
      {/* TOP BAR */}
      <header className="topbar">
        <TopNavbar />
      </header>

      {/* BODY */}
      <div className="body">
        <aside className="sidebar">
          <SideNavbar />
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {TEST_MODE && <DevPanel />}
    </div>
  );
}
