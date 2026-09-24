import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isNativeApp } from '@/lib/platform';
import { MobileStudentShell } from '@/components/mobile/MobileStudentShell';
import { getErrorMessage } from '@/lib/errors';
import { PortalChildView } from '@/pages/portal/PortalChildView';
import { PortalTopBar } from '@/components/layout/PortalTopBar';

interface OwnStudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  className: string | null;
  sectionName: string | null;
}

export function StudentDashboard() {
  if (isNativeApp()) {
    return <MobileStudentShell />;
  }

  const { profile } = useAuth();
  const [student, setStudent] = useState<OwnStudentRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setErrorMsg(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, classes(name), sections(name)')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;

        if (!data) {
          setErrorMsg('Your login is not yet linked to a student record — ask your School Admin to check your portal invite.');
          return;
        }

        setStudent({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          className: (data as unknown as { classes: { name: string } | null }).classes?.name ?? null,
          sectionName: (data as unknown as { sections: { name: string } | null }).sections?.name ?? null,
        });
      } catch (err) {
        setErrorMsg(getErrorMessage(err, 'Failed to load your profile.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <PortalTopBar title="Student Dashboard" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <PortalTopBar title="Student Dashboard" />
        <p className="text-sm text-red-600">{errorMsg}</p>
      </div>
    );
  }
  if (!student || !profile?.schoolId) return null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PortalTopBar title="Student Dashboard" />
      <PortalChildView
        schoolId={profile.schoolId}
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        className={student.className}
        sectionName={student.sectionName}
      />
    </div>
  );
}
