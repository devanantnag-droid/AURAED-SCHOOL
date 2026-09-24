// supabase/functions/onboard-school-admin/index.ts
//
// Deploy with: supabase functions deploy onboard-school-admin
// Required secrets (set once, never exposed to the frontend):
//   supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role key>
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are actually auto-injected by
// the Supabase platform for Edge Functions already — the explicit `supabase
// secrets set` above is only needed if your CLI/project doesn't inject them.)
//
// This is the ONLY place in the whole system that touches the service_role
// key. It:
//   1. Reads the caller's JWT from the Authorization header (forwarded
//      automatically by supabase-js's functions.invoke()).
//   2. Uses a *user-scoped* client (anon key + caller's JWT) to confirm,
//      under RLS, that the caller actually holds SUPER_ADMIN. This means
//      even if this function is called directly (not just from our React
//      app), a non-Super-Admin caller is rejected before anything happens.
//   3. Only then uses the service_role client to create the new user
//      directly with the email + password Super Admin supplied (no invite
//      email, no separate set-password step — the account works
//      immediately) and assign them SCHOOL_ADMIN for the target school.

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

    // Step 1: verify the caller, scoped to their own permissions (RLS applies).
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

    const { data: isSuperAdmin, error: roleCheckError } = await callerClient.rpc('user_has_role', {
      role_name: 'SUPER_ADMIN',
    });

    if (roleCheckError || !isSuperAdmin) {
      return json({ success: false, message: 'Only Super Admin can invite school admins.' }, 403);
    }

    // Step 2: parse + validate input.
    const body = await req.json().catch(() => null);
    const schoolId: string | undefined = body?.schoolId;
    const fullName: string | undefined = body?.fullName;
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;

    if (!schoolId || !fullName || !email || !password) {
      return json({ success: false, message: 'schoolId, fullName, email, and password are required.' }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    // Step 3: privileged operations, using the service role client.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: school, error: schoolError } = await adminClient
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .maybeSingle();

    if (schoolError || !school) {
      return json({ success: false, message: 'School not found.' }, 404);
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'SCHOOL_ADMIN')
      .single();

    if (roleError || !role) {
      return json({ success: false, message: 'SCHOOL_ADMIN role is not seeded.' }, 500);
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

    // handle_new_user trigger already created a `profiles` row for this user.
    // Attach them to the school and mark active.
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ school_id: schoolId, status: 'active', full_name: fullName })
      .eq('id', invited.user.id);

    if (profileError) {
      return json({ success: false, message: profileError.message }, 500);
    }

    const { error: userRoleError } = await adminClient.from('user_roles').insert({
      user_id: invited.user.id,
      role_id: role.id,
      school_id: schoolId,
    });

    if (userRoleError) {
      return json({ success: false, message: userRoleError.message }, 500);
    }

    await adminClient.from('audit_logs').insert({
      school_id: schoolId,
      user_id: user.id,
      action: 'invite_school_admin',
      entity_type: 'user_roles',
      entity_id: invited.user.id,
      new_data: { email, fullName, schoolId },
    });

    return json({
      success: true,
      message: `Account created for ${email}. They can sign in immediately with the password you set, as ${school.name}'s admin.`,
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
