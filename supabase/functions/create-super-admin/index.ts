// supabase/functions/create-super-admin/index.ts
//
// Deploy with: supabase functions deploy create-super-admin
//
// Lets an existing Super Admin create another Super Admin account —
// direct email + password, works immediately, same pattern as every
// other account-creation flow in this app since the credential-based
// login change. A Super Admin's user_roles row has school_id = null,
// since they aren't scoped to one school.

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

    const { data: isSuperAdmin } = await callerClient.rpc('user_has_role', { role_name: 'SUPER_ADMIN' });
    if (!isSuperAdmin) {
      return json({ success: false, message: 'Only Super Admin can do this.' }, 403);
    }

    const body = await req.json().catch(() => null);
    const fullName: string | undefined = body?.fullName;
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;

    if (!fullName || !email || !password) {
      return json({ success: false, message: 'fullName, email, and password are required.' }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: role, error: roleError } = await adminClient.from('roles').select('id').eq('name', 'SUPER_ADMIN').single();
    if (roleError || !role) {
      return json({ success: false, message: 'SUPER_ADMIN role is not seeded.' }, 500);
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

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'active', full_name: fullName })
      .eq('id', created.user.id);
    if (profileError) {
      return json({ success: false, message: profileError.message }, 500);
    }

    const { error: userRoleError } = await adminClient.from('user_roles').insert({
      user_id: created.user.id,
      role_id: role.id,
      school_id: null,
    });
    if (userRoleError) {
      return json({ success: false, message: userRoleError.message }, 500);
    }

    await adminClient.from('audit_logs').insert({
      school_id: null,
      user_id: caller.id,
      action: 'create_super_admin',
      entity_type: 'auth_users',
      entity_id: created.user.id,
      new_data: { email, fullName },
    });

    return json({
      success: true,
      message: `Super Admin account created for ${email}. They can sign in immediately with the password you set.`,
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
