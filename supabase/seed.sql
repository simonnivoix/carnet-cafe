-- Reprise des données de l'Artifact claude.ai (13 nov. 2026)
insert into public.cafes (name, area, ambiance, calme, prix, wifi, prises, price, comment, created_at)
select 'L''hirondelle', 'Bastille', 4, 3, 2, 1, 3, 4.80, 'café crème', '2026-11-13T16:54:03Z'
where not exists (select 1 from public.cafes where name = 'L''hirondelle' and area = 'Bastille');
