"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function JoinFamilyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [familyName, setFamilyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/login?next=/join/${code}`);
        setLoading(false);
        return;
      }

      const { data: family } = await supabase
        .from("families")
        .select("id, name")
        .eq("invite_code", code)
        .single();

      if (!family) {
        setError("Ogiltig inbjudningskod.");
        setLoading(false);
        return;
      }

      setFamilyName(family.name);

      const { data: existing } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("family_id", family.id)
        .maybeSingle();

      if (existing) {
        setAlreadyMember(true);
      }

      setLoading(false);
    })();
  }, [supabase, code, router]);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      const { data: family } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", code)
        .single();

      if (!family) throw new Error("Ogiltig inbjudningskod");

      const { error: insertErr } = await supabase
        .from("family_members")
        .insert({ user_id: user.id, family_id: family.id, role: "member" });

      if (insertErr) {
        if (insertErr.code === "23505") {
          setAlreadyMember(true);
        } else {
          throw insertErr;
        }
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte gå med");
      setJoining(false);
    }
  };

  const btnPrimary =
    "w-full rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";
  const btnSecondary =
    "w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <Link href="/" className="contents">
            <Image src="/mums-logo.svg" alt="Mums" width={160} height={40} priority className="h-10 w-auto dark:hidden" />
            <Image src="/mums-logo-dark.svg" alt="Mums" width={160} height={40} priority className="hidden h-10 w-auto dark:block" />
          </Link>
        </div>

        {loading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ) : error && !familyName ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button type="button" onClick={() => router.push("/")} className={btnSecondary}>
              Gå till startsidan
            </button>
          </div>
        ) : alreadyMember ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Du är redan medlem i <strong>{familyName}</strong>.
            </p>
            <button type="button" onClick={() => router.push("/")} className={btnPrimary}>
              Gå till recepten
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Du har blivit inbjuden till
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{familyName}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Gå med för att dela och se familjens recept.
            </p>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
                {error}
              </div>
            )}

            <button type="button" onClick={handleJoin} disabled={joining} className={btnPrimary}>
              {joining ? "Går med…" : "Gå med i familjen"}
            </button>
            <button type="button" onClick={() => router.push("/")} className={btnSecondary}>
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
