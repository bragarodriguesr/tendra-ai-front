import React from "react";

export function TopBar({ start, center, end, tone = "paper", style, ...rest }) {
  const inverse = tone === "ink";
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-6)",
        padding: "var(--space-3) var(--space-6)",
        minHeight: 64,
        background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
        borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
        ...style
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", minWidth: 0 }}>{start}</div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>{center}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>{end}</div>
    </header>
  );
}
