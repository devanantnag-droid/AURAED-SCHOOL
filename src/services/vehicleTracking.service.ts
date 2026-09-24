import { supabase } from '@/lib/supabase';

export interface VehicleLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export async function inviteDriverLogin(input: {
  vehicleId: string;
  driverName: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('invite-driver-login', { body: input });
  if (error) throw new Error(error.message || 'Failed to create driver login.');
  return data as { success: boolean; message: string };
}

// Resolves the vehicle the currently signed-in driver is assigned to -
// same shape as getMyTeacherId, just for the vehicles table instead.
export async function getMyVehicle(): Promise<{ id: string; vehicleNumber: string } | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data, error } = await supabase.from('vehicles').select('id, vehicle_number').eq('driver_user_id', user.user.id).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, vehicleNumber: data.vehicle_number } : null;
}

export async function updateMyVehicleLocation(schoolId: string, vehicleId: string, latitude: number, longitude: number): Promise<void> {
  const { error } = await supabase
    .from('vehicle_locations')
    .upsert({ vehicle_id: vehicleId, school_id: schoolId, latitude, longitude, updated_at: new Date().toISOString() }, { onConflict: 'vehicle_id' });
  if (error) throw error;
}

export async function getVehicleLocation(vehicleId: string): Promise<VehicleLocation | null> {
  const { data, error } = await supabase.from('vehicle_locations').select('*').eq('vehicle_id', vehicleId).maybeSingle();
  if (error) throw error;
  return data ? { vehicleId: data.vehicle_id, latitude: data.latitude, longitude: data.longitude, updatedAt: data.updated_at } : null;
}

// For a parent: find the vehicle serving their child's transport
// assignment, then its live location, in one call.
export async function getMyChildVehicleLocation(studentId: string): Promise<{ vehicleNumber: string; location: VehicleLocation | null } | 'no_assignment' | 'no_vehicle'> {
  const { data: assignment, error } = await supabase
    .from('student_transport')
    .select('routes(vehicle_id, vehicles(id, vehicle_number))')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  if (!assignment) return 'no_assignment';
  const vehicle = (assignment as unknown as { routes: { vehicles: { id: string; vehicle_number: string } | null } | null })?.routes?.vehicles;
  if (!vehicle) return 'no_vehicle';
  const location = await getVehicleLocation(vehicle.id);
  return { vehicleNumber: vehicle.vehicle_number, location };
}

export function googleMapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export interface DriverInfo {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  vehicleId: string;
  vehicleNumber: string;
  routeName: string | null;
  staffId: string | null;
}

// Every vehicle that currently has a driver logged in, with the
// driver's own contact details and whichever route their vehicle
// serves. vehicles.driver_user_id references auth.users, not
// public.profiles directly, so PostgREST can't auto-embed profiles in
// one query here - fetched separately and merged instead.
export async function listDrivers(schoolId: string): Promise<DriverInfo[]> {
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, vehicle_number, driver_user_id, routes(name)')
    .eq('school_id', schoolId)
    .not('driver_user_id', 'is', null);
  if (error) throw error;
  if (!vehicles || vehicles.length === 0) return [];

  const driverIds = vehicles.map((v) => v.driver_user_id as string);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', driverIds);
  if (profileError) throw profileError;

  const { data: staffRows, error: staffError } = await supabase.from('staff').select('id, user_id').in('user_id', driverIds);
  if (staffError) throw staffError;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const staffIdByUser = new Map((staffRows ?? []).map((s) => [s.user_id, s.id]));

  return vehicles.map((v) => {
    const profile = profileById.get(v.driver_user_id as string);
    const routes = (v as unknown as { routes: { name: string }[] }).routes;
    return {
      userId: v.driver_user_id as string,
      fullName: profile?.full_name ?? 'Unknown',
      email: profile?.email ?? '',
      phone: profile?.phone ?? null,
      vehicleId: v.id,
      vehicleNumber: v.vehicle_number,
      routeName: routes?.[0]?.name ?? null,
      staffId: staffIdByUser.get(v.driver_user_id as string) ?? null,
    };
  });
}

// Creates a staff record for an existing driver login, linked via
// user_id - this is what makes them show up in the normal Payroll flow
// (salary structure, payslips, payroll reports/exports) without any
// separate driver-specific payroll system needed.
export async function enableDriverPayroll(schoolId: string, driver: { userId: string; fullName: string; email: string; phone: string | null }): Promise<void> {
  const { error } = await supabase.from('staff').insert({
    school_id: schoolId,
    user_id: driver.userId,
    employee_id: `DRV-${driver.userId.slice(0, 8).toUpperCase()}`,
    full_name: driver.fullName,
    role_title: 'Driver',
    department: 'Transport',
    phone: driver.phone,
    email: driver.email,
  });
  if (error) throw error;
}

// Removes the driver login from this vehicle without deleting the
// account itself - it can be reassigned to a different vehicle
// afterward, or a brand new driver invited for this one.
export async function unassignDriver(vehicleId: string): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ driver_user_id: null }).eq('id', vehicleId);
  if (error) throw error;
}

// Moves an existing driver login from whichever vehicle they're on now
// to a different one - clears the old assignment and sets the new one
// in two steps, since a vehicle can only have one driver at a time.
export async function reassignDriver(driverUserId: string, newVehicleId: string): Promise<void> {
  const { error: clearError } = await supabase.from('vehicles').update({ driver_user_id: null }).eq('driver_user_id', driverUserId);
  if (clearError) throw clearError;
  const { error: setError } = await supabase.from('vehicles').update({ driver_user_id: driverUserId }).eq('id', newVehicleId);
  if (setError) throw setError;
}
