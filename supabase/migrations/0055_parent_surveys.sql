-- AURAED SCHOOL — Phase 34: Parent Feedback Surveys
-- Run after 0001-0054.
--
-- Deliberately simpler targeting than circulars/announcements: the
-- audience for a feedback survey is always parents, so target_type is
-- just 'all_parents' or 'class' (parents of that class) rather than the
-- full all/role/class matrix those other features use. This also means
-- the notification trigger can't reuse the shared notify_targeted_users
-- helper's 'class' branch as-is, since that notifies teachers and
-- students in the class too, not just parents — so this writes its own
-- narrower, parent-only notification insert instead.

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  target_type text not null default 'all_parents' check (target_type in ('all_parents', 'class')),
  target_class_id uuid references public.classes(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_school on public.surveys(school_id);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'rating' check (question_type in ('rating', 'text')),
  display_order int not null default 0
);

create index if not exists idx_survey_questions_survey on public.survey_questions(survey_id);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  respondent_id uuid not null references auth.users(id) on delete cascade,
  rating_value int check (rating_value between 1 and 5),
  text_value text,
  created_at timestamptz not null default now(),
  unique (question_id, respondent_id)
);

create index if not exists idx_survey_responses_survey on public.survey_responses(survey_id);

drop trigger if exists trg_audit_surveys on public.surveys;
create trigger trg_audit_surveys
  after insert or update or delete on public.surveys
  for each row execute function public.audit_row_change();

-- =========================================================================
-- Permissions
-- =========================================================================
insert into public.permissions (code, description) values
  ('surveys.manage', 'Create feedback surveys and view results'),
  ('surveys.respond', 'Respond to feedback surveys')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'SCHOOL_ADMIN' and p.code = 'surveys.manage'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'PARENT' and p.code = 'surveys.respond'
on conflict do nothing;

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;

-- School Admin sees every survey at their school. A parent sees an
-- active survey only if it targets all parents, or targets a class one
-- of their children is actually in.
create policy surveys_select on public.surveys
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (
      school_id = public.user_school_id()
      and (
        public.user_has_permission('surveys.manage')
        or (
          is_active
          and public.user_has_permission('surveys.respond')
          and (
            target_type = 'all_parents'
            or (target_type = 'class' and exists (
              select 1 from public.students s where public.is_parent_of(s.id) and s.class_id = surveys.target_class_id
            ))
          )
        )
      )
    )
  );

create policy surveys_insert on public.surveys
  for insert with check (
    school_id = public.user_school_id() and public.user_has_permission('surveys.manage') and created_by = auth.uid()
  );

create policy surveys_update on public.surveys
  for update using (school_id = public.user_school_id() and public.user_has_permission('surveys.manage'));

create policy surveys_delete on public.surveys
  for delete using (school_id = public.user_school_id() and public.user_has_permission('surveys.manage'));

-- Questions are visible to anyone who can see the parent survey itself.
create policy survey_questions_select on public.survey_questions
  for select using (exists (select 1 from public.surveys sv where sv.id = survey_questions.survey_id));

create policy survey_questions_insert on public.survey_questions
  for insert with check (
    exists (
      select 1 from public.surveys sv
      where sv.id = survey_questions.survey_id
        and sv.school_id = public.user_school_id()
        and public.user_has_permission('surveys.manage')
    )
  );

create policy survey_questions_delete on public.survey_questions
  for delete using (
    exists (
      select 1 from public.surveys sv
      where sv.id = survey_questions.survey_id
        and sv.school_id = public.user_school_id()
        and public.user_has_permission('surveys.manage')
    )
  );

-- Responses: School Admin sees every response to their own school's
-- surveys (needed to aggregate results). A parent can see and insert
-- only their own responses.
create policy survey_responses_select on public.survey_responses
  for select using (
    respondent_id = auth.uid()
    or exists (
      select 1 from public.surveys sv
      where sv.id = survey_responses.survey_id
        and sv.school_id = public.user_school_id()
        and public.user_has_permission('surveys.manage')
    )
  );

create policy survey_responses_insert on public.survey_responses
  for insert with check (
    respondent_id = auth.uid()
    and public.user_has_permission('surveys.respond')
    and exists (
      select 1 from public.surveys sv
      where sv.id = survey_responses.survey_id
        and sv.is_active
        and (
          sv.target_type = 'all_parents'
          or exists (select 1 from public.students s where public.is_parent_of(s.id) and s.class_id = sv.target_class_id)
        )
    )
  );

-- =========================================================================
-- Notify targeted parents when a new survey is published — a purpose
-- built, parent-only notification rather than reusing the shared
-- notify_targeted_users helper (its 'class' mode also notifies teachers
-- and students, which would be wrong for a parent-only survey).
-- =========================================================================
create or replace function public.trg_notify_survey()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.is_active then
    return new;
  end if;

  if new.target_type = 'all_parents' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select distinct new.school_id, ur.user_id, 'survey', 'New survey: ' || new.title, coalesce(new.description, ''), '/school/surveys'
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.school_id = new.school_id and r.name = 'PARENT';

  elsif new.target_type = 'class' then
    insert into public.notifications (school_id, user_id, type, title, body, link)
    select distinct new.school_id, par.user_id, 'survey', 'New survey: ' || new.title, coalesce(new.description, ''), '/school/surveys'
    from public.students s
    join public.parent_students ps on ps.student_id = s.id
    join public.parents par on par.id = ps.parent_id
    where s.class_id = new.target_class_id and par.user_id is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_survey_notify on public.surveys;
create trigger trg_survey_notify
  after insert on public.surveys
  for each row execute function public.trg_notify_survey();
