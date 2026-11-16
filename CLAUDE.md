# Le Carnet Café

Carnet perso pour **3 amis** qui vont bosser, étudier et parler de projets dans des cafés, et qui en testent plein pour trouver les meilleurs.

## Principe clé
- **Une seule note par café, décidée ensemble** (note de groupe), pas des notes individuelles moyennées.
- Les 3 ouvrent la page en même temps sur leurs téléphones ; un clic sur une note s'affiche en direct chez les autres.
- Pas de compteur d'avis, pas de noms/avatars par note : inutile pour ce groupe.

## Critères et coefficients
Notes de 1 à 5. Note globale = moyenne pondérée des critères notés (un critère vide est ignoré).

| Critère  | Clé        | Coef | Sens            |
|----------|------------|------|-----------------|
| Ambiance | `ambiance` | 2    | mood, déco      |
| Calme    | `calme`    | 2    | 5 = très calme  |
| Prix     | `prix`     | 2    | 5 = pas cher    |
| Prises   | `prises`   | 1    |                 |
| Wi-Fi    | `wifi`     | 0,5  |                 |

Critères retirés à la demande : « Le café » (qualité de la boisson) et le tri « Nb d'avis ».
Les critères et poids sont définis dans `CRIT` (`lib/crit.ts` pour le site, `artifact/index.html` pour l'Artifact), champ `w`.

## Vrai site (en cours) : Next.js + Supabase + Vercel
- Dépôt privé GitHub `simonnivoix/carnet-cafe`. Next.js 16 (App Router), sans Tailwind : le CSS de l'Artifact est repris dans `app/globals.css`.
- `lib/crit.ts` : critères, poids (`CRIT`), type `Cafe`, `globalOf`.
- `app/Carnet.tsx` : l'interface (client). Mises à jour optimistes, temps réel Supabase, rechargement au retour sur l'onglet.
- `app/actions.ts` : actions serveur (connexion, ajout, modif, suppression). **Toutes les écritures passent par là**, après vérification du cookie de groupe, avec la clé secrète.
- `lib/server.ts` : client admin + cookie de session (HMAC du `GROUP_CODE`, changer le code déconnecte tout le monde). Next 16 : pas de `proxy.ts`, la vérification est faite dans les pages et les actions.
- `app/code/` : page de saisie du code de groupe.
- Supabase : `supabase/migrations/` (table `cafes`, une colonne par critère, `price` en €, `comment`), `supabase/seed.sql` (reprise de L'hirondelle).
  - RLS : lecture ouverte à la clé publique (nécessaire au temps réel), aucune écriture possible sans la clé secrète.
- Variables : voir `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GROUP_CODE`).

## Ancienne version : Artifact claude.ai
- `artifact/index.html` : toute l'app (HTML + CSS + JS, sans build). Publiée comme Artifact claude.ai :
  https://claude.ai/artifact/Ag7kSoFt5NeLn6nM3sGJVu
  - Pour mettre à jour : republier ce même fichier avec l'outil Artifact (garde l'URL).
  - Le fichier n'a pas de `<!doctype>`/`<html>`/`<body>` : le squelette est ajouté à la publication.
- Données Artifact db : collection `cafes`, `{ name, area, scores: { ambiance, calme, prix, wifi, prises }, price, comment, createdAt, updatedAt }`.
  Règle d'accès : lecture `view`, écriture `interact` (Contributeur). Hors claude.ai : mode local (`localStorage`, clé `carnet-cafe-v2`).

## Design
- Vert « façade de café » + laiton, thèmes clair et sombre via tokens CSS sur `:root`.
- Polices : Bricolage Grotesque (titres), Inter (texte), JetBrains Mono (chiffres).
- Interface en **français**, tutoiement.
