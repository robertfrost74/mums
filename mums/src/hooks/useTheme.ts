"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "mums_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const shouldDark = theme === "dark" || (theme === "system" && systemDark);

  root.classList.toggle("dark", shouldDark);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    applyTheme(theme);
    localStorage.setItem(KEY, theme);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme, ready]);

  return { theme, setTheme, ready };
}