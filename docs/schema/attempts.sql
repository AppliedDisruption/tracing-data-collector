-- Postgres reference: trace attempts table (use with your own API / DB).
create table if not exists attempts (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),
  idempotency_key    text not null unique,
  labeler     text not null,
  character   text not null,
  label       text not null check (label in ('correct', 'wrong')),
  strokes     jsonb not null,
  canvas_w    integer not null,
  canvas_h    integer not null,
  svg_path    text not null,
  view_box    text not null
);

alter table attempts disable row level security;
