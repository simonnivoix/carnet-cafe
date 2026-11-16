import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/server";
import CodeForm from "./CodeForm";

export const dynamic = "force-dynamic";

export default async function CodePage() {
  if (await isAuthed()) redirect("/");
  return (
    <div className="gate">
      <header>
        <div className="wrap">
          <div>
            <h1>Le Carnet Café</h1>
            <p className="tagline">Le carnet de notes de nos cafés. Entre le code du groupe pour l&apos;ouvrir.</p>
          </div>
        </div>
      </header>
      <div className="gate-card">
        <h2>Code du groupe</h2>
        <CodeForm />
        <p className="status">À faire une seule fois par téléphone.</p>
      </div>
    </div>
  );
}
