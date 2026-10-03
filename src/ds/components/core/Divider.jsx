import React from "react";

export function Divider({ orientation = "horizontal", tone = "default", style, ...rest }) {
  const color = tone === "inverse" ? "var(--border-inverse)" : tone === "subtle" ? "var(--border-subtle)" : "var(--border-default)";
  const vertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      style={{
        background: color,
        width: vertical ? 1 : "100%",
        height: vertical ? "100%" : 1,
        flex: "none",
        ...style
      }}
      {...rest}
    />
  );
}
