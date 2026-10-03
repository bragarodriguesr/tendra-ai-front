import React from "react";
import { Icon } from "../core/Icon.jsx";
import { IconButton } from "../core/IconButton.jsx";

const TONES = {
  neutral: { icon: "info", accent: "var(--ink-200)" },
  success: { icon: "circle-check", accent: "var(--brand-lime)" },
  warning: { icon: "triangle-alert", accent: "var(--brand-lime)" },
  danger: { icon: "circle-alert", accent: "#F0836F" }
};

export function Toast({ title, description, tone = "neutral", action, onClose, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        maxWidth: 420,
        padding: "var(--space-4) var(--space-4) var(--space-4) var(--space-5)",
        background: "var(--surface-inverse)",
        border: "1px solid var(--border-inverse)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-overlay)",
        animation: "tdr-rise var(--duration-base) var(--ease-out) both",
        ...style
      }}
      {...rest}
    >
      <span style={{ display: "flex", marginTop: 2, color: t.accent }}>
        <Icon name={t.icon} size="md" />
      </span>
      <div style={{ display: "grid", gap: 3, flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", fontWeight: "var(--weight-semibold)", color: "var(--text-on-inverse)" }}>
          {title}
        </div>
        {description ? (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-on-inverse-body)", textWrap: "pretty" }}>
            {description}
          </div>
        ) : null}
        {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
      </div>
      {onClose ? <IconButton icon="x" label="Dispensar" variant="inverse" size="sm" onClick={onClose} /> : null}
    </div>
  );
}
