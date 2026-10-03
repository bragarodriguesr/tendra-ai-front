import React from "react";
import { Icon } from "../core/Icon.jsx";

const SIZES = { sm: { padding: "8px 12px", minHeight: 36, fontSize: "var(--text-sm-size)" }, md: { padding: "11px 14px", minHeight: "var(--hit-min)", fontSize: "var(--text-ui-size)" } };

export function Input({ size = "md", icon, invalid = false, disabled = false, mono = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      {icon ? (
        <span style={{ position: "absolute", left: 13, display: "flex", color: "var(--text-meta)", pointerEvents: "none" }}>
          <Icon name={icon} size="md" />
        </span>
      ) : null}
      <input
        disabled={disabled}
        onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
        {...rest}
        style={{
          width: "100%",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: s.fontSize,
          lineHeight: 1.4,
          color: "var(--text-strong)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          padding: icon ? `${s.padding.split(" ")[0]} 14px ${s.padding.split(" ")[0]} 40px` : s.padding,
          minHeight: s.minHeight,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
          transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
          cursor: disabled ? "not-allowed" : "text"
        }}
      />
    </div>
  );
}
