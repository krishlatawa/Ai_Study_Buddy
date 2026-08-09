"use client";

import PropTypes from "prop-types";
import { useTheme } from "./ThemeProvider";

const themeOptions = [
  { id: "esports", label: "Esports", swatch: "#39FF88" },
  { id: "streetwear", label: "Streetwear", swatch: "#FF4D00" },
  { id: "kdrama", label: "K-Drama", swatch: "#FF6FD8" },
  { id: "courtside", label: "Courtside", swatch: "#FFD700" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-[color:var(--surface)] bg-[color:var(--surface)]/80 p-2">
      {themeOptions.map((option) => {
        const active = option.id === theme;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${active ? "ring-2 ring-[color:var(--accent-info)]" : "text-slate-300 hover:text-white"}`}
            style={{ backgroundColor: active ? "color-mix(in srgb, var(--accent-primary) 12%, transparent)" : "transparent" }}
            aria-label={`Switch to ${option.label} theme`}
          >
            <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: option.swatch }} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

ThemeSwitcher.propTypes = {
  className: PropTypes.string,
};
