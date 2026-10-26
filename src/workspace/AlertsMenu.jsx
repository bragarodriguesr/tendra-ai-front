import React from "react";
import { Icon, IconButton, MonoLabel } from "../ds/index.js";
import { MONO } from "./ui.jsx";
import { usePopover } from "./usePopover.js";

/**
 * Sino da barra superior com os alertas das tarefas; o ponto indica alertas não lidos. O "X" fecha o
 * alerta até o próximo login; o botão de ação leva à tela e tira o alerta da lista de vez.
 */
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
          <div className="tdr-alerts-list">
            {alerts.length ? alerts.map((a) => (
              <div key={a.key} className="tdr-alerts-item">
                <span style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 28 }}>
                  {!a.read ? <span className="tdr-dot" aria-label="Não lido" /> : null}
                  <span style={{ display: "inline-flex", color: "var(--brand-sage)" }}><Icon name={a.icon} size={14} /></span>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--n-400)" }}>{a.label} · {a.at}</span>
                </span>
                <span className="tdr-alerts-close"><IconButton icon="x" size="sm" variant="ghost" label={`Fechar alerta: ${a.label}, ${a.name}`} onClick={a.hide} /></span>
                <span style={{ color: "var(--n-900)", lineHeight: 1.45 }}><strong>{a.name}</strong> {a.text}</span>
                <button type="button" className="tdr-alerts-action" onClick={() => { setOpen(false); onRead(a); }}>{a.action}<Icon name="arrow-right" size={12} /></button>
              </div>
            )) : <div style={{ padding: 16, fontSize: 13, color: "var(--n-400)" }}>Nenhum alerta.</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
