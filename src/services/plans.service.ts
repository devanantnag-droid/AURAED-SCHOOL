import { supabase } from '@/lib/supabase';
import type { Feature, Plan, PlanFormValues } from '@/types/plan';

export async function listFeatures(): Promise<Feature[]> {
  const { data, error } = await supabase.from('features').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
  }));
}

export async function createFeature(input: { code: string; name: string; description?: string }) {
  const { error } = await supabase.from('features').insert({
    code: input.code,
    name: input.name,
    description: input.description || null,
  });
  if (error) throw error;
}

function mapPlanRow(
  row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    currency: string;
    billing_cycle: string;
    trial_days: number;
    max_students: number | null;
    max_teachers: number | null;
    max_staff: number | null;
    storage_limit_mb: number | null;
    is_active: boolean;
    display_order: number;
  },
  featureIds: string[]
): Plan {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    billingCycle: row.billing_cycle as Plan['billingCycle'],
    trialDays: row.trial_days,
    maxStudents: row.max_students,
    maxTeachers: row.max_teachers,
    maxStaff: row.max_staff,
    storageLimitMb: row.storage_limit_mb,
    isActive: row.is_active,
    displayOrder: row.display_order,
    featureIds,
  };
}

export async function listPlans(): Promise<Plan[]> {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;

  const { data: planFeatures, error: pfError } = await supabase
    .from('plan_features')
    .select('plan_id, feature_id');
  if (pfError) throw pfError;

  const byPlan = new Map<string, string[]>();
  (planFeatures ?? []).forEach((row) => {
    const list = byPlan.get(row.plan_id) ?? [];
    list.push(row.feature_id);
    byPlan.set(row.plan_id, list);
  });

  return (plans ?? []).map((row) => mapPlanRow(row, byPlan.get(row.id) ?? []));
}

export async function getPlan(id: string): Promise<Plan | null> {
  const { data: plan, error } = await supabase.from('plans').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const { data: planFeatures, error: pfError } = await supabase
    .from('plan_features')
    .select('feature_id')
    .eq('plan_id', id);
  if (pfError) throw pfError;

  return mapPlanRow(
    plan,
    (planFeatures ?? []).map((r) => r.feature_id)
  );
}

export async function createPlan(values: PlanFormValues): Promise<Plan> {
  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      price: values.price,
      currency: values.currency,
      billing_cycle: values.billingCycle,
      trial_days: values.trialDays,
      max_students: values.maxStudents ?? null,
      max_teachers: values.maxTeachers ?? null,
      max_staff: values.maxStaff ?? null,
      storage_limit_mb: values.storageLimitMb ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;

  if (values.featureIds.length > 0) {
    const { error: pfError } = await supabase
      .from('plan_features')
      .insert(values.featureIds.map((feature_id) => ({ plan_id: plan.id, feature_id })));
    if (pfError) throw pfError;
  }

  return mapPlanRow(plan, values.featureIds);
}

export async function updatePlan(id: string, values: PlanFormValues): Promise<Plan> {
  const { data: plan, error } = await supabase
    .from('plans')
    .update({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      price: values.price,
      currency: values.currency,
      billing_cycle: values.billingCycle,
      trial_days: values.trialDays,
      max_students: values.maxStudents ?? null,
      max_teachers: values.maxTeachers ?? null,
      max_staff: values.maxStaff ?? null,
      storage_limit_mb: values.storageLimitMb ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  // Simplest correct approach: replace the whole feature set.
  const { error: deleteError } = await supabase.from('plan_features').delete().eq('plan_id', id);
  if (deleteError) throw deleteError;

  if (values.featureIds.length > 0) {
    const { error: insertError } = await supabase
      .from('plan_features')
      .insert(values.featureIds.map((feature_id) => ({ plan_id: id, feature_id })));
    if (insertError) throw insertError;
  }

  return mapPlanRow(plan, values.featureIds);
}

export async function setPlanActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('plans').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function duplicatePlan(id: string): Promise<Plan> {
  const existing = await getPlan(id);
  if (!existing) throw new Error('Plan not found');

  return createPlan({
    name: `${existing.name} (copy)`,
    slug: `${existing.slug}-copy-${Date.now().toString(36)}`,
    description: existing.description ?? undefined,
    price: existing.price,
    currency: existing.currency,
    billingCycle: existing.billingCycle,
    trialDays: existing.trialDays,
    maxStudents: existing.maxStudents,
    maxTeachers: existing.maxTeachers,
    maxStaff: existing.maxStaff,
    storageLimitMb: existing.storageLimitMb,
    featureIds: existing.featureIds,
  });
}
