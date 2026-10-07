import React from "react";
import { Icon } from "../core/Icon.jsx";
import { MonoLabel } from "../core/MonoLabel.jsx";

function Item({ item, active, inverse, collapsed }) {
  const [hover, setHover] = React.useState(false);
  const on = active;
  return (
    <a
      href={item.href || "#"}
      onClick={item.onClick}
      aria-current={on ? "page" : undefined}
      aria-label={collapsed ? item.label + (item.count != null ? ` (${item.count})` : "") : undefined}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : undefined,
        gap: "var(--space-3)",
        padding: "10px 12px",
        minHeight: "var(--hit-min)",
        borderRadius: "var(--radius-sm)",
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-ui-size)",
        fontWeight: on ? "var(--weight-semibold)" : "var(--weight-regular)",
        background: on
          ? inverse ? "var(--paper-wash)" : "var(--surface-sunken)"
          : hover ? inverse ? "rgba(255,255,255,0.04)" : "var(--n-075)"
          : "transparent",
        color: on
          ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
          : inverse ? "var(--text-on-inverse-body)" : "var(--text-body)",
        boxShadow: on ? `inset 2px 0 0 ${inverse ? "var(--brand-lime)" : "var(--brand-ink)"}` : "none",
        transition: "background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)"
      }}
    >
      {item.icon ? <Icon name={item.icon} size="lg" /> : null}
      {collapsed ? null : <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>}
      {item.count != null && !collapsed ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-size)", color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)" }}>
          {item.count}
        </span>
      ) : null}
    </a>
  );
}

/** collapsed: só os ícones (rótulo vira aria-label e title); os títulos de grupo viram um traço. */
export function SidebarNav({ groups = [], value, tone = "paper", header, footer, width = 248, collapsed = false, style, ...rest }) {
  const inverse = tone === "ink";
  return (
    <nav
      style={{
        width,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        padding: "var(--space-5)",
        background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
        borderRight: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
        ...style
      }}
      {...rest}
    >
      {header}
      <div style={{ display: "grid", gap: "var(--space-6)", flex: 1, alignContent: "start" }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ display: "grid", gap: "var(--space-1)" }}>
            {g.label && collapsed ? (
              gi > 0 ? <span aria-hidden="true" style={{ height: 1, margin: "0 8px 6px", background: inverse ? "var(--border-inverse)" : "var(--border-default)" }} /> : null
            ) : g.label ? (
              <MonoLabel tone={inverse ? "inverse" : "default"} style={{ padding: "0 12px 6px" }}>{g.label}</MonoLabel>
            ) : null}
            {(g.items || []).map((it) => (
              <Item key={it.value || it.label} item={it} active={it.value === value} inverse={inverse} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </div>
      {footer}
    </nav>
  );
}
