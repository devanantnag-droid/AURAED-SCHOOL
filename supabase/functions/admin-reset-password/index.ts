// supabase/functions/admin-reset-password/index.ts
//
// Deploy with: supabase functions deploy admin-reset-password
//
// Replaces the email-based "forgot password" flow: if someone forgets
// their password, they contact whoever manages their account, and that
// person resets it directly — no email delivery involved at all.
//
//   - School Admin can reset a Teacher, Student, or Parent's password,
//     but only within their own school.
//   - Super Admin can reset a School Admin's password, for any school.
//
// Same security shape as onboard-school-admin / invite-teacher-login /
// invite-portal-login: re-verifies the caller's role and the target's
// school membership server-side, using the service_role key only after
// that check passes.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, message: 'Missing Authorization header.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return json({ success: false, message: 'Not authenticated.' }, 401);
    }

    const body = await req.json().catch(() => null);
    const targetUserId: string | undefined = body?.targetUserId;
    const newPassword: string | undefined = body?.newPassword;

    if (!targetUserId || !newPassword) {
      return json({ success: false, message: 'targetUserId and newPassword are required.' }, 400);
    }
    if (newPassword.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Who is the target, and what role/school do they have?
    const { data: targetRoles, error: targetRoleError } = await adminClient
      .from('user_roles')
      .select('school_id, roles(name)')
      .eq('user_id', targetUserId);

    if (targetRoleError || !targetRoles || targetRoles.length === 0) {
      return json({ success: false, message: 'Target account not found or has no role.' }, 404);
    }

    const targetRoleNames = targetRoles.map((r) => (r as unknown as { roles: { name: string } }).roles.name);
    const targetSchoolId = targetRoles[0].school_id as string | null;

    const { data: isSuperAdmin } = await callerClient.rpc('user_has_role', { role_name: 'SUPER_ADMIN' });

    let authorized = false;

    if (isSuperAdmin && targetRoleNames.includes('SCHOOL_ADMIN')) {
      // Super Admin resetting a School Admin — allowed for any school.
      authorized = true;
    } else if (!isSuperAdmin) {
      // School Admin resetting a Teacher/Student/Parent in their own school.
      const { data: callerSchoolId } = await callerClient.rpc('user_school_id');
      const targetIsStaffOrPortal = ['TEACHER', 'STUDENT', 'PARENT', 'DRIVER'].some((r) => targetRoleNames.includes(r));

      if (targetIsStaffOrPortal && callerSchoolId && callerSchoolId === targetSchoolId) {
        // Require the matching manage permission for whichever role it is.
        const permissionMap: Record<string, string> = {
          TEACHER: 'teachers.edit',
          STUDENT: 'students.edit',
          PARENT: 'parents.edit',
          DRIVER: 'transport.manage',
        };
        const neededPermission = targetRoleNames.map((r) => permissionMap[r]).find(Boolean);
        if (neededPermission) {
          const { data: hasPermission } = await callerClient.rpc('user_has_permission', {
            permission_code: neededPermission,
          });
          authorized = !!hasPermission;
        }
      }
    }

    if (!authorized) {
      return json({ success: false, message: 'Not authorized to reset this account\u2019s password.' }, 403);
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      return json({ success: false, message: updateError.message }, 400);
    }

    await adminClient.from('audit_logs').insert({
      school_id: targetSchoolId,
      user_id: caller.id,
      action: 'admin_reset_password',
      entity_type: 'auth_users',
      entity_id: targetUserId,
      new_data: { targetUserId },
    });

    return json({ success: true, message: 'Password reset. Share the new password with them directly.' });
  } catch (err) {
    return json({ success: false, message: err instanceof Error ? err.message : 'Unexpected error.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
