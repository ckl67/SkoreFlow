// --------------------------------
// DevPanel
//   ↓ (dispatchEvent)
// window event "dev:fill-login"
//    ↓
// LoginPage (useEffect listener)
//    ↓
// setEmail / setPassword
// --------------------------------

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

  return (
    <div className="dev-panel">
      <h3>Dev</h3>

      <button onClick={fillUser1}>Fill User1</button>
      <button onClick={fillAdmin}>Fill Admin</button>
    </div>
  );
}
