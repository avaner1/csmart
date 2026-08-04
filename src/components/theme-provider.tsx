"use client";

import { useEffect, useState } from "react";

interface AppTheme {
  accentColor: string;
  cardBackground: string;
  cardBorder: string;
  sidebarBackground: string;
  pageBackground: string;
  primaryText: string;
  secondaryText: string;
  cardBorderRadius: number;
  cardSpacing: string;
  sidebarWidth: string;
  fontSize: string;
  badgeStyle: string;
  animationsEnabled: boolean;
  showUrgencyColors: boolean;
}

const SPACING_SCALE: Record<string, string> = {
  compact: "0.85",
  comfortable: "1",
  spacious: "1.2",
};

const FONT_SCALE: Record<string, string> = {
  small: "0.9",
  medium: "1",
  large: "1.1",
};

const SIDEBAR_WIDTH: Record<string, string> = {
  narrow: "200px",
  default: "240px",
  wide: "280px",
};

const SIDEBAR_COLLAPSED: Record<string, string> = {
  narrow: "56px",
  default: "72px",
  wide: "80px",
};

const BADGE_RADIUS: Record<string, string> = {
  pill: "9999px",
  "rounded square": "6px",
  square: "2px",
};

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.style.setProperty("--accent-color", theme.accentColor);
  root.style.setProperty("--card-bg", theme.cardBackground);
  root.style.setProperty("--card-border", theme.cardBorder);
  root.style.setProperty("--sidebar-bg", theme.sidebarBackground);
  root.style.setProperty("--page-bg", theme.pageBackground);
  root.style.setProperty("--text-primary", theme.primaryText);
  root.style.setProperty("--text-secondary", theme.secondaryText);
  root.style.setProperty("--card-radius", `${theme.cardBorderRadius}px`);
  root.style.setProperty("--container-radius", `${theme.cardBorderRadius + 4}px`);
  root.style.setProperty("--font-scale", FONT_SCALE[theme.fontSize] ?? "1");
  root.style.setProperty("--spacing-scale", SPACING_SCALE[theme.cardSpacing] ?? "1");
  root.style.setProperty("--sidebar-width", SIDEBAR_WIDTH[theme.sidebarWidth] ?? "240px");
  root.style.setProperty("--sidebar-collapsed-width", SIDEBAR_COLLAPSED[theme.sidebarWidth] ?? "72px");
  root.style.setProperty("--badge-radius", BADGE_RADIUS[theme.badgeStyle] ?? "9999px");

  root.setAttribute("data-spacing", theme.cardSpacing);
  if (!theme.animationsEnabled) {
    root.setAttribute("data-no-animations", "true");
  } else {
    root.removeAttribute("data-no-animations");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("csmart_theme");
    if (cached) {
      try {
        applyTheme(JSON.parse(cached));
      } catch {}
    }

    fetch("/api/theme")
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) {
          applyTheme(data.theme);
          localStorage.setItem("csmart_theme", JSON.stringify(data.theme));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
