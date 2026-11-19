"use client";
// Mise à jour automatique : si /version.json annonce un autre build que celui qui tourne, on recharge la page.
const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export async function checkUpdate() {
  if (BUILD === "dev" || !navigator.onLine) return;
  try {
    const r = await fetch(`${BASE}/version.json?_=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return;
    const { build } = (await r.json()) as { build?: string };
    if (!build || build === BUILD) return;
    // Garde-fou : un seul rechargement par version, pour ne jamais boucler.
    if (sessionStorage.getItem("carnet-vseen") === build) return;
    sessionStorage.setItem("carnet-vseen", build);
    const u = new URL(location.href);
    u.searchParams.set("v", build);
    location.replace(u.toString());
  } catch {
    /* hors-ligne ou réseau capricieux : on garde la version actuelle */
  }
}

export function watchUpdates() {
  checkUpdate();
  const onVis = () => document.visibilityState === "visible" && checkUpdate();
  document.addEventListener("visibilitychange", onVis);
  return () => document.removeEventListener("visibilitychange", onVis);
}
