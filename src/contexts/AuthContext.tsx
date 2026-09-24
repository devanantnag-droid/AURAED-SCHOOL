import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfile, fetchResolvedPermissions, fetchUserRoles } from '@/services/permissions.service';
import type { AuthState } from '@/types/auth';

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const initialState: AuthState = {
  loading: true,
  userId: null,
  profile: null,
  roles: [],
  permissions: new Set(),
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  async function loadForUser(userId: string) {
    const [profile, roles] = await Promise.all([fetchProfile(userId), fetchUserRoles(userId)]);
    const permissions = await fetchResolvedPermissions(roles.map((r) => r.roleId));
    setState({ loading: false, userId, profile, roles, permissions });
  }

  async function refresh() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState({ ...initialState, loading: false });
      return;
    }
    await loadForUser(user.id);
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        loadForUser(session.user.id).catch(() => {
          setState({ ...initialState, loading: false });
        });
      } else {
        setState({ ...initialState, loading: false });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadForUser(session.user.id).catch(() => {
          setState({ ...initialState, loading: false });
        });
      } else {
        setState({ ...initialState, loading: false });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setState({ ...initialState, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
