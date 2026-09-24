// supabase/functions/invite-driver-login/index.ts
//
// Deploy with: supabase functions deploy invite-driver-login
//
// Modeled directly on invite-teacher-login: called by a SCHOOL_ADMIN or
// TRANSPORT_MANAGER to give an existing vehicle record a real login for
// its driver, so that driver can share live location from their phone.
// Runs entirely server-side with the service_role key, re-verifying the
// caller's permission and school before doing anything.

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
      permission_code: 'transport.manage',
    });

    if (!hasPermission || !callerSchoolId) {
      return json({ success: false, message: 'Not authorized to invite driver logins.' }, 403);
    }

    const body = await req.json().catch(() => null);
    const vehicleId: string | undefined = body?.vehicleId;
    const driverName: string | undefined = body?.driverName;
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;

    if (!vehicleId || !driverName || !email || !password) {
      return json({ success: false, message: 'vehicleId, driverName, email, and password are required.' }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: vehicle, error: vehicleError } = await adminClient
      .from('vehicles')
      .select('id, school_id, vehicle_number, driver_user_id')
      .eq('id', vehicleId)
      .maybeSingle();

    if (vehicleError || !vehicle) {
      return json({ success: false, message: 'Vehicle not found.' }, 404);
    }

    // Critical check: the vehicle must belong to the CALLER's own school.
    if (vehicle.school_id !== callerSchoolId) {
      return json({ success: false, message: 'That vehicle does not belong to your school.' }, 403);
    }

    if (vehicle.driver_user_id) {
      return json({ success: false, message: 'This vehicle already has a driver login. Reset their password instead if needed.' }, 400);
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'DRIVER')
      .single();

    if (roleError || !role) {
      return json({ success: false, message: 'DRIVER role is not seeded.' }, 500);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: driverName },
    });

    if (createError || !created?.user) {
      return json({ success: false, message: createError?.message ?? 'Failed to create account.' }, 400);
    }
    const invited = created;

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ school_id: vehicle.school_id, status: 'active', full_name: driverName })
      .eq('id', invited.user.id);

    if (profileError) {
      return json({ success: false, message: profileError.message }, 500);
    }

    const { error: userRoleError } = await adminClient.from('user_roles').insert({
      user_id: invited.user.id,
      role_id: role.id,
      school_id: vehicle.school_id,
    });

    if (userRoleError) {
      return json({ success: false, message: userRoleError.message }, 500);
    }

    const { error: linkError } = await adminClient
      .from('vehicles')
      .update({ driver_user_id: invited.user.id, driver_name: driverName })
      .eq('id', vehicleId);

    if (linkError) {
      return json({ success: false, message: linkError.message }, 500);
    }

    // Also create a staff record, linked by user_id - this is what lets
    // a driver go through the normal Payroll flow (salary structure,
    // payslips) with no separate driver-specific payroll system needed.
    // Not fatal if this fails (e.g. staff.create not granted somehow) -
    // the driver login itself already succeeded, and payroll can be
    // enabled for them later from the Transport > Drivers tab.
    await adminClient.from('staff').insert({
      school_id: vehicle.school_id,
      user_id: invited.user.id,
      employee_id: `DRV-${invited.user.id.slice(0, 8).toUpperCase()}`,
      full_name: driverName,
      role_title: 'Driver',
      department: 'Transport',
      email,
    });

    await adminClient.from('audit_logs').insert({
      school_id: vehicle.school_id,
      user_id: user.id,
      action: 'invite_driver_login',
      entity_type: 'vehicles',
      entity_id: vehicleId,
      new_data: { email, vehicleId },
    });

    return json({
      success: true,
      message: `Account created for ${email}. They can log in immediately and start sharing ${vehicle.vehicle_number}'s live location.`,
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
