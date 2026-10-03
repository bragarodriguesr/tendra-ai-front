import React from "react";

export function Textarea({ rows = 4, invalid = false, disabled = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
      onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
      {...rest}
      style={{
        width: "100%",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-ui-size)",
        lineHeight: 1.6,
        color: "var(--text-strong)",
        background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
        padding: "12px 14px",
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-sm)",
        outline: "none",
        resize: "vertical",
        boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
        transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
        ...style
      }}
    />
  );
}
