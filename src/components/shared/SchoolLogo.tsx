import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchool } from '@/services/schools.service';
import defaultLogo from '@/assets/logo.png';

// Cache per school for the lifetime of the tab - the logo rarely
// changes, and this avoids every header on every page re-fetching it
// independently.
const cache = new Map<string, string | null>();

export function useSchoolLogoUrl(): string {
  const { profile } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.schoolId ? cache.get(profile.schoolId) ?? null : null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    if (cache.has(profile.schoolId)) {
      setLogoUrl(cache.get(profile.schoolId)!);
      return;
    }
    getSchool(profile.schoolId)
      .then((school) => {
        const url = school?.logoUrl ?? null;
        cache.set(profile.schoolId!, url);
        setLogoUrl(url);
      })
      .catch(() => {
        setLogoUrl(null);
      });
  }, [profile?.schoolId]);

  return logoUrl ?? defaultLogo;
}

export function SchoolLogo({ className }: { className?: string }) {
  const logoUrl = useSchoolLogoUrl();
  return <img src={logoUrl} alt="" className={className} />;
}
