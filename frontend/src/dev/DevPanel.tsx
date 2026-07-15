import { DevUser } from './DevProvider';
import { useDev } from './useDev';
import { useState } from 'react';

// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------

function makeUser(prefix = 'user'): DevUser {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    username: `${prefix}-${id}`,
    email: `${prefix}-${id}@test.com`,
    password: 'password123',
  };
}

// ----------------------------------------------------------------------------
// DevPanel
// ----------------------------------------------------------------------------

export default function DevPanel() {
  const { lastRegisteredUser, setLastRegisteredUser } = useDev();

  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-4 right-4 rounded-full bg-gray-800 p-3 shadow-lg hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
        title="Open Dev Tools"
      >
        🛠️
      </button>
    );
  }

  function fillUser1() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'user1@test.com',
          password: 'password123',
        },
      })
    );
  }
  //---
  function fillUser2() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'user2@test.com',
          password: 'password123',
        },
      })
    );
  }
  //---
  function fillModerator() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'moderator1@test.com',
          password: 'password123',
        },
      })
    );
  }
  //---
  function fillAdmin() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'admin@admin.com',
          password: 'skoreflow',
        },
      })
    );
  }
  // ---
  function fillLastRegisteredUser() {
    if (!lastRegisteredUser) return;

    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: lastRegisteredUser.email,
          password: lastRegisteredUser.password,
        },
      })
    );
  }
  // ---

  function fillRegister() {
    const randomUser = makeUser();
    setLastRegisteredUser(randomUser);

    console.log('Dispatch register');
    window.dispatchEvent(
      new CustomEvent('dev:fill-register', {
        detail: {
          username: randomUser.username,
          email: randomUser.email,
          password: randomUser.password,
        },
      })
    );
  }
  // ---
  return (
    <div className="fixed bottom-4 right-4 w-64 rounded-lg border bg-white p-3 shadow-xl text-xs text-gray-700">
      <div className="flex items-center justify-between mb-2 border-b pb-1">
        <span className="font-bold text-gray-900">🛠️ Dev Tools</span>
        <button className="text-gray-400 hover:text-gray-600 px-1" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      {/* Quick Actions section */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {/*------*/}
        <button
          className="rounded border bg-gray-50 p-1 hover:bg-gray-100 font-medium text-left"
          onClick={fillUser1}
        >
          👤 User1
        </button>
        {/*------*/}
        <button
          className="rounded border bg-gray-50 p-1 hover:bg-gray-100 font-medium text-left"
          onClick={fillUser2}
        >
          👤 User2
        </button>
        {/*------*/}
        <button
          className="rounded border bg-gray-50 p-1 hover:bg-gray-100 font-medium text-left"
          onClick={fillModerator}
        >
          🛡️ Moderator
        </button>
        {/*------*/}
        <button
          className="rounded border bg-gray-50 p-1 hover:bg-gray-100 font-medium text-left"
          onClick={fillAdmin}
        >
          🔑 Admin
        </button>
        {/*------*/}
        <button
          className="col-span-2 rounded border bg-indigo-50 p-1 hover:bg-indigo-100 font-medium text-center text-indigo-700"
          onClick={fillRegister}
        >
          🎲 Random Register
        </button>
      </div>

      {/* Information about the last logged-in user */}
      {lastRegisteredUser && (
        <div className="space-y-1 bg-gray-50 p-1.5 rounded border border-dashed text-[11px] leading-tight">
          <div className="truncate">
            <strong>U:</strong> {lastRegisteredUser.username}
          </div>
          <div className="truncate">
            <strong>E:</strong> {lastRegisteredUser.email}
          </div>
          <div className="truncate">
            <strong>P:</strong> {lastRegisteredUser.password}
          </div>
          <button
            className="w-full mt-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 text-[10px] uppercase font-bold tracking-wider"
            onClick={fillLastRegisteredUser}
          >
            Inject Last
          </button>
        </div>
      )}
    </div>
  );
}
