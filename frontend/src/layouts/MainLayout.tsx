import { Outlet } from 'react-router-dom';
import { config } from './../config/config';
import { useState } from 'react';
import TopNavbar from './TopNavbar';
import SideNavbar from './SideNavbar';
import DevPanel from '../dev/DevPanel';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// +----------------------+
// | TopNavbar            |
// +----------------------+
// | Side |   Content     |
// | Nav  |               |
// | bar  |   <Bottom>    |
// +----------------------+

export default function MainLayout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* ------------------------------------------------------------- */}
      {/*                     +++ TOP BAR HEADER +++                    */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 border-b shrink-0">
        <TopNavbar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      </header>

      {/* ------------------------------------------------------------- */}
      {/*                      +++ BODY  +++                            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* ------------------------- */}
        {/*     --- SIDEBAR ---       */}
        {/* ------------------------- */}
        {isOpen && (
          <aside
            className="
          flex
          flex-col
          w-16
          shrink-0
          p-2
          border-r
          justify-between
          bg-white"
          >
            <SideNavbar />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </aside>
        )}
        {/* ------------------------- */}
        {/*    --- MAIN LAYOUT ---    */}
        {/* ------------------------- */}
        {/* min-h-0 remove the minimum height imposed by the content otherwise scroll would not be possible */}
        <main
          className="
        flex flex-col
        h-full w-full
        min-h-0 overflow-auto
        p-2"
        >
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/*                   +++ ACTION BUTTONS ++++                     */}
      {/* ------------------------------------------------------------- */}

      {/* ------------------------- */}
      {/*    --- DEV BUTTON  ---    */}
      {/* ------------------------- */}
      {config.testMode && <DevPanel />}
    </div>
  );
}
