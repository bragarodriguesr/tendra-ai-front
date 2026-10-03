import React from "react";
import { Icon } from "../core/Icon.jsx";

export function EmptyState({ icon = "file-text", title, description, action, tone = "paper", style, ...rest }) {
  const inverse = tone === "ink";
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-4)",
        justifyItems: "center",
        textAlign: "center",
        padding: "var(--space-12) var(--space-6)",
        ...style
      }}
      {...rest}
    >
      <span
        style={{
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-lg)",
          border: inverse ? "1px solid var(--border-inverse-strong)" : "1px solid var(--border-default)",
          color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)"
        }}
      >
        <Icon name={icon} size="xl" />
      </span>
      {title ? (
        <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", letterSpacing: "-0.02em", color: inverse ? "var(--text-on-inverse)" : "var(--text-strong)" }}>
          {title}
        </div>
      ) : null}
      {description ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: inverse ? "var(--text-on-inverse-body)" : "var(--text-body)", maxWidth: "42ch", textWrap: "pretty" }}>
          {description}
        </div>
      ) : null}
      {action ? <div style={{ marginTop: "var(--space-2)" }}>{action}</div> : null}
    </div>
  );
}
