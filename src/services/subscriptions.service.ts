import { supabase } from '@/lib/supabase';
import type { EffectiveSubscriptionStatus, Subscription, SubscriptionStatus } from '@/types/plan';
import { getPlan } from '@/services/plans.service';

async function mapSubscriptionRow(row: {
  id: string;
  school_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_ends_at: string | null;
  auto_renew: boolean;
}): Promise<Subscription> {
  const { data: effective } = await supabase.rpc('subscription_effective_status', {
    p_school_id: row.school_id,
  });

  return {
    id: row.id,
    schoolId: row.school_id,
    planId: row.plan_id,
    status: row.status as SubscriptionStatus,
    effectiveStatus: (effective as EffectiveSubscriptionStatus) ?? (row.status as SubscriptionStatus),
    startDate: row.start_date,
    endDate: row.end_date,
    trialEndsAt: row.trial_ends_at,
    autoRenew: row.auto_renew,
  };
}

export async function getSchoolSubscription(schoolId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const subscription = await mapSubscriptionRow(data);
  subscription.plan = (await getPlan(data.plan_id)) ?? undefined;
  return subscription;
}

export async function assignSubscription(input: {
  schoolId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
  trialEndsAt?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('subscriptions').upsert(
    {
      school_id: input.schoolId,
      plan_id: input.planId,
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate || null,
      trial_ends_at: input.trialEndsAt || null,
    },
    { onConflict: 'school_id' }
  );
  if (error) throw error;
}

export async function setSubscriptionStatus(schoolId: string, status: SubscriptionStatus): Promise<void> {
  const { error } = await supabase.from('subscriptions').update({ status }).eq('school_id', schoolId);
  if (error) throw error;
}

export async function recordPayment(input: {
  subscriptionId: string;
  schoolId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
}): Promise<void> {
  const { error } = await supabase.from('subscription_payments').insert({
    subscription_id: input.subscriptionId,
    school_id: input.schoolId,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    payment_method: input.paymentMethod || null,
    transaction_id: input.transactionId || null,
    paid_at: input.status === 'succeeded' ? new Date().toISOString() : null,
  });
  if (error) throw error;
}

export async function listPayments(schoolId: string) {
  const { data, error } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
