// supabase/functions/invite-teacher-login/index.ts
//
// Deploy with: supabase functions deploy invite-teacher-login
//
// Unlike onboard-school-admin (Super Admin only), this function is called
// by a SCHOOL_ADMIN (or HR_MANAGER) to give an EXISTING teacher record a
// real login. It still runs entirely server-side with the service_role
// key, and re-verifies the caller's permission before doing anything:
//   1. Reads the caller's JWT, resolves their own school_id under RLS.
//   2. Confirms the target teacher record belongs to THAT SAME school —
//      a School Admin can never invite a login for another school's
//      teacher, even by guessing a teacher id.
//   3. Only then creates the account directly with the email + password
//      School Admin supplied (no invite email, no separate set-password
//      step) and links it back to the teacher record (teachers.user_id),
//      granting the TEACHER role.

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
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return json({ success: false, message: 'Not authenticated.' }, 401);
    }

    const { data: callerSchoolId } = await callerClient.rpc('user_school_id');
    const { data: hasPermission } = await callerClient.rpc('user_has_permission', {
      permission_code: 'teachers.edit',
    });

    if (!hasPermission || !callerSchoolId) {
      return json({ success: false, message: 'Not authorized to invite teacher logins.' }, 403);
    }

    const body = await req.json().catch(() => null);
    const teacherId: string | undefined = body?.teacherId;
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;

    if (!teacherId || !email || !password) {
      return json({ success: false, message: 'teacherId, email, and password are required.' }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: teacher, error: teacherError } = await adminClient
      .from('teachers')
      .select('id, school_id, full_name, user_id')
      .eq('id', teacherId)
      .maybeSingle();

    if (teacherError || !teacher) {
      return json({ success: false, message: 'Teacher not found.' }, 404);
    }

    // Critical check: the teacher must belong to the CALLER's own school.
    if (teacher.school_id !== callerSchoolId) {
      return json({ success: false, message: 'That teacher does not belong to your school.' }, 403);
    }

    if (teacher.user_id) {
      return json({ success: false, message: 'This teacher already has a login.' }, 400);
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'TEACHER')
      .single();

    if (roleError || !role) {
      return json({ success: false, message: 'TEACHER role is not seeded.' }, 500);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: teacher.full_name },
    });

    if (createError || !created?.user) {
      return json({ success: false, message: createError?.message ?? 'Failed to create account.' }, 400);
    }
    const invited = created;

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ school_id: teacher.school_id, status: 'active', full_name: teacher.full_name })
      .eq('id', invited.user.id);

    if (profileError) {
      return json({ success: false, message: profileError.message }, 500);
    }

    const { error: userRoleError } = await adminClient.from('user_roles').insert({
      user_id: invited.user.id,
      role_id: role.id,
      school_id: teacher.school_id,
    });

    if (userRoleError) {
      return json({ success: false, message: userRoleError.message }, 500);
    }

    const { error: linkError } = await adminClient
      .from('teachers')
      .update({ user_id: invited.user.id })
      .eq('id', teacherId);

    if (linkError) {
      return json({ success: false, message: linkError.message }, 500);
    }

    await adminClient.from('audit_logs').insert({
      school_id: teacher.school_id,
      user_id: user.id,
      action: 'invite_teacher_login',
      entity_type: 'teachers',
      entity_id: teacherId,
      new_data: { email, teacherId },
    });

    return json({
      success: true,
      message: `Account created for ${email}. They can log in immediately with the password you set, and use Punch In/Out.`,
    });
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
