"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FamilyInfo = {
  id: string;
  name: string;
  invite_code: string;
};

type MemberRow = {
  id: string;
  role: string;
  user_id: string;
};

export default function FamilyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: familyId } = await supabase.rpc("get_my_family_id");
      if (!familyId) { setLoading(false); return; }

      const [familyRes, membersRes] = await Promise.all([
        supabase.from("families").select("id, name, invite_code").eq("id", familyId).single(),
        supabase.from("family_members").select("id, role, user_id").eq("family_id", familyId),
      ]);

      if (familyRes.data) setFamily(familyRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      setLoading(false);
    })();
  }, [supabase]);

  const copyInviteLink = async () => {
    if (!family) return;
    const url = `${window.location.origin}/join/${family.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kopiera inbjudningslänken:", url);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600";
  const actionBtn =
    "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => router.push("/")} className={actionBtn}>
            ← Tillbaka
          </button>
          <Link href="/" className="inline-flex items-center">
            <Image src="/mums-logo.svg" alt="Mums" width={80} height={20} className="h-6 w-auto dark:hidden" />
            <Image src="/mums-logo-dark.svg" alt="Mums" width={80} height={20} className="hidden h-6 w-auto dark:block" />
          </Link>
          <div className="w-[80px]" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Min familj</h1>

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ) : !family ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Kunde inte hitta familjeinformation.</p>
        ) : (
          <div className="space-y-8">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Familjenamn</label>
              <input value={family.name} readOnly className={inputCls + " cursor-default bg-zinc-50 dark:bg-zinc-800"} />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="mb-1 text-sm font-semibold">Bjud in familjemedlemmar</h2>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                Dela länken nedan med den du vill bjuda in. De skapar ett konto och kopplas automatiskt till din familj.
              </p>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${family.invite_code}`}
                  className={inputCls + " flex-1 cursor-default select-all bg-white dark:bg-zinc-900"}
                />
                <button type="button" onClick={copyInviteLink} className={actionBtn + " flex-none"}>
                  {copied ? "Kopierad!" : "Kopiera"}
                </button>
              </div>

              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                Inbjudningskod: <code className="font-mono">{family.invite_code}</code>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold">Medlemmar ({members.length})</h2>
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="text-sm">
                      {m.user_id === userId ? "Du" : m.user_id.slice(0, 8) + "…"}
                    </span>
                    <span className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      m.role === "admin"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                    ].join(" ")}>
                      {m.role === "admin" ? "Admin" : "Medlem"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
