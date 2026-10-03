import React from "react";

export function Switch({ label, description, checked = false, disabled = false, onChange, style, ...rest }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: description ? "flex-start" : "center",
        gap: "var(--space-4)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        minHeight: "var(--hit-min)",
        ...style
      }}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, margin: 0 }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 44,
          height: 26,
          flex: "none",
          marginTop: description ? 2 : 0,
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--brand-ink)" : "var(--border-strong)",
          padding: 3,
          display: "flex",
          justifyContent: checked ? "flex-end" : "flex-start",
          transition: "background var(--duration-base) var(--ease-out)"
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "var(--radius-pill)",
            background: checked ? "var(--brand-lime)" : "var(--surface-card)",
            transition: "background var(--duration-base) var(--ease-out)"
          }}
        />
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
