import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Breadcrumb({ items = [], tone = "paper", style, ...rest }) {
  const inverse = tone === "ink";
  return (
    <nav
      aria-label="Trilha"
      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", ...style }}
      {...rest}
    >
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <span style={{ display: "flex", color: inverse ? "var(--ink-300)" : "var(--border-strong)" }}>
                <Icon name="chevron-right" size="sm" />
              </span>
            ) : null}
            {last || !it.href ? (
              <span
                aria-current={last ? "page" : undefined}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-sm-size)",
                  fontWeight: last ? "var(--weight-semibold)" : "var(--weight-regular)",
                  color: last ? (inverse ? "var(--text-on-inverse)" : "var(--text-strong)") : (inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)")
                }}
              >
                {it.label}
              </span>
            ) : (
              <a
                href={it.href}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-sm-size)",
                  color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
                  textDecoration: "none"
                }}
              >
                {it.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
