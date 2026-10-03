import React from "react";
import { Icon } from "../core/Icon.jsx";

export function SourceTrail({ sources = [], tone = "paper", label = "Fonte", style, ...rest }) {
  const inverse = tone === "ink";
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-2)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-size)",
        lineHeight: "var(--text-mono-lh)",
        color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
        ...style
      }}
      {...rest}
    >
      <span style={{ display: "flex", color: inverse ? "var(--ink-300)" : "var(--brand-sage)" }}>
        <Icon name="link" size="sm" />
      </span>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      {sources.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <span aria-hidden="true" style={{ opacity: 0.6 }}>·</span> : null}
          {s.href ? (
            <a href={s.href} style={{ color: inverse ? "var(--text-on-inverse-body)" : "var(--text-state)", textDecoration: "underline", textUnderlineOffset: 2 }}>
              {s.file}{s.page ? ` · p.${s.page}` : ""}
            </a>
          ) : (
            <span style={{ color: inverse ? "var(--text-on-inverse-body)" : "var(--text-state)" }}>
              {s.file}{s.page ? ` · p.${s.page}` : ""}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
