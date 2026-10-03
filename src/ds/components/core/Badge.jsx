import React from "react";
import { Icon } from "./Icon.jsx";

const TONES = {
  neutral: { background: "var(--surface-sunken)", border: "1px solid var(--border-strong)", color: "var(--text-body)" },
  approved: { background: "var(--lime-wash)", border: "1px solid var(--brand-lime)", color: "var(--text-state)" },
  "approved-inverse": { background: "var(--lime-wash)", border: "1px solid var(--brand-lime)", color: "var(--brand-lime)" },
  accent: { background: "var(--brand-lime)", border: "1px solid var(--brand-lime)", color: "var(--brand-ink)" },
  ink: { background: "var(--brand-ink)", border: "1px solid var(--brand-ink)", color: "var(--brand-paper)" },
  inverse: { background: "var(--paper-wash)", border: "1px solid var(--ink-300)", color: "var(--text-on-inverse-body)" },
  danger: { background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)" }
};

export function Badge({ children, tone = "neutral", icon, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label-size)",
        lineHeight: 1.3,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        padding: "5px 9px",
        borderRadius: "var(--radius-xs)",
        whiteSpace: "nowrap",
        ...t,
        ...style
      }}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}
