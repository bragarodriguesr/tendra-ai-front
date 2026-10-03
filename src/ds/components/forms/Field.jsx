import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Field({ label, hint, error, required = false, htmlFor, children, style, ...rest }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", ...style }} {...rest}>
      {label ? (
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm-size)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-strong)"
          }}
        >
          {label}
          {required ? <span style={{ color: "var(--brand-sage)", marginLeft: 4 }}>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", color: "var(--danger)" }}>
          <Icon name="circle-alert" size="sm" />
          {error}
        </div>
      ) : hint ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-meta)" }}>{hint}</div>
      ) : null}
    </div>
  );
}
