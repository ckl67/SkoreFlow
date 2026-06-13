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
    <div className="dev-panel">
      <h3>🛠 Development Tools</h3>

      <section className="dev-section">
        <h4>Register</h4>

        <button onClick={fillRegister}>Fill Random Register</button>
      </section>

      <section className="dev-section">
        <h4>Login</h4>

        <button onClick={fillUser1}>Fill User1</button>

        <button onClick={fillAdmin}>Fill Admin</button>
      </section>
    </div>
  );
}
