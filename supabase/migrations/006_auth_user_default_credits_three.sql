-- Yeni kullanıcı: 1 kredi = 1 dönüşüm; ücretsiz katman 3 hak (Önceki: 100)

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
    3,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
