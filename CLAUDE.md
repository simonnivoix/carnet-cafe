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

## Vrai site : Next.js statique + Supabase, publié sur GitHub Pages
- Adresse : https://simonnivoix.github.io/carnet-cafe/ (à partager aux amis). Code de groupe : demandé une fois par téléphone, gardé en `localStorage` (`carnet-code`).
- Dépôt **public** GitHub `simonnivoix/carnet-cafe` (obligatoire pour Pages gratuit) : ne jamais y mettre de secret.
  Chaque push sur `main` reconstruit et publie le site (`.github/workflows/pages.yml`, `next build` → `out/`).
- Next.js 16 en export statique (`next.config.ts` : `output: "export"`, `basePath: "/carnet-cafe"` en prod). Pas de serveur, pas d'actions serveur. Sans Tailwind : CSS de l'Artifact dans `app/globals.css`.
- `lib/crit.ts` : critères, poids (`CRIT`), type `Cafe`, `globalOf`.
- `app/page.tsx` : écran du code de groupe, puis `app/Carnet.tsx` (interface : mises à jour optimistes, temps réel Supabase, rechargement au retour sur l'onglet).
- `lib/api.ts` : écritures via fonctions Postgres (`add_cafe`, `update_cafe`, `delete_cafe`, `check_code`) qui exigent le code.
- Supabase : projet `carnet-cafe` (ref `sggyjbyvaydkainkhikp`, Paris), CLI liée au dossier.
  - `supabase/migrations/` : table `cafes` (une colonne par critère, `price` en €, `comment`) + fonctions du code de groupe. Appliquer avec `supabase db push`.
  - Code de groupe haché (bcrypt) dans `private.group_code`, jamais dans le dépôt. Le changer :
    `supabase db query --linked "select private.set_group_code('nouveau code');"`
  - RLS : lecture ouverte à la clé publique (temps réel) ; aucune écriture directe, seulement via les fonctions.
- `.env.production` (commité, valeurs publiques) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env.db.local` (non commité) : mot de passe de la base.

## Ancienne version : Artifact claude.ai
- `artifact/index.html` : toute l'app (HTML + CSS + JS, sans build). Publiée comme Artifact claude.ai :
  https://claude.ai/artifact/Ag7kSoFt5NeLn6nM3sGJVu
  - Pour mettre à jour : republier ce même fichier avec l'outil Artifact (garde l'URL).
  - Le fichier n'a pas de `<!doctype>`/`<html>`/`<body>` : le squelette est ajouté à la publication.
- Données Artifact db : collection `cafes`, `{ name, area, scores: { ambiance, calme, prix, wifi, prises }, price, comment, createdAt, updatedAt }`.
  Règle d'accès : lecture `view`, écriture `interact` (Contributeur). Hors claude.ai : mode local (`localStorage`, clé `carnet-cafe-v2`).

## Design (refait le 19/11 : ambiance « café du coin »)
- Chaleureux, reposant et un peu pétillant : fond crème (mousse de lait), encre espresso, accent cannelle `--accent`, miel `--honey` ; thème sombre « le soir » (bois torréfié, lampe ambrée). Tokens CSS sur `:root` dans `app/globals.css`.
- Grain de papier (`body::before`) + lumière de lampe sur un calque fixe (`body::after`, car iOS ignore `background-attachment: fixed`).
- Polices : Fraunces (titres et chiffres, axes SOFT/WONK) et Figtree (texte), via `next/font/google` dans `app/layout.tsx`.
- `app/Cup.tsx` : tasse qui fume (`Cup`), trace de tasse derrière la note de la fiche (`Ring`), étoile du « coup de cœur » (`Star`, 1er du classement en tri « Note globale »), `greeting()` (Bonjour / Bon après-midi / Bonsoir).
- Mouvement : lignes du classement qui arrivent en cascade, note qui rebondit + onde dorée au clic (`.dot.on`), chiffre de la note qui remonte, appui à 0,97 ; fondu simple en mouvement réduit.
- Sur téléphone (< 520 px), les notes 1-5 passent sous le critère en gros boutons.
- Interface en **français**, tutoiement.
