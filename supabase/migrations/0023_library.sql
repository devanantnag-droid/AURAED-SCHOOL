-- AURAED SCHOOL — Phase 12: Library
-- Run after 0001-0022.

-- =========================================================================
-- BOOKS
-- =========================================================================
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  author text,
  isbn text,
  category text,
  publisher text,
  total_copies integer not null default 1 check (total_copies >= 0),
  available_copies integer not null default 1 check (available_copies >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_school_id on public.books(school_id);

-- =========================================================================
-- BOOK ISSUES — borrower is either a student or a teacher, same
-- dual-nullable-FK pattern used for payroll in Phase 11.
-- =========================================================================
create table if not exists public.book_issues (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  issue_date date not null default current_date,
  due_date date not null,
  return_date date,
  fine numeric(8, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(student_id, teacher_id) = 1)
);

create index if not exists idx_book_issues_school_id on public.book_issues(school_id);
create index if not exists idx_book_issues_book on public.book_issues(book_id);
create index if not exists idx_book_issues_student on public.book_issues(student_id);
create index if not exists idx_book_issues_teacher on public.book_issues(teacher_id);
-- A book copy can only be out to one borrower at a time per "issue" — this
-- doesn't limit total copies (that's total_copies/available_copies on the
-- book itself), it just stops the exact same issue row being manipulated
-- twice; real double-issue prevention is the available_copies check below.

-- Decrement/restore available_copies automatically. Rejects issuing a book
-- with zero copies available — this is the actual enforcement, not just a
-- UI check.
create or replace function public.adjust_book_availability()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.books
    set available_copies = available_copies - 1
    where id = new.book_id and available_copies > 0;

    if not found then
      raise exception 'No copies of this book are currently available';
    end if;

  elsif tg_op = 'UPDATE' then
    -- Returning a book (return_date newly set) restores one copy.
    if old.return_date is null and new.return_date is not null then
      update public.books set available_copies = available_copies + 1 where id = new.book_id;
    end if;
    -- Un-returning (correction) takes a copy back out.
    if old.return_date is not null and new.return_date is null then
      update public.books
      set available_copies = available_copies - 1
      where id = new.book_id and available_copies > 0;
      if not found then
        raise exception 'No copies of this book are currently available to un-return';
      end if;
    end if;

  elsif tg_op = 'DELETE' then
    if old.return_date is null then
      update public.books set available_copies = available_copies + 1 where id = old.book_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_adjust_book_availability on public.book_issues;
create trigger trg_adjust_book_availability
  after insert or update or delete on public.book_issues
  for each row execute function public.adjust_book_availability();

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists trg_book_issues_updated_at on public.book_issues;
create trigger trg_book_issues_updated_at before update on public.book_issues
  for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_books on public.books;
create trigger trg_audit_books
  after insert or update or delete on public.books
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_book_issues on public.book_issues;
create trigger trg_audit_book_issues
  after insert or update or delete on public.book_issues
  for each row execute function public.audit_row_change();

-- =========================================================================
-- New permissions — LIBRARIAN (seeded since Phase 1, unused until now)
-- becomes the natural owner of this module alongside School Admin.
-- =========================================================================
insert into public.permissions (code, description) values
  ('library.view', 'View the book catalog and issue/return history'),
  ('library.manage', 'Manage books and issue/return records')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code in ('library.view', 'library.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'LIBRARIAN' and p.code in ('library.view', 'library.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('TEACHER', 'PARENT', 'STUDENT') and p.code = 'library.view'
on conflict do nothing;
