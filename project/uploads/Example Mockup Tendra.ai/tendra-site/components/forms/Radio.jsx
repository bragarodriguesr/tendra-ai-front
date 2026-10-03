import React from "react";

export function Radio({ label, description, checked, disabled = false, onChange, name, value, style, ...rest }) {
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
        type="radio"
        name={name}
        value={value}
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
          borderRadius: "var(--radius-pill)",
          border: checked ? "6px solid var(--brand-ink)" : "1px solid var(--border-strong)",
          background: "var(--surface-card)",
          transition: "border var(--duration-fast) var(--ease-out)"
        }}
      />
      {(label || description) && (
        <span style={{ display: "grid", gap: 2 }}>
          {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", color: "var(--text-strong)" }}>{label}</span> : null}
          {description ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-meta)" }}>{description}</span> : null}
        </span>
      )}
    </label>
  );
}
