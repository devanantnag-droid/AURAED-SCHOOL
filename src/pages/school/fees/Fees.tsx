import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listClasses, listSessions } from '@/services/academics.service';
import {
  assignFeeToClass,
  createFeeCategory,
  createFeeStructure,
  listFeeCategories,
  listFeeStructures,
} from '@/services/fees.service';
import type { AcademicSession, ClassEntity } from '@/types/academics';
import type { FeeCategory, FeeFrequency, FeeStructure } from '@/types/fees';
import { PageHeader } from '@/components/shared/PageHeader';

const FREQUENCIES: { value: FeeFrequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

function FeesInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'categories' | 'structures'>('categories');
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const [structureCategoryId, setStructureCategoryId] = useState('');
  const [structureClassId, setStructureClassId] = useState('');
  const [structureAmount, setStructureAmount] = useState('');
  const [structureFrequency, setStructureFrequency] = useState<FeeFrequency>('one_time');

  async function loadCategories() {
    if (!profile?.schoolId) return;
    setCategories(await listFeeCategories(profile.schoolId));
  }

  async function loadStructures() {
    if (!profile?.schoolId) return;
    setStructures(await listFeeStructures(profile.schoolId));
  }

  useEffect(() => {
    if (!profile?.schoolId) return;
    loadCategories();
    loadStructures();
    listClasses(profile.schoolId).then(setClasses);
    listSessions(profile.schoolId).then((s) => {
      setSessions(s);
      const current = s.find((x) => x.isCurrent) ?? s[0];
      if (current) setSessionId(current.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  async function handleAddCategory() {
    if (!profile?.schoolId || !categoryName.trim()) return;
    setErrorMsg(null);
    try {
      await createFeeCategory(profile.schoolId, categoryName, categoryDescription);
      setCategoryName('');
      setCategoryDescription('');
      loadCategories();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add fee category.'));
    }
  }

  async function handleAddStructure() {
    if (!profile?.schoolId || !sessionId || !structureCategoryId || !structureAmount) return;
    setErrorMsg(null);
    try {
      await createFeeStructure({
        schoolId: profile.schoolId,
        sessionId,
        feeCategoryId: structureCategoryId,
        classId: structureClassId || null,
        amount: Number(structureAmount),
        frequency: structureFrequency,
      });
      setStructureAmount('');
      loadStructures();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add fee structure.'));
    }
  }

  async function handleAssign(structure: FeeStructure) {
    if (!profile?.schoolId || !sessionId) return;
    setErrorMsg(null);
    setAssignMsg(null);
    try {
      const count = await assignFeeToClass({ schoolId: profile.schoolId, sessionId, feeStructure: structure });
      setAssignMsg(
        count > 0
          ? `Assigned to ${count} student(s).`
          : 'Already assigned to everyone in scope, or no active students found.'
      );
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to assign fee.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Fees" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['categories', 'structures'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 capitalize ${
              tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'categories' ? 'Fee Categories' : 'Fee Structures'}
          </button>
        ))}
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}
      {assignMsg && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {assignMsg}
        </p>
      )}

      {tab === 'categories' ? (
        <div>
          <PermissionGate code="fees.create">
            <div className="mb-5 flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                <input className="input" placeholder="e.g. Tuition" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                <input className="input" placeholder="Optional" value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
              </div>
              <button onClick={handleAddCategory} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Add category
              </button>
            </div>
          </PermissionGate>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No fee categories yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {categories.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <span className="font-medium text-gray-900 dark:text-gray-50">{c.name}</span>
                  {c.description && <span className="ml-2 text-gray-500">{c.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <PermissionGate code="fees.create">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">New fee structure</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="input" value={structureCategoryId} onChange={(e) => setStructureCategoryId(e.target.value)}>
                  <option value="">Category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input" value={structureClassId} onChange={(e) => setStructureClassId(e.target.value)}>
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input" value={structureFrequency} onChange={(e) => setStructureFrequency(e.target.value as FeeFrequency)}>
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input type="number" className="input max-w-[160px]" placeholder="Amount" value={structureAmount} onChange={(e) => setStructureAmount(e.target.value)} />
                <button onClick={handleAddStructure} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Add structure
                </button>
              </div>
            </div>
          </PermissionGate>

          {structures.length === 0 ? (
            <p className="text-sm text-gray-500">No fee structures yet.</p>
          ) : (
            <ul className="space-y-2">
              {structures.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <span>
                    {s.categoryName} · {s.className ?? 'All classes'} · ₹{s.amount} ({s.frequency.replace('_', ' ')})
                  </span>
                  <PermissionGate code="fees.create">
                    <button onClick={() => handleAssign(s)} className="text-primary-600 hover:underline">
                      Assign to students
                    </button>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function FeesPage() {
  return (
    <FeatureGate feature="fees">
      <FeesInner />
    </FeatureGate>
  );
}
