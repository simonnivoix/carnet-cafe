"use client";
import { useEffect, useState } from "react";
import { checkCode, saveCode, savedCode } from "@/lib/api";
import Carnet from "./Carnet";
import { Cup } from "./Cup";

export default function Home() {
  // undefined = on lit le localStorage, null = pas de code
  const [code, setCode] = useState<string | null | undefined>(undefined);
  useEffect(() => setCode(savedCode()), []);

  if (code === undefined) return null;
  if (!code) return <Gate onOk={(c) => (saveCode(c), setCode(c))} />;
  return <Carnet code={code} onBadCode={() => (saveCode(null), setCode(null))} />;
}

function Gate({ onOk }: { onOk: (code: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    if (!code) return;
    setPending(true);
    setError(null);
    const ok = await checkCode(code);
    setPending(false);
    if (ok) onOk(code);
    else setError(ok === false ? "Ce n'est pas le bon code." : "Impossible de vérifier le code. Vérifie ta connexion.");
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <Cup size={64} className="gate-cup" />
        <h1>Le Carnet Café</h1>
        <p className="tagline">Entre, installe-toi. Il ne manque que le code du groupe pour ouvrir le carnet.</p>
        <form onSubmit={submit} autoComplete="off">
          <label className="field-label" htmlFor="gate-code">Code du groupe</label>
          <input
            id="gate-code"
            type="text"
            name="code"
            placeholder="Le code que vous avez choisi"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Vérification…" : "Ouvrir le carnet"}
          </button>
          {error && <p className="gate-error" role="alert">{error}</p>}
        </form>
        <p className="status">À faire une seule fois par téléphone.</p>
      </div>
    </div>
  );
}
