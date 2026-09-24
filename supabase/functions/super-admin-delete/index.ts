// supabase/functions/super-admin-delete/index.ts
//
// Deploy with: supabase functions deploy super-admin-delete
//
// Lets Super Admin permanently delete:
//   - an entire school (every table with a school_id foreign key cascades
//     automatically — this also deletes every auth.users account linked
//     to that school, since those aren't touched by a Postgres cascade)
//   - a single teacher/student/staff/parent record at any school (their
//     own dependent records — attendance, marks, fees, etc. — cascade the
//     same way; their login account, if any, is deleted too)
//
// This is the most destructive function in the whole system. Every
// deletion is logged to audit_logs BEFORE it happens (so the record of
// what was deleted survives even though the row itself won't), and only
// ever runs after confirming the caller genuinely holds SUPER_ADMIN.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENTITY_TABLES: Record<string, string> = {
  teacher: 'teachers',
  student: 'students',
  staff: 'staff',
  parent: 'parents',
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
    const entityType: string | undefined = body?.entityType;
    const id: string | undefined = body?.id;
    const confirmText: string | undefined = body?.confirmText;
    const expectedConfirmText: string | undefined = body?.expectedConfirmText;

    if (!entityType || !id) {
      return json({ success: false, message: 'entityType and id are required.' }, 400);
    }
    if (expectedConfirmText && confirmText !== expectedConfirmText) {
      return json({ success: false, message: 'Confirmation text did not match — nothing was deleted.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (entityType === 'school') {
      const { data: school } = await adminClient.from('schools').select('id, name').eq('id', id).maybeSingle();
      if (!school) {
        return json({ success: false, message: 'School not found.' }, 404);
      }

      // Every user_roles row scoped to this school — School Admin,
      // teachers, students, parents, and any support-staff logins.
      const { data: userRoles } = await adminClient.from('user_roles').select('user_id').eq('school_id', id);
      const userIds = [...new Set((userRoles ?? []).map((r) => r.user_id))];

      // Log what's about to happen before it happens — this is the only
      // record that survives the deletion itself.
      await adminClient.from('audit_logs').insert({
        school_id: null,
        user_id: caller.id,
        action: 'super_admin_delete_school',
        entity_type: 'schools',
        entity_id: id,
        old_data: { name: school.name, accountsDeleted: userIds.length },
      });

      for (const userId of userIds) {
        await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      }

      const { error: deleteError } = await adminClient.from('schools').delete().eq('id', id);
      if (deleteError) {
        return json({ success: false, message: deleteError.message }, 500);
      }

      return json({
        success: true,
        message: `${school.name} and all its data (${userIds.length} account${userIds.length === 1 ? '' : 's'}) have been permanently deleted.`,
      });
    }

    const table = ENTITY_TABLES[entityType];
    if (!table) {
      return json({ success: false, message: 'Unknown entityType.' }, 400);
    }

    const nameField = entityType === 'student' ? 'first_name, last_name' : 'full_name';
    const { data: record } = await adminClient.from(table).select(`id, school_id, user_id, ${nameField}`).eq('id', id).maybeSingle();

    if (!record) {
      return json({ success: false, message: `${entityType} not found.` }, 404);
    }

    const recordName =
      entityType === 'student'
        ? `${(record as unknown as { first_name: string }).first_name} ${(record as unknown as { last_name: string }).last_name}`
        : (record as unknown as { full_name: string }).full_name;

    await adminClient.from('audit_logs').insert({
      school_id: (record as unknown as { school_id: string }).school_id,
      user_id: caller.id,
      action: `super_admin_delete_${entityType}`,
      entity_type: table,
      entity_id: id,
      old_data: { name: recordName },
    });

    const linkedUserId = (record as unknown as { user_id: string | null }).user_id;
    if (linkedUserId) {
      await adminClient.auth.admin.deleteUser(linkedUserId).catch(() => {});
    }

    const { error: deleteError } = await adminClient.from(table).delete().eq('id', id);
    if (deleteError) {
      return json({ success: false, message: deleteError.message }, 500);
    }

    return json({ success: true, message: `${recordName} has been permanently deleted.` });
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
