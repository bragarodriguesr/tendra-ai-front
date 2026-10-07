import React from "react";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";

const countStyle = { fontFamily: "var(--font-mono)", fontWeight: "var(--weight-regular)", opacity: 0.75 };

function Option({ item, checked, onPick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onPick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", minHeight: 36, padding: "6px 10px",
        border: 0, borderRadius: "var(--radius-sm)", background: hover ? "var(--n-075)" : "transparent",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", fontWeight: checked ? "var(--weight-semibold)" : "var(--weight-regular)",
        color: "var(--text-strong)", textAlign: "left", cursor: "pointer",
        transition: "background var(--duration-fast) var(--ease-out)"
      }}
    >
      <span style={{ width: 16, display: "inline-flex" }}>{checked ? <Icon name="check" size={14} /> : null}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count != null ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-size)", color: "var(--text-meta)", fontVariantNumeric: "tabular-nums" }}>{item.count}</span>
      ) : null}
    </button>
  );
}

/**
 * Filtro de lista: o primeiro item ("Todos") fica fixo como botão; os demais vão para um menu
 * suspenso aberto pelo botão "Filtrar", cada um com a sua contagem.
 */
export function FilterMenu({ items = [], value, onChange, label = "Filtrar itens", triggerLabel = "Filtrar", style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef(null);
  const menuId = React.useId();
  const [all, ...options] = items;
  const active = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); root.current.querySelector("button").focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!all) return null;
  const pick = (v) => { onChange && onChange(v); setOpen(false); root.current.querySelector("button").focus(); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", ...style }} {...rest}>
      <Button size="sm" variant={active ? "secondary" : "primary"} aria-pressed={!active} onClick={() => onChange && onChange(all.value)}>
        {all.label}{all.count != null ? <> <span style={countStyle}>{all.count}</span></> : null}
      </Button>
      <div ref={root} style={{ position: "relative" }}>
        <Button
          size="sm"
          variant={active ? "primary" : "secondary"}
          icon="filter"
          iconEnd="chevron-down"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          {active ? <>{active.label}{active.count != null ? <> <span style={countStyle}>{active.count}</span></> : null}</> : triggerLabel}
        </Button>
        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label={label}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 70, width: 248, boxSizing: "border-box", padding: 6,
              display: "grid", background: "var(--surface-card)", border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-popover)",
              animation: "tdr-rise var(--duration-fast) var(--ease-out)"
            }}
          >
            {options.map((o) => <Option key={o.value} item={o} checked={o.value === value} onPick={() => pick(o.value)} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
