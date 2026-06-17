// ----------------------------------------------------------------------------
// INTERFACE
// ----------------------------------------------------------------------------

interface TestUser {
  username: string;
  email: string;
  password: string;
}

// ----------------------------------------------------------------------------
// LOCAL HELPER
// ----------------------------------------------------------------------------

function makeUser(prefix = 'user'): TestUser {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    username: `${prefix}-${id}`,
    email: `${prefix}-${id}@test.com`,
    password: 'password123',
  };
}

// ----------------------------------------------------------------------------
// DevPanel
//   ↓ (dispatchEvent)
// window event "dev:fill-login"
//    ↓
// LoginPage (useEffect listener)
//    ↓
// setEmail / setPassword
// ----------------------------------------------------------------------------

export default function DevPanel() {
  function fillUser1() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'user1@test.com',
          password: 'password123',
        },
      }),
    );
  }
  //---
  function fillAdmin() {
    window.dispatchEvent(
      new CustomEvent('dev:fill-login', {
        detail: {
          email: 'admin@test.com',
          password: 'password123',
        },
      }),
    );
  }
  // ---
  function fillRegister() {
    const randomUser = makeUser();
    console.log('Dispatch register');
    window.dispatchEvent(
      new CustomEvent('dev:fill-register', {
        detail: {
          username: randomUser.username,
          email: randomUser.email,
          password: randomUser.password,
        },
      }),
    );
  }
  // ---

  return (
    <div className="fixed bottom-4 right-4 w-72 rounded-lg border bg-gray-100 p-4 shadow-lg">
      <h3 className="mb-4 text-lg font-bold">🛠 Development Tools</h3>

      <section className="mb-4">
        <h4 className="mb-2 font-semibold">Register</h4>

        <button
          className="w-full rounded border px-3 py-2 bg-gray-200 hover:bg-gray-100"
          onClick={fillRegister}
        >
          Fill Random Register
        </button>
      </section>

      <section>
        <h4 className="mb-2 font-semibold">Login</h4>

        <div className="flex flex-col gap-2">
          <button className="rounded border px-3 py-2 hover:bg-gray-100" onClick={fillUser1}>
            Fill User1
          </button>

          <button className="rounded border px-3 py-2 hover:bg-gray-100" onClick={fillAdmin}>
            Fill Admin
          </button>
        </div>
      </section>
    </div>
  );
}
