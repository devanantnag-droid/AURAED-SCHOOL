export interface School {
  id: string;
  name: string;
  code: string;
  registrationNumber: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  principalName: string | null;
  website: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolFormValues {
  name: string;
  code: string;
  email: string;
  phone?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  principalName?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
}
