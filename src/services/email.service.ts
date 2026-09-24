import { supabase } from '@/lib/supabase';

// Best-effort: swallows errors so a missing RESEND_API_KEY (or any email
// failure) never blocks the actual reply/action that triggered it.
export async function sendEmailBestEffort(input: { userId: string; subject: string; message: string }): Promise<void> {
  try {
    await supabase.functions.invoke('send-email', { body: input });
  } catch {
    // Intentionally ignored — see comment above.
  }
}
