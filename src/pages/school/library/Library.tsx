import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { createBook, issueBook, listBooks, listIssues, returnBook } from '@/services/library.service';
import { listStudents } from '@/services/students.service';
import { listTeachers } from '@/services/teachers.service';
import type { Book, BookIssue } from '@/types/library';
import type { Student, Teacher } from '@/types/people';
import { PageHeader } from '@/components/shared/PageHeader';

function LibraryInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'books' | 'issue'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');

  const [issueBookId, setIssueBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'teacher'>('student');
  const [borrowerId, setBorrowerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fineDrafts, setFineDrafts] = useState<Record<string, string>>({});

  async function loadBooks(searchTerm?: string) {
    if (!profile?.schoolId) return;
    setBooks(await listBooks(profile.schoolId, searchTerm));
  }

  async function loadIssues() {
    if (!profile?.schoolId) return;
    setIssues(await listIssues(profile.schoolId));
  }

  useEffect(() => {
    if (!profile?.schoolId) return;
    loadBooks();
    loadIssues();
    listStudents(profile.schoolId).then((s) => setStudents(s.filter((x) => x.status === 'active')));
    listTeachers(profile.schoolId).then((t) => setTeachers(t.filter((x) => x.status === 'active')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    const timer = setTimeout(() => loadBooks(search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleAddBook() {
    if (!profile?.schoolId || !title.trim()) return;
    setErrorMsg(null);
    try {
      await createBook({
        schoolId: profile.schoolId,
        title,
        author,
        isbn,
        category,
        totalCopies: Number(totalCopies) || 1,
      });
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCategory('');
      setTotalCopies('1');
      loadBooks(search);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add book.'));
    }
  }

  async function handleIssue() {
    if (!profile?.schoolId || !issueBookId || !borrowerId || !dueDate) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await issueBook({ schoolId: profile.schoolId, bookId: issueBookId, borrowerType, borrowerId, dueDate });
      setSuccessMsg('Book issued.');
      setBorrowerId('');
      setDueDate('');
      loadBooks(search);
      loadIssues();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to issue book.'));
    }
  }

  async function handleReturn(issue: BookIssue) {
    setErrorMsg(null);
    try {
      await returnBook(issue.id, Number(fineDrafts[issue.id] ?? 0));
      loadBooks(search);
      loadIssues();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to return book.'));
    }
  }

  const activeIssues = issues.filter((i) => !i.returnDate);
  const pastIssues = issues.filter((i) => i.returnDate);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Library" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['books', 'issue'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'books' ? 'Books' : 'Issue & Return'}
          </button>
        ))}
      </div>

      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      {tab === 'books' ? (
        <div>
          <PermissionGate code="library.manage">
            <div className="mb-5 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add book</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="input" placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                <input className="input" placeholder="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                <input className="input" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="number" className="input max-w-[140px]" placeholder="Copies" value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} />
                <button onClick={handleAddBook} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  Add book
                </button>
              </div>
            </div>
          </PermissionGate>

          <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, ISBN…" className="w-full bg-transparent text-sm outline-none dark:text-gray-100" />
          </div>

          {books.length === 0 ? (
            <p className="text-sm text-gray-500">No books yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {books.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{b.title}</span>
                    {b.author && <span className="ml-2 text-xs text-gray-500">by {b.author}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{b.availableCopies} / {b.totalCopies} available</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <PermissionGate code="library.manage">
            <div className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Issue a book</h2>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select className="input" value={issueBookId} onChange={(e) => setIssueBookId(e.target.value)}>
                  <option value="">Book…</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies === 0}>
                      {b.title} {b.availableCopies === 0 ? '(none available)' : `(${b.availableCopies} available)`}
                    </option>
                  ))}
                </select>
                <select className="input" value={borrowerType} onChange={(e) => { setBorrowerType(e.target.value as 'student' | 'teacher'); setBorrowerId(''); }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <select className="input" value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}>
                  <option value="">Borrower…</option>
                  {(borrowerType === 'student' ? students : teachers).map((p) => (
                    <option key={p.id} value={p.id}>
                      {'firstName' in p ? `${p.firstName} ${p.lastName}` : p.fullName}
                    </option>
                  ))}
                </select>
                <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <button onClick={handleIssue} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Issue book
              </button>
            </div>
          </PermissionGate>

          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Currently issued ({activeIssues.length})</h2>
          {activeIssues.length === 0 ? (
            <p className="mb-6 text-sm text-gray-500">No books currently checked out.</p>
          ) : (
            <ul className="mb-6 space-y-2">
              {activeIssues.map((i) => (
                <li key={i.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{i.bookTitle}</span>
                    <span className="ml-2 text-xs text-gray-500">{i.borrowerName} · Due {i.dueDate}</span>
                  </div>
                  <PermissionGate code="library.manage">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Fine"
                        className="input w-20 py-1"
                        value={fineDrafts[i.id] ?? ''}
                        onChange={(e) => setFineDrafts((prev) => ({ ...prev, [i.id]: e.target.value }))}
                      />
                      <button onClick={() => handleReturn(i)} className="rounded-md bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700">
                        Return
                      </button>
                    </div>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">History</h2>
          {pastIssues.length === 0 ? (
            <p className="text-sm text-gray-500">No returns recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {pastIssues.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-3 py-2">
                  <span>{i.bookTitle} · {i.borrowerName}</span>
                  <span className="text-xs text-gray-500">
                    Returned {i.returnDate} {i.fine > 0 && `· Fine ₹${i.fine}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function LibraryPage() {
  return (
    <FeatureGate feature="library">
      <LibraryInner />
    </FeatureGate>
  );
}
