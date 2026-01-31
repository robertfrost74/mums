"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const base =
    "rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  const next = () => {
    const order = ["system", "light", "dark"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const label = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";

  return (
    <button type="button" onClick={next} className={base} aria-label="Toggle theme">
      🌗 {label}
    </button>
  );
}