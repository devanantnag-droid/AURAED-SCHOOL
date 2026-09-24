import { supabase } from '@/lib/supabase';

interface InviteAdminInput {
  schoolId: string;
  fullName: string;
  email: string;
  password: string;
}

interface InviteAdminResult {
  success: boolean;
  message: string;
}

// Calls the onboard-school-admin Edge Function (supabase/functions/onboard-school-admin).
// That function runs with the service_role key server-side — it is the ONLY
// place in the whole system allowed to create auth.users rows on someone
// else's behalf. The Edge Function itself re-verifies the caller is a
// SUPER_ADMIN before doing anything, so this isn't a trust boundary we can
// get wrong client-side even if this function were called incorrectly.
// The account is created immediately with the password supplied here — no
// invite email, no separate set-password step.
export async function inviteSchoolAdmin(input: InviteAdminInput): Promise<InviteAdminResult> {
  const { data, error } = await supabase.functions.invoke('onboard-school-admin', {
    body: {
      schoolId: input.schoolId,
      fullName: input.fullName,
      email: input.email,
      password: input.password,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create school admin account.');
  }

  return data as InviteAdminResult;
}
