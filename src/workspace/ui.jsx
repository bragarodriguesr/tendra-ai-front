import React from "react";
import { Icon, IconButton, MonoLabel, Tooltip } from "../ds/index.js";

export const MONO = "'IBM Plex Mono',monospace";
export const DISPLAY = "'Space Grotesk',sans-serif";

export const mono = (fontSize, color = "var(--n-900)", extra) => ({ fontFamily: MONO, fontSize, color, ...extra });
export const card = (radius = 14, extra) => ({ background: "var(--n-000)", border: "1px solid var(--n-200)", borderRadius: radius, ...extra });
export const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" };
export const h1Style = { margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: 32, letterSpacing: "-.025em", color: "var(--n-900)" };
export const bigNumber = { fontFamily: DISPLAY, fontWeight: 600, fontSize: 48, letterSpacing: "-.03em", lineHeight: 1, color: "var(--n-900)" };

/** Coluna de página com largura máxima e o padding responsivo do Workspace. */
export function Page({ max = 1160, pad, gap = 24, children }) {
  return <div style={{ maxWidth: max, padding: pad, display: "flex", flexDirection: "column", gap }}>{children}</div>;
}

/** Eyebrow em mono + título H1, com ação opcional à direita. */
export function PageHeader({ eyebrow: label, title, action }) {
  const head = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <MonoLabel>{label}</MonoLabel>
      <h1 style={h1Style}>{title}</h1>
    </div>
  );
  if (!action) return head;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
      {head}
      <div style={{ flex: "none", whiteSpace: "nowrap" }}>{action}</div>
    </div>
  );
}

/** Linha clicável que também responde a Enter e Espaço. */
export function ClickRow({ onClick, style, role = "button", className = "tdr-hover", children, ...rest }) {
  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(e); }
  };
  return <div role={role} tabIndex={0} onClick={onClick} onKeyDown={onKeyDown} className={className} style={{ cursor: "pointer", ...style }} {...rest}>{children}</div>;
}

/**
 * Alertas como cartões sobrepostos: só o atual fica visível, com até duas bordas atrás
 * e setas para navegar quando há mais de um.
 */
export function AlertDeck({ deck, pending = true, icon, label, suffix, pos, onPrev, onNext, region, children }) {
  const border = pending ? "var(--danger)" : "var(--n-200)";
  return (
    <div role={region ? "region" : undefined} aria-label={region} style={{ position: "relative", paddingBottom: deck.pad }}>
      {deck.layers.map((ly, i) => <div key={i} style={ly} />)}
      <div
        style={{
          display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", background: "var(--n-000)",
          border: `1px solid ${border}`, borderTop: `3px solid ${pending ? "var(--danger)" : "var(--n-350)"}`, borderRadius: 12,
          position: "relative", zIndex: 5
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px 12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 180px", minWidth: 0, ...eyebrow, fontWeight: 500, color: pending ? "#A8402E" : "#4B5046" }}>
            <Icon name={icon} size="md" />
            {label}
            {suffix}
          </div>
          {pos ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              <IconButton icon="chevron-left" label="Alerta anterior" onClick={onPrev} />
              <span style={{ ...mono(12, "var(--n-700)"), whiteSpace: "nowrap" }}>Alerta {pos}</span>
              <IconButton icon="chevron-right" label="Próximo alerta" onClick={onNext} />
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Barra empilhada de dataviz: 2px de superfície entre segmentos e tooltip em cada um. */
export function SegmentBar({ segments, total, unit }) {
  const shown = segments.filter((g) => g.n > 0);
  const last = shown.length - 1;
  return (
    <div style={{ display: "flex", gap: 2, height: 12 }}>
      {shown.map((g, i) => {
        const text = `${g.label}: ${g.n} de ${total} ${unit}`;
        const l = i === 0 ? 99 : 0, r = i === last ? 99 : 0;
        return (
          <Tooltip key={g.label} content={text} style={{ width: g.width, display: "block" }}>
            <span tabIndex={0} aria-label={text} style={{ display: "block", height: 12, background: g.color, borderRadius: `${l}px ${r}px ${r}px ${l}px` }} />
          </Tooltip>
        );
      })}
    </div>
  );
}

export const legendDot = (background) => ({ width: 12, height: 12, borderRadius: 99, background });

