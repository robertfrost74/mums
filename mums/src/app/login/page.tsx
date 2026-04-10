"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

const FOOD_EMOJIS = ["🍝", "🥘", "🍲", "🧁", "🥗", "🍕", "🍳", "🥐", "🍰", "🫕", "🥩", "🍜"];

function FloatingEmoji({ emoji, delay, duration, x }: { emoji: string; delay: number; duration: number; x: number }) {
  return (
    <span
      className="absolute text-4xl opacity-0 select-none pointer-events-none animate-[floatUp_var(--dur)_var(--delay)_infinite]"
      style={{
        left: `${x}%`,
        bottom: "-10%",
        "--delay": `${delay}s`,
        "--dur": `${duration}s`,
      } as React.CSSProperties}
    >
      {emoji}
    </span>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get("next") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Kolla din e-post för en återställningslänk!");
      }
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { family_name: familyName || "Min familj" },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Kolla din e-post för att bekräfta kontot!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }

    setLoading(false);
  };

  const inputCls = [
    "w-full rounded-xl border-0 bg-white/10 backdrop-blur-sm px-4 py-3.5 text-sm text-white placeholder-white/40",
    "outline-none ring-1 ring-white/20 transition-all duration-200",
    "focus:bg-white/15 focus:ring-2 focus:ring-amber-400/60",
  ].join(" ");

  const tabCls = (active: boolean) => [
    "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200",
    active
      ? "bg-white text-zinc-900 shadow-lg shadow-white/20"
      : "text-white/60 hover:text-white hover:bg-white/10",
  ].join(" ");

  return (
    <div className="flex min-h-dvh w-full">
      {/* Hero side – visible on lg+ */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-red-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.2),transparent_50%)]" />

        {/* Floating food emojis */}
        {FOOD_EMOJIS.map((emoji, i) => (
          <FloatingEmoji
            key={i}
            emoji={emoji}
            delay={i * 1.2}
            duration={8 + (i % 4) * 2}
            x={5 + (i * 8) % 90}
          />
        ))}

        <div
          className={[
            "relative z-10 max-w-md px-12 text-center transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
        >
          <Image
            src="/mums-logo-dark.svg"
            alt="Mums"
            width={360}
            height={90}
            priority
            className="mx-auto mb-8 h-28 w-auto drop-shadow-2xl"
          />
          <p className="text-2xl font-bold text-white/90 tracking-tight">
            Familjens receptsamling
          </p>
          <p className="mt-3 text-lg text-white/60">
            Samla, dela och laga tillsammans.
          </p>

          <div className="mt-12 flex justify-center gap-6 text-5xl">
            <span className="animate-bounce" style={{ animationDelay: "0s" }}>🍝</span>
            <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>🔥</span>
            <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>🍳</span>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center bg-zinc-950 px-6 py-12">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-orange-600/5 blur-3xl pointer-events-none" />

        <div
          className={[
            "relative z-10 w-full max-w-sm transition-all duration-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          {/* Mobile logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Image
              src="/mums-logo-dark.svg"
              alt="Mums"
              width={200}
              height={50}
              priority
              className="h-20 w-auto mb-3"
            />
            <p className="text-sm text-white/40">Familjens receptsamling</p>
          </div>

          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
            {mode === "reset"
              ? "Glömt lösenord?"
              : mode === "login"
                ? "Dags att mumsa"
                : "Kom igång"}
          </h1>
          <p className="mb-8 text-sm text-white/40">
            {mode === "reset"
              ? "Ange din e-post så skickar vi en återställningslänk"
              : mode === "login"
                ? "Logga in för att nå dina recept"
                : "Skapa ett konto och börja samla recept"}
          </p>

          {/* Tabs */}
          {mode !== "reset" && (
            <div className="mb-8 flex gap-1 rounded-xl bg-white/5 p-1">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                className={tabCls(mode === "login")}
              >
                Logga in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
                className={tabCls(mode === "signup")}
              >
                Skapa konto
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="familyName" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Familjenamn
                </label>
                <input
                  id="familyName"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="T.ex. Familjen Svensson"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@exempel.se"
                className={inputCls}
                autoComplete="email"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Lösenord
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken"
                  className={inputCls}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => { setMode("reset"); setError(null); setMessage(null); }}
                className="text-xs text-amber-400/70 transition hover:text-amber-400"
              >
                Glömt lösenord?
              </button>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={[
                "group relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide text-white",
                "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500",
                "shadow-lg shadow-orange-500/25 transition-all duration-200",
                "hover:shadow-xl hover:shadow-orange-500/30 hover:brightness-110",
                "active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-lg",
              ].join(" ")}
            >
              <span className="relative z-10">
                {loading
                  ? "Vänta…"
                  : mode === "reset"
                    ? "Skicka återställningslänk"
                    : mode === "login"
                      ? "Logga in"
                      : "Skapa konto"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                className="w-full text-center text-xs text-white/40 transition hover:text-white/60"
              >
                ← Tillbaka till inloggning
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-white/20">
            Mums — Laga mat med kärlek
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-zinc-950 text-sm text-white/40">Laddar…</div>}>
      <LoginForm />
    </Suspense>
  );
}
