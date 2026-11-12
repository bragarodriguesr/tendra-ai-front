import React from "react";

const PALETTES = {
  paper: { frame: "var(--brand-sage)", diamond: "var(--brand-ink)", core: "var(--brand-ink)", word: "var(--brand-ink)", accent: "var(--brand-sage)" },
  ink: { frame: "var(--brand-paper)", diamond: "var(--brand-lime)", core: "var(--brand-lime)", word: "var(--brand-paper)", accent: "var(--brand-lime)" },
  "mono-ink": { frame: "var(--brand-ink)", diamond: "var(--brand-ink)", core: "var(--brand-ink)", word: "var(--brand-ink)", accent: "var(--brand-ink)" },
  "mono-paper": { frame: "var(--brand-paper)", diamond: "var(--brand-paper)", core: "var(--brand-paper)", word: "var(--brand-paper)", accent: "var(--brand-paper)" }
};

function BrandSymbol({ size, p }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" style={{ flex: "none", display: "block" }} aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="6" stroke={p.frame} strokeWidth="3.2" />
      <rect x="13.5" y="13.5" width="21" height="21" transform="rotate(45 24 24)" stroke={p.diamond} strokeWidth="3.2" />
      <rect x="20" y="20" width="8" height="8" fill={p.core} />
    </svg>
  );
}

export function Logo({ variant = "paper", size = 32, lockup = "horizontal", title = "Tendra.ai", style, ...rest }) {
  const p = PALETTES[variant] || PALETTES.paper;

  if (lockup === "appicon") {
    const field = variant === "ink" ? "var(--brand-ink)" : variant === "mono-paper" ? "var(--brand-paper)" : "var(--brand-ink)";
    const stroke = variant === "mono-paper" ? "var(--brand-sage)" : "var(--brand-lime)";
    const core = variant === "mono-paper" ? "var(--brand-ink)" : "var(--brand-paper)";
    return (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" role="img" aria-label={title} style={{ flex: "none", display: "block", ...style }} {...rest}>
        <rect width="48" height="48" rx="12" fill={field} />
        <rect x="14" y="14" width="20" height="20" transform="rotate(45 24 24)" stroke={stroke} strokeWidth="3.5" />
        <rect x="21" y="21" width="6" height="6" fill={core} />
      </svg>
    );
  }

  if (lockup === "symbol") {
    return (
      <span role="img" aria-label={title} style={{ display: "inline-flex", ...style }} {...rest}>
        <BrandSymbol size={size} p={p} />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={title}
      style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.3), ...style }}
      {...rest}
    >
      <BrandSymbol size={size} p={p} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--weight-bold)",
          fontSize: Math.round(size * 0.66),
          letterSpacing: "-0.025em",
          color: p.word,
          whiteSpace: "nowrap"
        }}
      >
        Tendra<span style={{ color: p.accent }}>.ai</span>
      </span>
    </span>
  );
}
