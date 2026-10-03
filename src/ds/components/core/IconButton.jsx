import React from "react";
import { Icon } from "./Icon.jsx";

const SIZES = { sm: { box: 32, icon: 14 }, md: { box: 40, icon: 16 }, lg: { box: 44, icon: 20 } };

const VARIANTS = {
  ghost: { rest: { background: "transparent", border: "1px solid transparent", color: "var(--text-body)" }, hover: { background: "var(--surface-sunken)", color: "var(--text-strong)" } },
  outline: { rest: { background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-body)" }, hover: { borderColor: "var(--border-strong)", color: "var(--text-strong)" } },
  solid: { rest: { background: "var(--action-primary-bg)", border: "1px solid var(--action-primary-bg)", color: "var(--action-primary-fg)" }, hover: { background: "var(--action-primary-bg-hover)" } },
  inverse: { rest: { background: "transparent", border: "1px solid transparent", color: "var(--text-on-inverse-body)" }, hover: { background: "var(--paper-wash)", color: "var(--text-on-inverse)" } }
};

export function IconButton({ icon, label, variant = "ghost", size = "md", disabled = false, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.ghost;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: s.box,
        height: s.box,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.42 : 1,
        transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
        ...v.rest,
        ...(hover && !disabled ? v.hover : null),
        ...style
      }}
      {...rest}
    >
      <Icon name={icon} size={s.icon} />
    </button>
  );
}
