import { Outlet } from 'react-router-dom';
import { config } from './../config/config';
import { useState } from 'react';
import TopNavbar from './TopNavbar';
import SideNavbar from './SideNavbar';
import DevPanel from '../dev/DevPanel';

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
    <div className="flex flex-col h-screen">
      {/* ------------------------------------------------------------- */}
      {/*                     +++ TOP BAR HEADER +++                    */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 border-b shrink-0">
        <TopNavbar />
      </header>

      {/* ------------------------------------------------------------- */}
      {/*                      +++ BODY  +++                            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* ------------------------- */}
        {/*     --- SIDEBAR ---       */}
        {/* ------------------------- */}
        {isOpen && (
          <aside className="flex w-32 shrink-0 p-2 border-r flex-col justify-between">
            <SideNavbar />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Collapse the menu"
            >
              <span>«</span>
              <span>Collapse</span>
            </button>
          </aside>
        )}
        {/* ------------------------- */}
        {/*    --- MAIN LAYOUT ---    */}
        {/* ------------------------- */}
        {/* min-h-0 remove the minimum height imposed by the content otherwise scroll would not be possible */}
        <main className="flex flex-1 flex-col min-h-0 overflow-auto p-2">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/*                          +++ FOOTER +++                       */}
      {/* ------------------------------------------------------------- */}

      <footer className="flex flex-row relative h-8 shrink-0 items-center justify-between border-t bg-gray-50 px-6 text-xs text-gray-500">
        {/* Left-hand pane: Status or dynamic indicator */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Ready</span>
        </div>

        {/* Right-hand section: Application version */}
        <div className="font-mono text-gray-400">v1.0.0</div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/*                 +++ FLOATING BUTTONS ++++                     */}
      {/* ------------------------------------------------------------- */}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute bottom-10 left-3 z-10 flex h-12 w-12 items-center justify-center rounded-lg border bg-gray-300"
          title="Open the sidebar"
        >
          <span className="text-2xl">🎭</span>
        </button>
      )}

      {config.testMode && <DevPanel />}
    </div>
  );
}
