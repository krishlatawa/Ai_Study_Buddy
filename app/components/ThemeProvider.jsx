"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const THEME_STORAGE_KEY = "ai-study-buddy-theme";
const DEFAULT_THEME = "esports";

const themeTokens = {
  esports: {
    bg: "#0B0F14",
    surface: "#131A22",
    accentPrimary: "#39FF88",
    accentSecondary: "#7B5CFF",
    accentAlert: "#FF3D71",
    accentInfo: "#00E5FF",
    fontFamily: "var(--font-space-grotesk), sans-serif",
    bodyFont: "var(--font-inter), sans-serif",
    label: "Esports",
  },
  streetwear: {
    bg: "#0B0F14",
    surface: "#17181B",
    accentPrimary: "#FF4D00",
    accentSecondary: "#FFFFFF",
    accentAlert: "#E8102B",
    accentInfo: "#FFD400",
    fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
    bodyFont: "var(--font-inter), sans-serif",
    label: "Streetwear",
  },
  kdrama: {
    bg: "#0F0B14",
    surface: "#1B1522",
    accentPrimary: "#FF6FD8",
    accentSecondary: "#B892FF",
    accentAlert: "#FF4D6D",
    accentInfo: "#7FE7DC",
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
    bodyFont: "var(--font-inter), sans-serif",
    label: "K-Drama",
  },
  courtside: {
    bg: "#0B0F14",
    surface: "#161512",
    accentPrimary: "#FF8A00",
    accentSecondary: "#FFD700",
    accentAlert: "#E8102B",
    accentInfo: "#29B6F6",
    fontFamily: "'Arial Black', Impact, sans-serif",
    bodyFont: "var(--font-inter), sans-serif",
    label: "Courtside",
  },
};

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Start with default theme on server to avoid hydration mismatch.
  // localStorage is only safe to read after the client hydrates.
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // After hydration, read the saved theme from localStorage and apply it.
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && themeTokens[savedTheme]) {
      setTheme(savedTheme);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
    }
  }, []);

  // Apply theme CSS variables whenever the theme changes.
  useEffect(() => {
    const root = window.document.documentElement;
    const tokens = themeTokens[theme];

    // This is the core theme-switching pattern: the app writes CSS custom properties
    // onto the root element, and every component reads those variables through Tailwind.
    root.style.setProperty("--background", tokens.bg);
    root.style.setProperty("--foreground", "#F8FAFC");
    root.style.setProperty("--bg", tokens.bg);
    root.style.setProperty("--surface", tokens.surface);
    root.style.setProperty("--accent-primary", tokens.accentPrimary);
    root.style.setProperty("--accent-secondary", tokens.accentSecondary);
    root.style.setProperty("--accent-alert", tokens.accentAlert);
    root.style.setProperty("--accent-info", tokens.accentInfo);
    root.style.setProperty("--xp-green", tokens.accentPrimary);
    root.style.setProperty("--combo-purple", tokens.accentSecondary);
    root.style.setProperty("--streak-pink", tokens.accentAlert);
    root.style.setProperty("--focus-cyan", tokens.accentInfo);
    root.style.setProperty("--theme-font-display", tokens.fontFamily);
    root.style.setProperty("--theme-font-body", tokens.bodyFont);

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useTheme() {
  return useContext(ThemeContext);
}
