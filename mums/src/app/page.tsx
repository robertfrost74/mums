import { Suspense } from "react";
import ClientHome from "./ClientHome";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-500">Laddar…</div>}>
      <ClientHome />
    </Suspense>
  );
}