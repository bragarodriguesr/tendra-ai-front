import React from "react";

const TONES = {
  default: "var(--text-meta)",
  strong: "var(--text-body)",
  sage: "var(--brand-sage)",
  state: "var(--text-state)",
  inverse: "var(--text-on-inverse-meta)",
  accent: "var(--brand-lime)"
};

export function MonoLabel({ children, tone = "default", uppercase = true, size = "label", as = "span", style, ...rest }) {
  const Tag = as;
  const isLabel = size === "label";
  return (
    <Tag
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: isLabel ? "var(--text-label-size)" : "var(--text-mono-size)",
        lineHeight: isLabel ? "var(--text-label-lh)" : "var(--text-mono-lh)",
        letterSpacing: isLabel ? "var(--text-label-ls)" : "var(--text-mono-ls)",
        textTransform: uppercase ? "uppercase" : "none",
        color: TONES[tone] || TONES.default,
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
