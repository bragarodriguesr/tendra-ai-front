import React from "react";
import { Button, Icon } from "../ds/index.js";
import { MONO } from "./ui.jsx";
import { usePopover } from "./usePopover.js";

/** "Todos" fixo + botão de filtro com menu suspenso das demais visões, cada uma com a quantidade de itens. */
export function FilterMenu({ tabs, value, onChange, label = "Filtrar itens" }) {
  const { open, setOpen, root, focusTrigger } = usePopover();
  const all = tabs[0];
  const rest = tabs.slice(1);
  const active = rest.find((t) => t.value === value);
  const menuId = "tdr-filter-menu";
  const pick = (v) => { onChange(v); setOpen(false); focusTrigger(); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Button size="sm" variant={active ? "secondary" : "primary"} aria-pressed={!active} onClick={() => onChange(all.value)}>
        {all.label} <span style={{ fontFamily: MONO, fontWeight: 400, opacity: 0.75 }}>{all.count}</span>
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
          {active ? <>{active.label} <span style={{ fontFamily: MONO, fontWeight: 400, opacity: 0.75 }}>{active.count}</span></> : "Filtrar"}
        </Button>
        {open ? (
          <div id={menuId} className="tdr-popover tdr-filter-menu" role="menu" aria-label={label}>
            {rest.map((t) => (
              <button key={t.value} type="button" role="menuitemradio" aria-checked={t.value === value} className="tdr-filter-item" onClick={() => pick(t.value)}>
                <span style={{ width: 16, display: "inline-flex" }}>{t.value === value ? <Icon name="check" size={14} /> : null}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--n-400)", fontVariantNumeric: "tabular-nums" }}>{t.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
