import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const COOKIE = "carnet_session";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

// Client Supabase avec la clé secrète : contourne la RLS, à n'utiliser qu'après isAuthed().
export function admin() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const normCode = (s: string) => s.trim().toLowerCase();

// Jeton de session dérivé du code : changer GROUP_CODE déconnecte tout le monde.
export function sessionToken(): string {
  return createHmac("sha256", env("SUPABASE_SECRET_KEY")).update("carnet:" + normCode(env("GROUP_CODE"))).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function codeMatches(input: string): boolean {
  return safeEqual(normCode(input), normCode(env("GROUP_CODE")));
}

export async function isAuthed(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value;
  return !!v && safeEqual(v, sessionToken());
}
