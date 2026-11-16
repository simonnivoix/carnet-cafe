import { redirect } from "next/navigation";
import { admin, isAuthed } from "@/lib/server";
import { CAFE_COLUMNS, normalize } from "@/lib/crit";
import Carnet from "./Carnet";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await isAuthed())) redirect("/code");
  const { data, error } = await admin().from("cafes").select(CAFE_COLUMNS);
  return <Carnet initial={(data ?? []).map(normalize)} loadError={!!error} />;
}
