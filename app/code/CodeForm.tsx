"use client";
import { useActionState } from "react";
import { login } from "../actions";

export default function CodeForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} autoComplete="off">
      <input
        type="text"
        name="code"
        aria-label="Code du groupe"
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
  );
}
