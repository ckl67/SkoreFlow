import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div>
      {/* TOP BAR */}
      <Navbar />

      {/* CONTENT AREA */}
      <div style={{ padding: 20 }}>
        <Outlet />
      </div>
    </div>
  );
}
