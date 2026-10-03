import React from "react";

export function Tooltip({ content, children, placement = "top", style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const pos =
    placement === "bottom" ? { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }
    : placement === "left" ? { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
    : placement === "right" ? { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
    : { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...rest}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            ...pos,
            zIndex: 30,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm-size)",
            lineHeight: 1.4,
            color: "var(--text-on-inverse)",
            background: "var(--surface-inverse)",
            border: "1px solid var(--border-inverse)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 10px",
            boxShadow: "var(--shadow-popover)",
            animation: "tdr-fade var(--duration-fast) var(--ease-out) both",
            pointerEvents: "none"
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
