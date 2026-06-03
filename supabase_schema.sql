-- Create predictions table
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  category text not null,
  confidence numeric not null,
  model_used text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.predictions enable row level security;

-- Create policies
create policy "Users can insert their own predictions."
  on predictions for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own predictions."
  on predictions for select
  using ( auth.uid() = user_id );
