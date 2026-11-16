"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { admin, codeMatches, COOKIE, isAuthed, sessionToken } from "@/lib/server";
import { CAFE_COLUMNS, CRIT_KEYS, normalize, type Cafe, type CafePatch } from "@/lib/crit";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const DENIED = "Code de groupe expiré : recharge la page et entre le code.";
const FAILED = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const code = String(form.get("code") ?? "");
  if (!codeMatches(code)) {
    await new Promise((r) => setTimeout(r, 800)); // freine les essais en rafale
    return "Ce n'est pas le bon code.";
  }
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function addCafe(name: string, area: string): Promise<Result<Cafe>> {
  if (!(await isAuthed())) return { ok: false, error: DENIED };
  const n = String(name).trim().slice(0, 80);
  if (!n) return { ok: false, error: "Il faut un nom de café." };
  const { data, error } = await admin()
    .from("cafes")
    .insert({ name: n, area: String(area ?? "").trim().slice(0, 60) })
    .select(CAFE_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: FAILED };
  return { ok: true, data: normalize(data) };
}

function cleanPatch(p: CafePatch): CafePatch | null {
  const out: Record<string, unknown> = {};
  for (const k of CRIT_KEYS) {
    if (!(k in p)) continue;
    const v = p[k];
    if (v === null) out[k] = null;
    else if (Number.isInteger(v) && v! >= 1 && v! <= 5) out[k] = v;
    else return null;
  }
  if ("price" in p) {
    const v = p.price;
    if (v === null) out.price = null;
    else if (typeof v === "number" && v > 0 && v <= 30) out.price = Math.round(v * 100) / 100;
    else return null;
  }
  if ("comment" in p) out.comment = String(p.comment ?? "").trim().slice(0, 400);
  return Object.keys(out).length ? (out as CafePatch) : null;
}

export async function updateCafe(id: string, patch: CafePatch): Promise<Result<Cafe>> {
  if (!(await isAuthed())) return { ok: false, error: DENIED };
  const clean = cleanPatch(patch);
  if (!clean) return { ok: false, error: FAILED };
  const { data, error } = await admin().from("cafes").update(clean).eq("id", id).select(CAFE_COLUMNS).single();
  if (error || !data) return { ok: false, error: FAILED };
  return { ok: true, data: normalize(data) };
}

export async function deleteCafe(id: string): Promise<Result<null>> {
  if (!(await isAuthed())) return { ok: false, error: DENIED };
  const { error } = await admin().from("cafes").delete().eq("id", id);
  if (error) return { ok: false, error: FAILED };
  return { ok: true, data: null };
}
