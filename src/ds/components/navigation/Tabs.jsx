import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Tabs({ items = [], value, onChange, tone = "paper", style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  const inverse = tone === "ink";
  const active = value != null ? value : items[0] && items[0].value;
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-6)",
        borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
        ...style
      }}
      {...rest}
    >
      {items.map((it) => {
        const on = it.value === active;
        const hot = hover === it.value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange && onChange(it.value)}
            onMouseEnter={() => setHover(it.value)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: 0,
              padding: "0 0 12px",
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-ui-size)",
              fontWeight: on ? "var(--weight-semibold)" : "var(--weight-medium)",
              color: on
                ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
                : hot ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
                : inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
              borderBottom: on
                ? `2px solid ${inverse ? "var(--brand-lime)" : "var(--brand-ink)"}`
                : "2px solid transparent",
              transition: "color var(--duration-fast) var(--ease-out)"
            }}
          >
            {it.icon ? <Icon name={it.icon} size="md" /> : null}
            {it.label}
            {it.count != null ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-size)", color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)" }}>
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
