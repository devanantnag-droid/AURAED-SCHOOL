import { supabase } from '@/lib/supabase';

export interface TrendPoint {
  label: string;
  value: number;
}

function isoDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

// ---------------------------------------------------------------------
// School Admin
// ---------------------------------------------------------------------

// Percentage of marked students present, per day, over the last 14 days.
export async function getAttendanceTrend(schoolId: string): Promise<TrendPoint[]> {
  const since = isoDateDaysAgo(13);
  const { data, error } = await supabase
    .from('student_attendance')
    .select('attendance_date, status')
    .eq('school_id', schoolId)
    .gte('attendance_date', since);
  if (error) throw error;

  const byDate = new Map<string, { present: number; total: number }>();
  for (const row of data ?? []) {
    const entry = byDate.get(row.attendance_date) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (row.status === 'present' || row.status === 'late') entry.present += 1;
    byDate.set(row.attendance_date, entry);
  }

  const points: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = isoDateDaysAgo(i);
    const entry = byDate.get(date);
    const pct = entry && entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0;
    points.push({ label: date.slice(5), value: pct });
  }
  return points;
}

// Fee collections, per month, over the last 6 months.
export async function getFeeCollectionTrend(schoolId: string): Promise<TrendPoint[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const since = sixMonthsAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('school_id', schoolId)
    .eq('status', 'success')
    .gte('payment_date', since);
  if (error) throw error;

  const byMonth = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.payment_date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(row.amount));
  }

  const points: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    points.push({ label: monthLabel(key + '-01'), value: byMonth.get(key) ?? 0 });
  }
  return points;
}

// ---------------------------------------------------------------------
// Super Admin
// ---------------------------------------------------------------------

// New schools onboarded, per month, over the last 6 months.
export async function getSchoolGrowthTrend(): Promise<TrendPoint[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const since = sixMonthsAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase.from('schools').select('created_at').gte('created_at', since);
  if (error) throw error;

  const byMonth = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    points.push({ label: monthLabel(key + '-01'), value: byMonth.get(key) ?? 0 });
  }
  return points;
}

// How many schools sit in each subscription status right now.
export async function getSubscriptionBreakdown(): Promise<TrendPoint[]> {
  const { data, error } = await supabase.from('subscriptions').select('status');
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

// Support tickets opened, per day, over the last 14 days.
export async function getTicketVolumeTrend(): Promise<TrendPoint[]> {
  const since = isoDateDaysAgo(13);
  const { data, error } = await supabase.from('tickets').select('created_at').gte('created_at', since);
  if (error) throw error;

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = isoDateDaysAgo(i);
    points.push({ label: date.slice(5), value: byDate.get(date) ?? 0 });
  }
  return points;
}
