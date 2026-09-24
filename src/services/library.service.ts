import { supabase } from '@/lib/supabase';
import type { Book, BookIssue } from '@/types/library';

function mapBookRow(r: {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  total_copies: number;
  available_copies: number;
}): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    isbn: r.isbn,
    category: r.category,
    publisher: r.publisher,
    totalCopies: r.total_copies,
    availableCopies: r.available_copies,
  };
}

export async function listBooks(schoolId: string, search?: string): Promise<Book[]> {
  let query = supabase.from('books').select('*').eq('school_id', schoolId).order('title');
  if (search && search.trim()) {
    const safe = search.trim().replace(/[%,]/g, '');
    query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%,isbn.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapBookRow);
}

export async function createBook(input: {
  schoolId: string;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  publisher?: string;
  totalCopies: number;
}): Promise<void> {
  const { error } = await supabase.from('books').insert({
    school_id: input.schoolId,
    title: input.title,
    author: input.author || null,
    isbn: input.isbn || null,
    category: input.category || null,
    publisher: input.publisher || null,
    total_copies: input.totalCopies,
    available_copies: input.totalCopies,
  });
  if (error) throw error;
}

function mapIssueRow(r: any): BookIssue {
  return {
    id: r.id,
    bookId: r.book_id,
    bookTitle: r.books?.title,
    studentId: r.student_id,
    teacherId: r.teacher_id,
    borrowerName: r.students ? `${r.students.first_name} ${r.students.last_name}` : r.teachers?.full_name,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    returnDate: r.return_date,
    fine: Number(r.fine),
  };
}

export async function listIssues(schoolId: string, onlyActive = false): Promise<BookIssue[]> {
  let query = supabase
    .from('book_issues')
    .select('*, books(title), students(first_name, last_name), teachers(full_name)')
    .eq('school_id', schoolId);
  if (onlyActive) query = query.is('return_date', null);
  const { data, error } = await query.order('issue_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapIssueRow);
}

export async function listMyIssues(teacherId: string): Promise<BookIssue[]> {
  const { data, error } = await supabase
    .from('book_issues')
    .select('*, books(title)')
    .eq('teacher_id', teacherId)
    .order('issue_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapIssueRow);
}

export async function issueBook(input: {
  schoolId: string;
  bookId: string;
  borrowerType: 'student' | 'teacher';
  borrowerId: string;
  dueDate: string;
}): Promise<void> {
  const { error } = await supabase.from('book_issues').insert({
    school_id: input.schoolId,
    book_id: input.bookId,
    student_id: input.borrowerType === 'student' ? input.borrowerId : null,
    teacher_id: input.borrowerType === 'teacher' ? input.borrowerId : null,
    due_date: input.dueDate,
  });
  if (error) throw error;
}

export async function returnBook(issueId: string, fine = 0): Promise<void> {
  const { error } = await supabase
    .from('book_issues')
    .update({ return_date: new Date().toISOString().slice(0, 10), fine })
    .eq('id', issueId);
  if (error) throw error;
}
