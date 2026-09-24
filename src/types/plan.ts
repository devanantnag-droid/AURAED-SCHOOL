export interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  trialDays: number;
  maxStudents: number | null;
  maxTeachers: number | null;
  maxStaff: number | null;
  storageLimitMb: number | null;
  isActive: boolean;
  displayOrder: number;
  featureIds: string[];
}

export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type EffectiveSubscriptionStatus = SubscriptionStatus | 'expired' | 'expiring';

export interface Subscription {
  id: string;
  schoolId: string;
  planId: string;
  status: SubscriptionStatus;
  effectiveStatus: EffectiveSubscriptionStatus;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  autoRenew: boolean;
  plan?: Plan;
}

export interface PlanFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  trialDays: number;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxStaff?: number | null;
  storageLimitMb?: number | null;
  featureIds: string[];
}
