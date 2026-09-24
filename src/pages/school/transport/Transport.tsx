import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import {
  assignStudentTransport,
  createRoute,
  createStop,
  createVehicle,
  deleteVehicle,
  listRoutes,
  listStops,
  listStudentTransport,
  listVehicles,
} from '@/services/transport.service';
import { listStudents } from '@/services/students.service';
import { inviteDriverLogin, listDrivers, unassignDriver, reassignDriver, enableDriverPayroll } from '@/services/vehicleTracking.service';
import type { DriverInfo } from '@/services/vehicleTracking.service';
import { adminResetPassword } from '@/services/adminResetPassword.service';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';
import { DestructiveConfirmModal } from '@/components/shared/DestructiveConfirmModal';
import type { Route, Stop, StudentTransport, Vehicle } from '@/types/transport';
import type { Student } from '@/types/people';
import { PageHeader } from '@/components/shared/PageHeader';

function DriverInvite({ vehicle, onDone }: { vehicle: Vehicle; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [driverName, setDriverName] = useState(vehicle.driverName ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (vehicle.driverUserId) {
    return <span className="text-xs text-green-700 dark:text-green-400">Driver login active</span>;
  }

  async function handleInvite() {
    if (!driverName.trim() || !email.trim() || !password) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const result = await inviteDriverLogin({ vehicleId: vehicle.id, driverName, email, password });
      setMsg(result.message);
      if (result.success) onDone();
    } catch (err) {
      setMsg(getErrorMessage(err, 'Failed to create driver login.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-primary-600 hover:underline">
        Create driver login
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input className="input py-1 text-xs" placeholder="Driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
      <input className="input py-1 text-xs" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input py-1 text-xs" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleInvite} disabled={submitting} className="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60">
        {submitting ? 'Creating…' : 'Create'}
      </button>
      {msg && <p className="w-full text-xs text-gray-600 dark:text-gray-400">{msg}</p>}
    </div>
  );
}

function TransportInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'vehicles' | 'routes' | 'assignments' | 'drivers'>('vehicles');
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<StudentTransport[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vehicle form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Route/stop form
  const [routeName, setRouteName] = useState('');
  const [routeVehicleId, setRouteVehicleId] = useState('');
  const [stopRouteId, setStopRouteId] = useState('');
  const [stopName, setStopName] = useState('');

  // Assignment form
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignRouteId, setAssignRouteId] = useState('');
  const [assignStopId, setAssignStopId] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [v, r, s, st, a] = await Promise.all([
      listVehicles(profile.schoolId),
      listRoutes(profile.schoolId),
      listStops(profile.schoolId),
      listStudents(profile.schoolId),
      listStudentTransport(profile.schoolId),
    ]);
    setVehicles(v);
    setRoutes(r);
    setStops(s);
    setStudents(st.filter((x) => x.status === 'active'));
    setAssignments(a);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleAddVehicle() {
    if (!profile?.schoolId || !vehicleNumber.trim()) return;
    setErrorMsg(null);
    try {
      await createVehicle({
        schoolId: profile.schoolId,
        vehicleNumber,
        vehicleType,
        capacity: Number(capacity) || 0,
        driverName,
        driverPhone,
      });
      setVehicleNumber('');
      setVehicleType('');
      setCapacity('');
      setDriverName('');
      setDriverPhone('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add vehicle.'));
    }
  }

  async function handleDeleteVehicle() {
    if (!deletingVehicle) return;
    setErrorMsg(null);
    try {
      await deleteVehicle(deletingVehicle.id);
      setSuccessMsg(`${deletingVehicle.vehicleNumber} removed.`);
      setDeletingVehicle(null);
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete vehicle.'));
    }
  }

  async function handleAddRoute() {
    if (!profile?.schoolId || !routeName.trim()) return;
    setErrorMsg(null);
    try {
      await createRoute(profile.schoolId, routeName, routeVehicleId || null);
      setRouteName('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add route.'));
    }
  }

  async function handleAddStop(routeId: string) {
    if (!profile?.schoolId || !stopName.trim()) return;
    setErrorMsg(null);
    try {
      // Always compute the next order from what's already on this route —
      // never trust a manually-typed number, which is exactly what let
      // every stop default to "1" instead of incrementing.
      const nextOrder = stops.filter((s) => s.routeId === routeId).length + 1;
      await createStop(profile.schoolId, routeId, stopName, nextOrder);
      setStopName('');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add stop.'));
    }
  }

  async function handleAssign() {
    if (!profile?.schoolId || !assignStudentId || !assignRouteId || !assignStopId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await assignStudentTransport({ schoolId: profile.schoolId, studentId: assignStudentId, routeId: assignRouteId, stopId: assignStopId });
      setSuccessMsg('Student assigned to route.');
      loadAll();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to assign student.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Transport" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['vehicles', 'routes', 'assignments', 'drivers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'vehicles' ? 'Vehicles' : t === 'routes' ? 'Routes & Stops' : t === 'assignments' ? 'Student Assignments' : 'Drivers'}
          </button>
        ))}
      </div>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      {tab === 'vehicles' && (
        <div>
          <PermissionGate code="transport.manage">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add vehicle</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <input className="input" placeholder="Vehicle #" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                <input className="input" placeholder="Type (Bus/Van)" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
                <input type="number" className="input" placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                <input className="input" placeholder="Driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                <input className="input" placeholder="Driver phone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
              </div>
              <button onClick={handleAddVehicle} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Add vehicle
              </button>
            </div>
          </PermissionGate>

          {vehicles.length === 0 ? (
            <p className="text-sm text-gray-500">No vehicles yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {vehicles.map((v) => (
                <li key={v.id} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {v.vehicleNumber} {v.vehicleType && `(${v.vehicleType})`}
                    </span>
                    <span className="text-xs text-gray-500">
                      Capacity {v.capacity} {v.driverName && `· Driver ${v.driverName}`} {v.driverPhone && `· ${v.driverPhone}`}
                    </span>
                  </div>
                  <PermissionGate code="transport.manage">
                    <div className="mt-1 flex items-center justify-between">
                      <DriverInvite vehicle={v} onDone={loadAll} />
                      <button onClick={() => setDeletingVehicle(v)} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {deletingVehicle && (
        <DestructiveConfirmModal
          title="Delete vehicle"
          message={`This permanently removes ${deletingVehicle.vehicleNumber} and its driver login link. Any routes using it will lose their vehicle assignment (the route itself stays). Type the vehicle number to confirm.`}
          expectedConfirmText={deletingVehicle.vehicleNumber}
          onConfirm={handleDeleteVehicle}
          onClose={() => setDeletingVehicle(null)}
        />
      )}

      {tab === 'routes' && (
        <div>
          <PermissionGate code="transport.manage">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add route</h2>
              <div className="mb-3 flex flex-wrap gap-2">
                <input className="input" placeholder="Route name" value={routeName} onChange={(e) => setRouteName(e.target.value)} />
                <select className="input" value={routeVehicleId} onChange={(e) => setRouteVehicleId(e.target.value)}>
                  <option value="">No vehicle assigned</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                </select>
                <button onClick={handleAddRoute} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Add route
                </button>
              </div>
            </div>
          </PermissionGate>

          {routes.length === 0 ? (
            <p className="text-sm text-gray-500">No routes yet.</p>
          ) : (
            <div className="space-y-4">
              {routes.map((r) => (
                <div key={r.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  <p className="mb-2 font-medium text-gray-900 dark:text-gray-50">
                    {r.name} {r.vehicleNumber && <span className="text-xs font-normal text-gray-500">· {r.vehicleNumber}</span>}
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {stops.filter((s) => s.routeId === r.id).map((s) => (
                      <span key={s.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {s.stopOrder}. {s.name}
                      </span>
                    ))}
                    {stops.filter((s) => s.routeId === r.id).length === 0 && <span className="text-xs text-gray-500">No stops yet.</span>}
                  </div>
                  <PermissionGate code="transport.manage">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{stops.filter((s) => s.routeId === r.id).length + 1}</span>
                      <input
                        className="input max-w-[160px] text-sm"
                        placeholder="Stop name"
                        value={stopRouteId === r.id ? stopName : ''}
                        onChange={(e) => { setStopRouteId(r.id); setStopName(e.target.value); }}
                      />
                      <button
                        onClick={() => handleAddStop(r.id)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        Add stop
                      </button>
                    </div>
                  </PermissionGate>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'assignments' && (
        <div>
          <PermissionGate code="transport.manage">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Assign student to route</h2>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select className="input" value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)}>
                  <option value="">Student…</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <select className="input" value={assignRouteId} onChange={(e) => { setAssignRouteId(e.target.value); setAssignStopId(''); }}>
                  <option value="">Route…</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select className="input" value={assignStopId} onChange={(e) => setAssignStopId(e.target.value)} disabled={!assignRouteId}>
                  <option value="">Stop…</option>
                  {stops.filter((s) => s.routeId === assignRouteId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={handleAssign} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Assign
              </button>
            </div>
          </PermissionGate>

          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No students assigned to transport yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium text-gray-900 dark:text-gray-50">{a.studentName}</span>
                  <span className="text-xs text-gray-500">{a.routeName} · {a.stopName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'drivers' && <DriversTab vehicles={vehicles} schoolId={profile?.schoolId} />}
    </div>
  );
}

function DriversTab({ vehicles, schoolId }: { vehicles: Vehicle[]; schoolId: string | undefined }) {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [reassignDraft, setReassignDraft] = useState<Record<string, string>>({});
  const [enablingPayroll, setEnablingPayroll] = useState<string | null>(null);

  async function load() {
    if (!schoolId) return;
    try {
      setDrivers(await listDrivers(schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load drivers.'));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  async function handleReset(userId: string, password: string) {
    try {
      const result = await adminResetPassword(userId, password);
      setMsg(result.message);
    } catch (err) {
      setMsg(getErrorMessage(err, 'Failed to reset password.'));
    } finally {
      setResettingId(null);
    }
  }

  async function handleReassign(d: DriverInfo) {
    const newVehicleId = reassignDraft[d.userId];
    if (!newVehicleId || newVehicleId === d.vehicleId) return;
    setMsg(null);
    setErrorMsg(null);
    try {
      await reassignDriver(d.userId, newVehicleId);
      setMsg(`${d.fullName} reassigned.`);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to reassign driver.'));
    }
  }

  async function handleUnassign(d: DriverInfo) {
    setMsg(null);
    setErrorMsg(null);
    try {
      await unassignDriver(d.vehicleId);
      setMsg(`${d.fullName} removed from ${d.vehicleNumber}.`);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to remove driver.'));
    }
  }

  async function handleEnablePayroll(d: DriverInfo) {
    if (!schoolId) return;
    setEnablingPayroll(d.userId);
    setErrorMsg(null);
    setMsg(null);
    try {
      await enableDriverPayroll(schoolId, d);
      setMsg(`Payroll enabled for ${d.fullName} — set their salary from the Payroll page.`);
      load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to enable payroll.'));
    } finally {
      setEnablingPayroll(null);
    }
  }

  const availableVehicles = vehicles;

  return (
    <div>
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {msg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{msg}</p>}

      {drivers.length === 0 ? (
        <p className="text-sm text-gray-500">No driver logins yet — create one from the Vehicles tab.</p>
      ) : (
        <ul className="space-y-2">
          {drivers.map((d) => (
            <li key={d.userId} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{d.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {d.email} {d.phone && `· ${d.phone}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {d.vehicleNumber} {d.routeName && `· ${d.routeName}`}
                </span>
              </div>

              <PermissionGate code="transport.manage">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input py-1 text-xs"
                    value={reassignDraft[d.userId] ?? d.vehicleId}
                    onChange={(e) => setReassignDraft((prev) => ({ ...prev, [d.userId]: e.target.value }))}
                  >
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                    ))}
                  </select>
                  <button onClick={() => handleReassign(d)} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Reassign
                  </button>
                  <button onClick={() => setResettingId(d.userId)} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Reset password
                  </button>
                  <button onClick={() => handleUnassign(d)} className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                    Remove
                  </button>
                </div>
              </PermissionGate>

              <PermissionGate code="staff.create">
                <div className="mt-2">
                  {d.staffId ? (
                    <Link to="/school/payroll" className="text-xs font-medium text-primary-600 hover:underline">
                      Payroll enabled — set salary in Payroll →
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnablePayroll(d)}
                      disabled={enablingPayroll === d.userId}
                      className="text-xs font-medium text-primary-600 hover:underline disabled:opacity-60"
                    >
                      {enablingPayroll === d.userId ? 'Enabling…' : 'Enable payroll for this driver'}
                    </button>
                  )}
                </div>
              </PermissionGate>

              {resettingId === d.userId && (
                <ResetPasswordModal personName={d.fullName} onSubmit={(password) => handleReset(d.userId, password)} onClose={() => setResettingId(null)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TransportPage() {
  return (
    <FeatureGate feature="transport">
      <TransportInner />
    </FeatureGate>
  );
}
