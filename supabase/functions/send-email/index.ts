// supabase/functions/send-email/index.ts
//
// Deploy with: supabase functions deploy send-email
//
// Sends a real transactional email via Resend (https://resend.com).
// Requires a RESEND_API_KEY secret — until that's set, this function
// returns a clear "not configured" response rather than crashing, and
// every caller in the app treats email as best-effort (wrapped in
// try/catch, never blocking the actual reply/ticket/grievance action).
//
// One-time setup:
//   1. Sign up free at https://resend.com
//   2. Get an API key from the dashboard
//   3. supabase secrets set RESEND_API_KEY=re_your_key_here
//   4. supabase functions deploy send-email
//
// By default Resend's sandbox lets you send from onboarding@resend.dev
// to your OWN verified email only — good enough for testing. Sending to
// arbitrary recipients requires verifying your own domain in Resend.

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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      // Not configured yet — this is expected until the user completes
      // the Resend setup above. Return success: false but don't error
      // loudly; callers treat this as "email skipped", not a failure.
      return json({ success: false, message: 'Email is not configured yet (RESEND_API_KEY not set).' }, 200);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    const userId: string | undefined = body?.userId;
    const toEmail: string | undefined = body?.toEmail;
    const subject: string | undefined = body?.subject;
    const message: string | undefined = body?.message;

    if ((!userId && !toEmail) || !subject || !message) {
      return json({ success: false, message: 'userId or toEmail, plus subject and message, are required.' }, 400);
    }

    let recipientEmail = toEmail;
    if (!recipientEmail && userId) {
      const { data: profile } = await adminClient.from('profiles').select('email').eq('id', userId).maybeSingle();
      recipientEmail = profile?.email;
    }

    if (!recipientEmail) {
      return json({ success: false, message: 'Could not resolve a recipient email.' }, 404);
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AURAED SCHOOL <onboarding@resend.dev>',
        to: [recipientEmail],
        subject,
        text: message,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return json({ success: false, message: `Resend error: ${errText}` }, 502);
    }

    return json({ success: true, message: `Email sent to ${recipientEmail}.` });
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
