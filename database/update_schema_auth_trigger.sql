-- Create a function that handles new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.soundflare_users (
    id,
    clerk_id,
    email,
    first_name,
    last_name,
    profile_image_url
  )
  values (
    new.id,
    new.id::text,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
