import React from "react";
import { Badge, Button, IconButton, Toast } from "../ds/index.js";
import { DISPLAY, card, mono } from "./ui.jsx";

const bar = (width, height = 6, background = "var(--n-100)") => <div style={{ height, width, background, borderRadius: 2 }} />;

/** T7 — trecho de origem destacado numa gaveta lateral. Esc fecha. */
export function SourceDrawer({ dr, onClose }) {
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current && closeRef.current.querySelector("button")?.focus(); }, [dr.doc, dr.k]);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(18,20,15,.32)" }} onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Visualizador de fonte" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 560, maxWidth: "92vw", zIndex: 21, background: "var(--n-000)", borderLeft: "1px solid var(--n-200)", boxShadow: "var(--shadow-overlay)", display: "flex", flexDirection: "column", animation: "tdr-fade var(--duration-base) var(--ease-out) both" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase" }}>Fonte [{dr.k}] · {dr.type}</span>
            <span style={{ ...mono(15), fontWeight: 500, wordBreak: "break-word" }}>{dr.doc}</span>
            <span style={{ fontSize: 13, color: "var(--n-400)" }}>{dr.loc} · {dr.ageText}</span>
          </div>
          <span ref={closeRef} style={{ display: "flex" }}><IconButton icon="x" label="Fechar fonte" onClick={onClose} /></span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--n-100)" }}>
          {dr.missing ? (
            <div style={card(12, { padding: 24, display: "flex", flexDirection: "column", gap: 12 })}>
              <div><Badge tone="danger" icon="triangle-alert">Documento indisponível</Badge></div>
              <div style={{ lineHeight: 1.6, color: "var(--n-900)" }}>Este documento não está mais na base. Mostramos o nome e a página registrados.</div>
              <div style={mono(13, "var(--n-700)")}>{dr.doc} · {dr.loc}</div>
            </div>
          ) : (
            <div style={card(4, { padding: "40px 36px", display: "flex", flexDirection: "column", gap: 12, minHeight: 520 })}>
              {bar("40%", 10, "var(--n-200)")}
              {bar("100%")}{bar("94%")}{bar("97%")}
              <div style={{ height: 16 }} />
              <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--n-900)" }}>
                <mark style={{ background: "var(--brand-lime)", color: "var(--brand-ink)", padding: "2px 0" }}>{dr.ex}</mark>
              </div>
              <div style={{ height: 16 }} />
              {bar("96%")}{bar("88%")}{bar("60%")}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={mono(11, "var(--n-400)")}>Esc fecha e volta ao item</span>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      </aside>
    </>
  );
}

/** Confirmação antes de editar um item já aprovado. */
export function ConfirmEditDialog({ onCancel, onConfirm }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(18,20,15,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="tdr-edit-title" style={{ width: 440, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: "var(--n-000)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-overlay)" }}>
        <div id="tdr-edit-title" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: "var(--n-900)" }}>Editar remove a aprovação.</div>
        <div style={{ lineHeight: 1.6 }}>O item volta para Em revisão e o evento fica registrado.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm} autoFocus>Editar e remover aprovação</Button>
        </div>
      </div>
    </div>
  );
}

export function ToastHost({ toast, onClose, isMobile }) {
  return (
    <>
      <div aria-live="polite" style={{ position: "absolute", left: -9999 }}>{toast ? `${toast.title}. ${toast.desc}` : ""}</div>
      {toast ? (
        <div style={isMobile
          // No celular o aviso fica no topo, para não cobrir a barra de revisar/aprovar.
          ? { position: "absolute", left: 16, right: 16, top: 12, zIndex: 40 }
          : { position: "absolute", right: 24, bottom: 24, zIndex: 40 }}>
          <Toast title={toast.title} description={toast.desc} tone={toast.tone} onClose={onClose} />
        </div>
      ) : null}
    </>
  );
}
