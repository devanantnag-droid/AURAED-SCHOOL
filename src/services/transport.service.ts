import { supabase } from '@/lib/supabase';
import type { Route, Stop, StudentTransport, Vehicle } from '@/types/transport';

// ---------- Vehicles ----------

export async function listVehicles(schoolId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').eq('school_id', schoolId).order('vehicle_number');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    vehicleNumber: r.vehicle_number,
    vehicleType: r.vehicle_type,
    capacity: r.capacity,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    driverUserId: r.driver_user_id,
  }));
}

export async function createVehicle(input: {
  schoolId: string;
  vehicleNumber: string;
  vehicleType?: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
}): Promise<void> {
  const { error } = await supabase.from('vehicles').insert({
    school_id: input.schoolId,
    vehicle_number: input.vehicleNumber,
    vehicle_type: input.vehicleType || null,
    capacity: input.capacity,
    driver_name: input.driverName || null,
    driver_phone: input.driverPhone || null,
  });
  if (error) throw error;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Routes & Stops ----------

export async function listRoutes(schoolId: string): Promise<Route[]> {
  const { data, error } = await supabase.from('routes').select('*, vehicles(vehicle_number)').eq('school_id', schoolId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    vehicleId: r.vehicle_id,
    vehicleNumber: r.vehicles?.vehicle_number,
  }));
}

export async function createRoute(schoolId: string, name: string, vehicleId?: string | null): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .insert({ school_id: schoolId, name, vehicle_id: vehicleId || null })
    .select('*')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, vehicleId: data.vehicle_id };
}

export async function listStops(schoolId: string, routeId?: string): Promise<Stop[]> {
  let query = supabase.from('stops').select('*').eq('school_id', schoolId);
  if (routeId) query = query.eq('route_id', routeId);
  const { data, error } = await query.order('stop_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, routeId: r.route_id, name: r.name, stopOrder: r.stop_order }));
}

export async function createStop(schoolId: string, routeId: string, name: string, stopOrder: number): Promise<void> {
  const { error } = await supabase.from('stops').insert({ school_id: schoolId, route_id: routeId, name, stop_order: stopOrder });
  if (error) throw error;
}

// ---------- Student Assignments ----------

export async function listStudentTransport(schoolId: string): Promise<StudentTransport[]> {
  const { data, error } = await supabase
    .from('student_transport')
    .select('*, students(first_name, last_name), routes(name), stops(name)')
    .eq('school_id', schoolId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    studentId: r.student_id,
    studentName: r.students ? `${r.students.first_name} ${r.students.last_name}` : undefined,
    routeId: r.route_id,
    routeName: r.routes?.name,
    stopId: r.stop_id,
    stopName: r.stops?.name,
  }));
}

export async function assignStudentTransport(input: {
  schoolId: string;
  studentId: string;
  routeId: string;
  stopId: string;
}): Promise<void> {
  const { error } = await supabase.from('student_transport').upsert(
    {
      school_id: input.schoolId,
      student_id: input.studentId,
      route_id: input.routeId,
      stop_id: input.stopId,
    },
    { onConflict: 'student_id' }
  );
  if (error) throw error;
}

export async function removeStudentTransport(id: string): Promise<void> {
  const { error } = await supabase.from('student_transport').delete().eq('id', id);
  if (error) throw error;
}
