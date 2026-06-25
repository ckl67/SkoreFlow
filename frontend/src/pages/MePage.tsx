import { useAuth } from '../auth/ useAuth';

export default function Me() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="p-6 text-red-600">Not authenticated</div>;
  }

  if (!user) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <div className="rounded-md border p-4 bg-gray-50">
        <pre className="text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}
