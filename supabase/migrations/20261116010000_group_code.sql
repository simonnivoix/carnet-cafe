-- Site statique (GitHub Pages) : plus de serveur, donc c'est la base qui vérifie le code de groupe.
-- Le code est stocké haché (bcrypt) dans un schéma privé, inaccessible à la clé publique.
-- Il n'est jamais écrit dans le dépôt : on le définit à part avec
--   select private.set_group_code('le code');   (depuis le SQL editor ou `supabase db query --linked`)

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.group_code (
  id    boolean primary key default true check (id),
  hash  text not null
);

create function private.set_group_code(p_code text) returns void
language sql security definer set search_path = '' as $$
  insert into private.group_code (id, hash)
  values (true, extensions.crypt(lower(trim(p_code)), extensions.gen_salt('bf', 10)))
  on conflict (id) do update set hash = excluded.hash;
$$;

create function private.code_ok(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.group_code g
    where g.hash = extensions.crypt(lower(trim(coalesce(p_code, ''))), g.hash)
  );
$$;

create function private.require_code(p_code text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.code_ok(p_code) then
    perform pg_sleep(0.5); -- freine les essais en rafale
    raise exception 'code_invalide' using errcode = '28000';
  end if;
end $$;

-- API publique : chaque fonction exige le code.

create function public.check_code(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if private.code_ok(p_code) then return true; end if;
  perform pg_sleep(0.5);
  return false;
end $$;

create function public.add_cafe(p_code text, p_name text, p_area text) returns public.cafes
language plpgsql security definer set search_path = '' as $$
declare r public.cafes;
begin
  perform private.require_code(p_code);
  insert into public.cafes (name, area)
  values (left(trim(p_name), 80), left(trim(coalesce(p_area, '')), 60))
  returning * into r;
  return r;
end $$;

-- p_patch : seules les clés présentes sont modifiées ; une valeur null efface la note.
create function public.update_cafe(p_code text, p_id uuid, p_patch jsonb) returns public.cafes
language plpgsql security definer set search_path = '' as $$
declare r public.cafes;
begin
  perform private.require_code(p_code);
  update public.cafes c set
    ambiance = case when p_patch ? 'ambiance' then (p_patch->>'ambiance')::smallint else c.ambiance end,
    calme    = case when p_patch ? 'calme'    then (p_patch->>'calme')::smallint    else c.calme end,
    prix     = case when p_patch ? 'prix'     then (p_patch->>'prix')::smallint     else c.prix end,
    wifi     = case when p_patch ? 'wifi'     then (p_patch->>'wifi')::smallint     else c.wifi end,
    prises   = case when p_patch ? 'prises'   then (p_patch->>'prises')::smallint   else c.prises end,
    price    = case when p_patch ? 'price'    then round((p_patch->>'price')::numeric, 2) else c.price end,
    comment  = case when p_patch ? 'comment'  then left(trim(coalesce(p_patch->>'comment', '')), 400) else c.comment end
  where c.id = p_id
  returning * into r;
  return r;
end $$;

create function public.delete_cafe(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_code(p_code);
  delete from public.cafes where id = p_id;
end $$;

revoke execute on function public.check_code(text), public.add_cafe(text, text, text),
  public.update_cafe(text, uuid, jsonb), public.delete_cafe(text, uuid) from public;
grant execute on function public.check_code(text), public.add_cafe(text, text, text),
  public.update_cafe(text, uuid, jsonb), public.delete_cafe(text, uuid) to anon, authenticated;
