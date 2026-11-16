-- Le Carnet Café : une ligne par café, une note de groupe par critère (1 à 5, null = pas noté).
-- Une colonne par critère : deux clics simultanés sur des critères différents ne s'écrasent pas.

create table public.cafes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  area        text not null default '' check (char_length(area) <= 60),
  ambiance    smallint check (ambiance between 1 and 5),
  calme       smallint check (calme between 1 and 5),
  prix        smallint check (prix between 1 and 5),
  wifi        smallint check (wifi between 1 and 5),
  prises      smallint check (prises between 1 and 5),
  price       numeric(5, 2) check (price > 0 and price <= 30),
  comment     text not null default '' check (char_length(comment) <= 400),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger cafes_touch before update on public.cafes
  for each row execute function public.touch_updated_at();

-- Lecture : ouverte à la clé publique (nécessaire au temps réel dans le navigateur).
-- Écriture : aucune policy, donc seul le serveur (clé secrète, après vérification du code de groupe) peut écrire.
alter table public.cafes enable row level security;
create policy "lecture" on public.cafes for select to anon, authenticated using (true);

alter publication supabase_realtime add table public.cafes;
