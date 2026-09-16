import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Client-side check only — a UX convenience so we can show/hide UI and an
// "Upgrade Plan" prompt. It is NOT the security boundary: every table a
// gated feature touches must also have its own RLS policies (added in the
// phase that builds that module) so a client can't just skip the gate.
export function useSchoolFeature(featureCode: string): { loading: boolean; hasAccess: boolean } {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setHasAccess(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    supabase
      .rpc('school_has_feature', { feature_code: featureCode })
      .then(({ data, error }) => {
        if (cancelled) return;
        setHasAccess(!error && !!data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureCode, userId]);

  return { loading, hasAccess };
}
