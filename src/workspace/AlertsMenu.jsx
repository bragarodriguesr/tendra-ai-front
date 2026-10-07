import React from "react";
import { Icon, IconButton, MonoLabel } from "../ds/index.js";
import { MONO } from "./ui.jsx";
import { usePopover } from "./usePopover.js";

/** Sino da barra superior com os alertas das tarefas; o ponto indica alertas não lidos. */
export function AlertsMenu({ alerts, unread, onRead, onReadAll }) {
  const { open, setOpen, root } = usePopover();
  const panelId = "tdr-alerts-menu";

  return (
    <div ref={root} style={{ position: "relative", display: "inline-flex" }}>
      <IconButton
        icon="bell"
        variant="inverse"
        label={unread ? `Alertas (${unread} não ${unread === 1 ? "lido" : "lidos"})` : "Alertas"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
      />
      {unread ? <span className="tdr-dot tdr-bell-dot" aria-hidden="true" /> : null}
      {open ? (
        <div id={panelId} className="tdr-popover tdr-alerts-menu" role="dialog" aria-label="Alertas">
          <div className="tdr-alerts-head">
            <MonoLabel>Alertas</MonoLabel>
            <button type="button" className="tdr-linkbtn" disabled={!unread} onClick={onReadAll}>Marcar como lidos</button>
          </div>
          {alerts.length ? alerts.map((a) => (
            <button key={a.key} type="button" className="tdr-alerts-item" onClick={() => { setOpen(false); onRead(a); }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!a.read ? <span className="tdr-dot" aria-label="Não lido" /> : null}
                <span style={{ display: "inline-flex", color: "var(--brand-sage)" }}><Icon name={a.icon} size={14} /></span>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--n-400)" }}>{a.label} · {a.at}</span>
              </span>
              <span style={{ color: "var(--n-900)", lineHeight: 1.45 }}><strong>{a.name}</strong> {a.text}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "var(--n-700)" }}>{a.action}<Icon name="arrow-right" size={12} /></span>
            </button>
          )) : <div style={{ padding: 16, fontSize: 13, color: "var(--n-400)" }}>Nenhum alerta.</div>}
        </div>
      ) : null}
    </div>
  );
}
