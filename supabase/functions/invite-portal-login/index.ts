// supabase/functions/invite-portal-login/index.ts
//
// Deploy with: supabase functions deploy invite-portal-login
//
// Same pattern as invite-teacher-login (Phase 6), generalized to cover
// both students and parents getting real portal login access for the
// first time. Runs entirely server-side with the service_role key, and
// re-verifies the caller's permission before doing anything:
//   1. Reads the caller's JWT, resolves their own school_id under RLS.
//   2. Confirms the target student/parent record belongs to THAT SAME
//      school — a School Admin can never invite a login for another
//      school's student/parent, even by guessing an id.
//   3. Only then creates the account directly with the email + password
//      School Admin supplied (no invite email, no separate set-password
//      step) and links it back (students.user_id or parents.user_id),
//      granting the STUDENT or PARENT role.

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

    const body = await req.json().catch(() => null);
    const personType: 'student' | 'parent' | undefined = body?.personType;
    const personId: string | undefined = body?.personId;
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;

    if (!personType || !['student', 'parent'].includes(personType) || !personId || !email || !password) {
      return json({ success: false, message: 'personType (student|parent), personId, email, and password are required.' }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    const requiredPermission = personType === 'student' ? 'students.edit' : 'parents.edit';
    const { data: hasPermission } = await callerClient.rpc('user_has_permission', {
      permission_code: requiredPermission,
    });

    if (!hasPermission || !callerSchoolId) {
      return json({ success: false, message: 'Not authorized to invite portal logins.' }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const table = personType === 'student' ? 'students' : 'parents';
    const roleName = personType === 'student' ? 'STUDENT' : 'PARENT';
    const nameField = personType === 'student' ? 'first_name, last_name' : 'full_name';

    const { data: person, error: personError } = await adminClient
      .from(table)
      .select(`id, school_id, user_id, ${nameField}`)
      .eq('id', personId)
      .maybeSingle();

    if (personError || !person) {
      return json({ success: false, message: `${personType === 'student' ? 'Student' : 'Parent'} not found.` }, 404);
    }

    // Critical check: the record must belong to the CALLER's own school.
    if (person.school_id !== callerSchoolId) {
      return json({ success: false, message: `That ${personType} does not belong to your school.` }, 403);
    }

    if (person.user_id) {
      return json({ success: false, message: `This ${personType} already has a login.` }, 400);
    }

    const fullName =
      personType === 'student'
        ? `${(person as { first_name: string }).first_name} ${(person as { last_name: string }).last_name}`
        : (person as { full_name: string }).full_name;

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      return json({ success: false, message: `${roleName} role is not seeded.` }, 500);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created?.user) {
      return json({ success: false, message: createError?.message ?? 'Failed to create account.' }, 400);
    }
    const invited = created;

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ school_id: person.school_id, status: 'active', full_name: fullName })
      .eq('id', invited.user.id);

    if (profileError) {
      return json({ success: false, message: profileError.message }, 500);
    }

    const { error: userRoleError } = await adminClient.from('user_roles').insert({
      user_id: invited.user.id,
      role_id: role.id,
      school_id: person.school_id,
    });

    if (userRoleError) {
      return json({ success: false, message: userRoleError.message }, 500);
    }

    const { error: linkError } = await adminClient
      .from(table)
      .update({ user_id: invited.user.id })
      .eq('id', personId);

    if (linkError) {
      return json({ success: false, message: linkError.message }, 500);
    }

    await adminClient.from('audit_logs').insert({
      school_id: person.school_id,
      user_id: user.id,
      action: 'invite_portal_login',
      entity_type: table,
      entity_id: personId,
      new_data: { email, personType, personId },
    });

    return json({
      success: true,
      message: `Account created for ${email}. They can log in to the portal immediately with the password you set.`,
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
