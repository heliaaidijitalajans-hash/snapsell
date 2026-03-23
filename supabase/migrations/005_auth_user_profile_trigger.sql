-- Yeni Supabase Auth kaydinda public.users satiri otomatik (cakismada sessizce atla)

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, plan, credits, total_conversions)
  values (
    new.id,
    case when new.email is not null then lower(trim(new.email)) else null end,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'free',
    100,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_insert_profile on auth.users;
create trigger on_auth_user_created_insert_profile
  after insert on auth.users
  for each row
  execute procedure public.handle_new_auth_user();
