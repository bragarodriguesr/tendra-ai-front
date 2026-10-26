import React from "react";

const BG = { lime: "var(--grad-aurora-lime)", mist: "var(--grad-mist-paper)", ink: "var(--grad-aurora-ink)" };
const PADS = { none: 0, sm: "var(--space-5)", md: "var(--space-8)", lg: "var(--space-12)" };

export function Aurora({ variant = "lime", move = false, radius = "3xl", padding = "none", as = "div", children, style, ...rest }) {
  const Tag = as;
  const dark = variant === "ink";
  return (
    <Tag
      data-aurora={move ? "move" : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        background: BG[variant] || BG.lime,
        color: dark ? "var(--text-on-inverse)" : "var(--text-strong)",
        borderRadius: radius === 0 || radius === "none" ? 0 : "var(--radius-" + radius + ")",
        padding: PADS[padding] !== undefined ? PADS[padding] : PADS.none,
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
