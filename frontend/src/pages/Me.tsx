import { useAuth } from '../auth/AuthContext';

export default function Me() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div style={{ padding: 20 }}>Not authenticated</div>;
  }

  if (!user) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>My Profile</h1>

      <pre>{JSON.stringify(user, null, 2)}</pre>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
