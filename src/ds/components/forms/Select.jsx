import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Select({ options = [], size = "md", invalid = false, disabled = false, placeholder, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      <select
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        {...rest}
        style={{
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
          fontFamily: "var(--font-sans)",
          fontSize: size === "sm" ? "var(--text-sm-size)" : "var(--text-ui-size)",
          lineHeight: 1.4,
          color: "var(--text-strong)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          padding: size === "sm" ? "8px 36px 8px 12px" : "11px 40px 11px 14px",
          minHeight: size === "sm" ? 36 : "var(--hit-min)",
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
          transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)"
        }}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: 13, display: "flex", color: "var(--text-meta)", pointerEvents: "none" }}>
        <Icon name="chevron-down" size="md" />
      </span>
    </div>
  );
}
