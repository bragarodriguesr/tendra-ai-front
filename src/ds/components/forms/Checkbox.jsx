import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Checkbox({ label, description, checked, indeterminate = false, disabled = false, onChange, style, ...rest }) {
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: description ? "flex-start" : "center",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        minHeight: "var(--hit-min)",
        ...style
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={onChange}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, margin: 0 }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          flex: "none",
          marginTop: description ? 2 : 0,
          borderRadius: "var(--radius-xs)",
          border: on ? "1px solid var(--brand-ink)" : "1px solid var(--border-strong)",
          background: on ? "var(--brand-ink)" : "var(--surface-card)",
          color: "var(--brand-lime)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)"
        }}
      >
        {indeterminate ? <Icon name="minus" size={14} /> : checked ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}
      </span>
      {(label || description) && (
        <span style={{ display: "grid", gap: 2 }}>
          {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", color: "var(--text-strong)" }}>{label}</span> : null}
          {description ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-meta)" }}>{description}</span> : null}
        </span>
      )}
    </label>
  );
}
