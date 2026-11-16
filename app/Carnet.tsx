"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/browser";
import { CAFE_COLUMNS, CRIT, globalOf, normalize, type Cafe, type CafePatch, type CritKey } from "@/lib/crit";
import { addCafe, deleteCafe, updateCafe } from "./actions";

type SortKey = "global" | CritKey;

const fmt = (n: number | null | undefined, d = 1) => (n == null ? "–" : n.toFixed(d).replace(".", ","));
const cls = (n: number | null) => (n == null ? "s-none" : n >= 4 ? "s-good" : n >= 3 ? "s-mid" : "s-low");

function ago(iso: string | null) {
  if (!iso) return "";
  const t = Date.parse(iso);
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function Carnet({ initial, loadError }: { initial: Cafe[]; loadError: boolean }) {
  const [cafes, setCafes] = useState<Cafe[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("global");
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState(loadError ? "Impossible de lire le carnet pour le moment." : "");
  const [adding, setAdding] = useState(false);
  const [, setTick] = useState(0);
  const ficheRef = useRef<HTMLElement>(null);

  // Écritures en attente par café : on ignore les échos temps réel tant qu'elles ne sont pas finies.
  const pending = useRef<Record<string, number>>({});
  const chains = useRef<Record<string, Promise<unknown>>>({});

  const refetch = useCallback(async () => {
    const { data, error } = await browserClient().from("cafes").select(CAFE_COLUMNS);
    if (error || !data) return;
    const fresh = data.map(normalize);
    setCafes((prev) =>
      fresh.map((row) => (pending.current[row.id] ? prev.find((p) => p.id === row.id) ?? row : row)),
    );
    setNotice((n) => (n.startsWith("Impossible de lire") ? "" : n));
  }, []);

  useEffect(() => {
    const sb = browserClient();
    const ch = sb
      .channel("cafes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "cafes" }, (p) => {
        if (p.eventType === "DELETE") {
          const id = (p.old as { id?: string }).id;
          if (id) setCafes((prev) => prev.filter((c) => c.id !== id));
          return;
        }
        const row = normalize(p.new);
        if (pending.current[row.id]) return;
        setCafes((prev) => (prev.some((c) => c.id === row.id) ? prev.map((c) => (c.id === row.id ? row : c)) : [...prev, row]));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive(true);
          refetch(); // rattrape ce qui a changé pendant la (re)connexion
        } else setLive(false);
      });
    const onVis = () => document.visibilityState === "visible" && refetch();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
      sb.removeChannel(ch);
    };
  }, [refetch]);

  // Si un café sélectionné est supprimé par quelqu'un d'autre
  useEffect(() => {
    if (selected && !cafes.some((c) => c.id === selected)) setSelected(null);
  }, [cafes, selected]);

  function patch(id: string, p: CafePatch) {
    setCafes((prev) => prev.map((c) => (c.id === id ? { ...c, ...p, updated_at: new Date().toISOString() } : c)));
    pending.current[id] = (pending.current[id] ?? 0) + 1;
    chains.current[id] = (chains.current[id] ?? Promise.resolve()).then(async () => {
      let res: Awaited<ReturnType<typeof updateCafe>>;
      try {
        res = await updateCafe(id, p);
      } catch {
        res = { ok: false, error: "Impossible d'enregistrer pour le moment. Réessaie dans un instant." };
      }
      pending.current[id]--;
      if (!res.ok) setNotice(res.error);
      if (pending.current[id] === 0) {
        delete pending.current[id];
        if (res.ok) setCafes((prev) => prev.map((c) => (c.id === id ? res.data : c)));
        else refetch();
      }
    });
  }

  function select(id: string) {
    setSelected(id);
    if (window.matchMedia("(max-width: 860px)").matches) {
      requestAnimationFrame(() => ficheRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim().slice(0, 80);
    const area = String(f.get("area") ?? "").trim().slice(0, 60);
    if (!name) return;
    e.currentTarget.reset();
    setAdding(false);
    const dup = cafes.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.area.toLowerCase() === area.toLowerCase());
    if (dup) return select(dup.id);
    const res = await addCafe(name, area).catch(() => null);
    if (!res || !res.ok) return setNotice(res?.error ?? "Impossible d'enregistrer pour le moment.");
    setCafes((prev) => (prev.some((c) => c.id === res.data.id) ? prev : [...prev, res.data]));
    select(res.data.id);
  }

  async function onDelete(c: Cafe) {
    const res = await deleteCafe(c.id).catch(() => null);
    if (!res || !res.ok) return setNotice(res?.error ?? "Impossible de supprimer pour le moment.");
    setCafes((prev) => prev.filter((x) => x.id !== c.id));
    setSelected(null);
  }

  /* ---------- classement ---------- */
  const rated = cafes.map(globalOf).filter((v): v is number => v != null);
  const key = (c: Cafe) => (sort === "global" ? globalOf(c) : c[sort]);
  const rows = [...cafes].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka == null && kb == null) return Date.parse(b.created_at) - Date.parse(a.created_at);
    if (ka == null) return 1;
    if (kb == null) return -1;
    return kb - ka || (globalOf(b) ?? 0) - (globalOf(a) ?? 0);
  });
  const sub = sort === "global" ? "/5" : CRIT.find((x) => x.k === sort)!.label.toLowerCase();
  const current = cafes.find((c) => c.id === selected) ?? null;

  return (
    <>
      <header>
        <div className="wrap">
          <div>
            <h1>Le Carnet Café</h1>
            <p className="tagline">
              On teste des cafés à trois et on note ensemble : ambiance, calme, prix, wifi, prises. Le classement garde les meilleurs.
            </p>
          </div>
          <div className="hstats" aria-label="Résumé">
            <div><b>{rated.length}</b><span>cafés testés</span></div>
            <div><b>{rated.length ? fmt(Math.max(...rated)) : "–"}</b><span>meilleure note</span></div>
          </div>
        </div>
      </header>

      {notice && (
        <div className="wrap">
          <p className="notice" role="status">{notice}</p>
        </div>
      )}

      <main className="wrap">
        <section aria-labelledby="list-title">
          <div className="toolbar">
            <p className="label" id="list-title">Classement</p>
            <button className="btn btn-primary" type="button" onClick={() => setAdding((a) => !a)}>
              + Ajouter un café
            </button>
          </div>
          {adding && (
            <form className="addform" autoComplete="off" onSubmit={onAdd}>
              <input type="text" name="name" placeholder="Nom du café" maxLength={80} required aria-label="Nom du café" autoFocus />
              <input type="text" name="area" placeholder="Quartier / ville" maxLength={60} aria-label="Quartier ou ville" />
              <button className="btn btn-primary" type="submit">Ajouter</button>
            </form>
          )}
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Trier par">
              {[{ k: "global" as SortKey, label: "Note globale" }, ...CRIT].map((o) => (
                <button key={o.k} className="chip" type="button" aria-pressed={sort === o.k} onClick={() => setSort(o.k)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="list">
            {!cafes.length ? (
              <div className="empty">
                <strong>Aucun café dans le carnet</strong>
                Ajoutez le café où vous êtes, puis notez-le ensemble.
              </div>
            ) : (
              rows.map((c, i) => {
                const v = key(c);
                const meta = [c.area, c.price != null ? `${fmt(c.price, 2)} €` : null].filter(Boolean).join(" · ");
                return (
                  <button key={c.id} className="row" type="button" aria-current={selected === c.id} onClick={() => select(c.id)}>
                    <span className="rank">{v == null ? "·" : i + 1}</span>
                    <div>
                      <p className="row-name">{c.name}</p>
                      <div className="row-meta">{meta || (v == null ? "Pas encore noté" : "")}</div>
                      <div className="minibars" aria-hidden="true">
                        {CRIT.map((k) => (
                          <span key={k.k} className="mb" title={`${k.label} : ${fmt(c[k.k], 0)}`}>
                            <i style={{ width: `${c[k.k] ? (c[k.k]! / 5) * 100 : 0}%` }} />
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`score ${cls(v)}`}>
                      {fmt(v)}
                      <small>{sub}</small>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className="fiche" ref={ficheRef}>
          {current ? (
            <Fiche key={current.id} c={current} live={live} onPatch={(p) => patch(current.id, p)} onDelete={() => onDelete(current)} />
          ) : (
            <>
              <p className="label">La fiche</p>
              <h2>{cafes.length ? "Choisis un café" : "Votre premier café"}</h2>
              <p className="status">
                {cafes.length
                  ? "Ouvre un café du classement pour voir sa note ou la remplir ensemble."
                  : "Ajoutez le café où vous êtes. Chacun ouvre la page sur son téléphone, et ce que l'un note s'affiche chez les deux autres."}
              </p>
            </>
          )}
        </aside>
      </main>
    </>
  );
}

/* ---------- fiche : la note commune ---------- */
function Fiche({ c, live, onPatch, onDelete }: { c: Cafe; live: boolean; onPatch: (p: CafePatch) => void; onDelete: () => void }) {
  const g = globalOf(c);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <>
      <div className="fiche-head">
        <div>
          <p className="label">{c.area || "Café"}</p>
          <h2>{c.name}</h2>
          <span className={"live" + (live ? "" : " off")}>
            {live ? `Note commune · modifiée ${ago(c.updated_at)}` : "Reconnexion…"}
          </span>
        </div>
        <div className={`big ${cls(g)}`}>
          {fmt(g)}
          <small>/5</small>
          <div className="status" style={{ font: "500 11px var(--f-body)", marginTop: 6 }}>moyenne pondérée</div>
        </div>
      </div>

      <div className="rate">
        {CRIT.map((k) => {
          const cur = c[k.k];
          return (
            <div className="rline" key={k.k}>
              <span className="name">
                {k.label}
                <span className="coef">coef {String(k.w).replace(".", ",")}</span>
              </span>
              <div className="dots" role="group" aria-label={k.label}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={"dot" + (cur === n ? " on" : cur && n < cur ? " under" : "")}
                    aria-pressed={cur === n}
                    aria-label={`${k.label} ${n} sur 5`}
                    onClick={() => onPatch({ [k.k]: cur === n ? null : n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="hint">{k.hint}</span>
            </div>
          );
        })}

        <div className="frow">
          <div className="field">
            <label htmlFor="f-price">Prix d&apos;une boisson (€)</label>
            <SyncedInput
              id="f-price"
              value={c.price != null ? String(c.price) : ""}
              onCommit={(s) => {
                const v = parseFloat(s.replace(",", "."));
                onPatch({ price: isFinite(v) && v > 0 && v <= 30 ? Math.round(v * 100) / 100 : null });
              }}
              inputMode="decimal"
              placeholder="3,50"
            />
          </div>
          <div className="field">
            <label htmlFor="f-comment">Notre avis</label>
            <SyncedInput
              id="f-comment"
              multiline
              value={c.comment}
              onCommit={(s) => onPatch({ comment: s.trim().slice(0, 400) })}
              placeholder="Top pour bosser le matin, blindé à midi, tables trop petites pour 3…"
            />
          </div>
        </div>
      </div>

      <div className="foot">
        <span className="status">Chaque clic est enregistré tout de suite. Re-cliquer une note l&apos;efface.</span>
        <button className="btn btn-danger" type="button" onClick={() => (armed ? onDelete() : setArmed(true))}>
          {armed ? `Sûr ? Retirer « ${c.name} »` : "Retirer ce café"}
        </button>
      </div>
    </>
  );
}

/* Champ texte qui garde la saisie en cours et suit les changements des autres quand il n'a pas le focus. */
function SyncedInput({
  id,
  value,
  onCommit,
  multiline,
  placeholder,
  inputMode,
}: {
  id: string;
  value: string;
  onCommit: (s: string) => void;
  multiline?: boolean;
  placeholder?: string;
  inputMode?: "decimal";
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  const props = {
    id,
    value: draft,
    placeholder,
    onFocus: () => (focused.current = true),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: () => {
      focused.current = false;
      if (draft !== value) onCommit(draft);
    },
  };
  return multiline ? (
    <textarea {...props} maxLength={400} />
  ) : (
    <input {...props} type="text" inputMode={inputMode} maxLength={6} />
  );
}
