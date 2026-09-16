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
//   3. Only then uses the service_role client to invite the new user by
//      email (creates their auth.users row + sends them a set-password
//      email) and assign them SCHOOL_ADMIN for the target school.

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

    if (!schoolId || !fullName || !email) {
      return json({ success: false, message: 'schoolId, fullName, and email are required.' }, 400);
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

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (inviteError || !invited?.user) {
      return json({ success: false, message: inviteError?.message ?? 'Invite failed.' }, 400);
    }

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
      message: `Invite sent to ${email}. They'll receive an email to set their password and can then sign in as ${school.name}'s admin.`,
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
