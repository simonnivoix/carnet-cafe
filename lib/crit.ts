// Critères et coefficients (voir CLAUDE.md). La note globale est la moyenne pondérée des critères notés.
export const CRIT = [
  { k: "ambiance", label: "Ambiance", hint: "Le mood, la déco, la lumière", w: 2 },
  { k: "calme", label: "Calme", hint: "5 = silence de bibliothèque", w: 2 },
  { k: "prix", label: "Prix", hint: "5 = vraiment pas cher", w: 2 },
  { k: "wifi", label: "Wi-Fi", hint: "Débit et stabilité", w: 0.5 },
  { k: "prises", label: "Prises", hint: "Facile de recharger ?", w: 1 },
] as const;

export type CritKey = (typeof CRIT)[number]["k"];
export const CRIT_KEYS = CRIT.map((c) => c.k) as CritKey[];

export type Cafe = {
  id: string;
  name: string;
  area: string;
  ambiance: number | null;
  calme: number | null;
  prix: number | null;
  wifi: number | null;
  prises: number | null;
  price: number | null;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type CafePatch = Partial<Pick<Cafe, CritKey | "price" | "comment">>;

export const CAFE_COLUMNS = "id,name,area,ambiance,calme,prix,wifi,prises,price,comment,created_at,updated_at";

export function globalOf(c: Cafe): number | null {
  let sum = 0;
  let w = 0;
  for (const k of CRIT) {
    const v = c[k.k];
    if (v != null) {
      sum += v * k.w;
      w += k.w;
    }
  }
  return w ? sum / w : null;
}

// Postgres numeric arrive en chaîne : on normalise.
export function normalize(row: Record<string, unknown>): Cafe {
  const r = row as Cafe;
  return { ...r, price: r.price == null ? null : Number(r.price) };
}
