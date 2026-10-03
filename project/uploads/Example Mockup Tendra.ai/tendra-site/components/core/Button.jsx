import React from "react";
import { Icon } from "./Icon.jsx";

const SIZES = {
  sm: { fontSize: "var(--text-sm-size)", padding: "8px 14px", minHeight: 36, gap: 6, icon: 14 },
  md: { fontSize: "var(--text-ui-size)", padding: "12px 18px", minHeight: "var(--hit-min)", gap: 8, icon: 16 },
  lg: { fontSize: "var(--text-body-size)", padding: "15px 24px", minHeight: 52, gap: 10, icon: 20 }
};

const VARIANTS = {
  primary: {
    rest: { background: "var(--action-primary-bg)", color: "var(--action-primary-fg)", border: "1px solid var(--action-primary-bg)" },
    hover: { background: "var(--action-primary-bg-hover)", borderColor: "var(--action-primary-bg-hover)" }
  },
  secondary: {
    rest: { background: "transparent", color: "var(--action-secondary-fg)", border: "1px solid var(--action-secondary-border)" },
    hover: { borderColor: "var(--brand-ink)" }
  },
  accent: {
    rest: { background: "var(--action-accent-bg)", color: "var(--action-accent-fg)", border: "1px solid var(--action-accent-bg)" },
    hover: { background: "#B6E22C", borderColor: "#B6E22C" }
  },
  ghost: {
    rest: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
    hover: { background: "var(--surface-sunken)", color: "var(--text-strong)" }
  },
  "inverse-secondary": {
    rest: { background: "transparent", color: "var(--text-on-inverse-body)", border: "1px solid var(--border-inverse-strong)" },
    hover: { borderColor: "var(--n-400)", color: "var(--text-on-inverse)" }
  },
  danger: {
    rest: { background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)" },
    hover: { background: "var(--danger)", color: "var(--n-000)" }
  }
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;

  return (
    <button
      type={type}
      disabled={off}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-semibold)",
        fontSize: s.fontSize,
        lineHeight: 1.2,
        padding: s.padding,
        minHeight: s.minHeight,
        borderRadius: "var(--radius-md)",
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        cursor: off ? "not-allowed" : "pointer",
        opacity: off ? 0.42 : 1,
        transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
        ...v.rest,
        ...(hover && !off ? v.hover : null),
        ...style
      }}
      {...rest}
    >
      {loading ? (
        <Icon name="loader-circle" size={s.icon} style={{ animation: "tdr-spin 900ms linear infinite" }} />
      ) : icon ? (
        <Icon name={icon} size={s.icon} />
      ) : null}
      {children}
      {iconEnd && !loading ? <Icon name={iconEnd} size={s.icon} /> : null}
    </button>
  );
}
