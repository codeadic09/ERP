-- Create table for /contact and /help form submissions
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  university_name text null,
  phone text null,
  city text null,
  student_count text null,
  plan_interest text null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_contact_submissions_submitted_at
  on public.contact_submissions (submitted_at desc);

create index if not exists idx_contact_submissions_email
  on public.contact_submissions (email);
