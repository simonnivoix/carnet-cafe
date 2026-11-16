"use client";
import { browserClient } from "./browser";
import { normalize, type Cafe, type CafePatch } from "./crit";

// Écritures : fonctions Postgres qui vérifient le code de groupe (voir supabase/migrations).
export type Result<T> = { ok: true; data: T } | { ok: false; error: string; badCode?: boolean };

const CODE_KEY = "carnet-code";
const FAILED = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";

export function savedCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}
export function saveCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {}
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<Result<T>> {
  try {
    const { data, error } = await browserClient().rpc(fn, args);
    if (error) {
      if (error.code === "28000") return { ok: false, error: "Le code du groupe a changé : entre le nouveau code.", badCode: true };
      return { ok: false, error: FAILED };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: FAILED };
  }
}

export async function checkCode(code: string): Promise<boolean | null> {
  const r = await rpc<boolean>("check_code", { p_code: code });
  return r.ok ? r.data : null;
}

export async function addCafe(code: string, name: string, area: string): Promise<Result<Cafe>> {
  const r = await rpc<Record<string, unknown>>("add_cafe", { p_code: code, p_name: name, p_area: area });
  return r.ok ? { ok: true, data: normalize(r.data) } : r;
}

export async function updateCafe(code: string, id: string, patch: CafePatch): Promise<Result<Cafe | null>> {
  const r = await rpc<Record<string, unknown> | null>("update_cafe", { p_code: code, p_id: id, p_patch: patch });
  if (!r.ok) return r;
  // café supprimé entre-temps : la fonction renvoie une ligne vide
  return { ok: true, data: r.data && r.data.id ? normalize(r.data) : null };
}

export async function deleteCafe(code: string, id: string): Promise<Result<null>> {
  const r = await rpc<null>("delete_cafe", { p_code: code, p_id: id });
  return r.ok ? { ok: true, data: null } : r;
}
