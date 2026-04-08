-- Monthly feedback campaigns + MCQ question bank + student submissions

create table if not exists public.feedback_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month_key text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  is_published boolean not null default false,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_campaigns_month_key_format check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint feedback_campaigns_date_order check (closes_at > opens_at)
);

create index if not exists idx_feedback_campaigns_window
  on public.feedback_campaigns (is_published, opens_at, closes_at);

create table if not exists public.feedback_questions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.feedback_campaigns(id) on delete cascade,
  scope_type text not null,
  scope_subject_id uuid null references public.subjects(id) on delete set null,
  scope_faculty_id uuid null references public.users(id) on delete set null,
  scope_label text null,
  question_text text not null,
  options jsonb not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint feedback_questions_scope_type check (scope_type in ('subject', 'faculty', 'facility', 'custom')),
  constraint feedback_questions_options_array check (jsonb_typeof(options) = 'array')
);

create index if not exists idx_feedback_questions_campaign
  on public.feedback_questions (campaign_id, sort_order);

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.feedback_campaigns(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (campaign_id, student_id)
);

create index if not exists idx_feedback_submissions_campaign
  on public.feedback_submissions (campaign_id);

create table if not exists public.feedback_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.feedback_submissions(id) on delete cascade,
  question_id uuid not null references public.feedback_questions(id) on delete cascade,
  option_index int not null,
  option_text text not null,
  answered_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists idx_feedback_answers_submission
  on public.feedback_answers (submission_id);
