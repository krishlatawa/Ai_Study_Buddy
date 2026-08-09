"use client";

import PropTypes from "prop-types";
import {
  Sparkles,
  Trophy,
  Flame,
  Compass,
  MessageCircleMore,
  Brain,
  Target,
  Zap,
  TimerReset,
  BadgeCheck,
} from "lucide-react";

const VARIANT_STYLES = {
  green: {
    color: "#39FF88",
    border: "rgba(57, 255, 136, 0.35)",
    glow: "rgba(57, 255, 136, 0.35)",
  },
  purple: {
    color: "#7B5CFF",
    border: "rgba(123, 92, 255, 0.35)",
    glow: "rgba(123, 92, 255, 0.35)",
  },
  pink: {
    color: "#FF3D71",
    border: "rgba(255, 61, 113, 0.35)",
    glow: "rgba(255, 61, 113, 0.35)",
  },
  cyan: {
    color: "#00E5FF",
    border: "rgba(0, 229, 255, 0.35)",
    glow: "rgba(0, 229, 255, 0.35)",
  },
};

const ICON_MAP = {
  streak: Flame,
  xp: Sparkles,
  focus: Target,
  chat: MessageCircleMore,
  brain: Brain,
  trophy: Trophy,
  zap: Zap,
  timer: TimerReset,
  badge: BadgeCheck,
  compass: Compass,
};

export default function Icon({ name = "xp", variant = "green", className = "" }) {
  const IconComponent = ICON_MAP[name] || Sparkles;
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.green;

  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-[#0B0F14] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_18px_var(--glow)] ${className}`}
      style={{
        color: style.color,
        borderColor: style.border,
        boxShadow: `0 0 0 1px ${style.border}, 0 0 14px ${style.glow}`,
        // CSS variable used for hover glow intensification so the effect stays theme-friendly.
        "--glow": style.glow,
      }}
    >
      <IconComponent size={20} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}

Icon.propTypes = {
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf(Object.keys(ICON_MAP))]),
  variant: PropTypes.oneOf(["green", "purple", "pink", "cyan"]),
  className: PropTypes.string,
};
