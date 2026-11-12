import React from "react";

const TONES = {
  paper: { background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-body)" },
  sunken: { background: "var(--surface-sunken)", border: "1px solid var(--border-default)", color: "var(--text-body)" },
  ink: { background: "var(--surface-inverse)", border: "1px solid var(--surface-inverse)", color: "var(--text-on-inverse-body)" },
  "ink-panel": { background: "var(--surface-inverse-card)", border: "1px solid var(--border-inverse)", color: "var(--text-on-inverse-body)" },
  accent: { background: "var(--brand-lime)", border: "1px solid var(--brand-lime)", color: "var(--brand-ink)" }
};

const PADS = { none: 0, sm: "var(--space-5)", md: "var(--gutter-card)", lg: "var(--gutter-card-lg)" };

export function Card({ children, tone = "paper", padding = "md", radius = "xl", accentTop, as = "div", style, ...rest }) {
  const Tag = as;
  const t = TONES[tone] || TONES.paper;
  return (
    <Tag
      style={{
        borderRadius: `var(--radius-${radius})`,
        padding: PADS[padding] !== undefined ? PADS[padding] : PADS.md,
        ...t,
        ...(accentTop ? { borderTop: `var(--border-width-accent) solid ${accentTop}` } : null),
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
