// Supabase/PostgREST errors are plain objects shaped like
// { message, details, hint, code } — they do NOT extend the built-in Error
// class, so `err instanceof Error` is false for them and `err.message`
// gets silently skipped by a naive check, hiding useful messages (like our
// geofence trigger's specific distance message) behind a generic fallback.
// This helper extracts `.message` from anything that has one.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}
