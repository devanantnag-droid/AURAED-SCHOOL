import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Access denied</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Your account doesn't have permission to view this page, or has no role assigned yet.
        Contact your school administrator if you believe this is a mistake.
      </p>
      <button
        onClick={() => {
          signOut();
          navigate('/login', { replace: true });
        }}
        className="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  );
}
