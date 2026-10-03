import React from "react";
import { Icon } from "./Icon.jsx";

export function Tag({ children, onRemove, removeLabel = "Remover", tone = "default", style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const inverse = tone === "inverse";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm-size)",
        fontWeight: "var(--weight-medium)",
        lineHeight: 1.3,
        padding: onRemove ? "6px 8px 6px 12px" : "6px 12px",
        borderRadius: "var(--radius-pill)",
        background: inverse ? "var(--paper-wash)" : "var(--surface-sunken)",
        border: inverse ? "1px solid var(--border-inverse-strong)" : "1px solid var(--border-default)",
        color: inverse ? "var(--text-on-inverse-body)" : "var(--text-body)",
        ...style
      }}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            border: 0,
            padding: 0,
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
            background: hover ? (inverse ? "var(--ink-500)" : "var(--border-default)") : "transparent",
            color: "inherit",
            transition: "background var(--duration-fast) var(--ease-out)"
          }}
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </span>
  );
}
