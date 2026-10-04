import React from "react";
import { Button, IconButton, Logo, SidebarNav } from "../ds/index.js";
import { buildView } from "./viewModel.js";
import { MONO } from "./ui.jsx";
import { ConfirmEditDialog, SourceDrawer, ToastHost } from "./overlays.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { Tasks } from "./screens/Tasks.jsx";
import { NewTask } from "./screens/NewTask.jsx";
import { TaskDetail } from "./screens/TaskDetail.jsx";
import { Review } from "./screens/Review.jsx";
import { Export } from "./screens/Export.jsx";
import { History } from "./screens/History.jsx";
import { Base } from "./screens/Base.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";

const TOPBAR_H = 56;
const SIDEBAR_W = 272;
const MOBILE_BELOW = 900;

const SCREENS = { dashboard: Dashboard, tasks: Tasks, new: NewTask, task: TaskDetail, export: Export, history: History, base: Base, onboarding: Onboarding };

function Sidebar({ v, ws, state, isMobile }) {
  const isA = state.role === "Aprovador";
  return (
    <div
      className="tdr-sidebar"
      aria-hidden={isMobile && !state.navOpen ? true : undefined}
      style={{
        display: "flex", flexDirection: "column", borderRight: "1px solid var(--n-200)", background: "var(--n-000)", minHeight: 0,
        ...(isMobile ? { position: "absolute", top: 0, bottom: 0, left: 0, width: SIDEBAR_W, zIndex: 50, boxShadow: "var(--shadow-overlay)", ...(state.navOpen ? null : { visibility: "hidden", transform: "translateX(-100%)" }) } : null)
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
        <SidebarNav groups={v.navGroups} value={v.navValue} width="100%" aria-label="Workspace" />
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--n-200)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{v.userName}</span>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--n-400)" }}>{state.role}</span>
        </div>
        <div style={{ border: "1px dashed var(--n-350)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--n-400)" }}>Painel de demo</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button size="sm" fullWidth variant={isA ? "secondary" : "primary"} aria-pressed={!isA} onClick={() => ws.setState({ role: "Revisor" })}>Revisor</Button>
            <Button size="sm" fullWidth variant={isA ? "primary" : "secondary"} aria-pressed={isA} onClick={() => ws.setState({ role: "Aprovador" })}>Aprovador</Button>
          </div>
          <Button size="sm" fullWidth variant="secondary" onClick={ws.demoAll}>Aprovar todos os itens</Button>
        </div>
      </div>
    </div>
  );
}

/** Área do produto: barra superior fixa, menu lateral e as telas T0–T9. */
export function WorkspaceApp({ state, ws, onSite }) {
  const v = buildView(state, ws);
  const isMobile = state.vw < MOBILE_BELOW;
  const pad = isMobile ? "20px 16px" : "40px";
  const Screen = SCREENS[state.screen];
  const props = { v, ws, state, pad, isMobile };

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 60, height: TOPBAR_H, boxSizing: "border-box", display: "flex", alignItems: "center", gap: isMobile ? 4 : 12, padding: isMobile ? "0 12px 0 8px" : "0 20px", background: "var(--n-000)", borderBottom: "1px solid var(--n-200)" }}>
        {isMobile ? <IconButton icon="menu" label="Abrir menu" aria-expanded={state.navOpen} onClick={() => ws.setState({ navOpen: !state.navOpen })} /> : null}
        <a href="#" aria-label="Tendra.ai — voltar ao site" className="tdr-logo-link" onClick={(e) => { e.preventDefault(); onSite(); }} style={{ display: "flex", marginRight: 8, textDecoration: "none" }}>
          <Logo size={28} variant="paper" />
        </a>
        <div style={{ marginLeft: "auto", display: "flex" }}>
          <Button size="sm" variant="accent" icon="layout-grid" aria-current="page" onClick={() => ws.go("dashboard")}><span><span className="tdr-ws-prefix">Produto · </span>Workspace</span></Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : `${SIDEBAR_W}px minmax(0,1fr)`, height: `calc(100vh - ${TOPBAR_H}px)`, background: "var(--n-050)", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: "var(--n-700)", position: "relative", overflow: "hidden" }}>
        <ToastHost toast={state.toast} isMobile={isMobile} onClose={() => ws.setState({ toast: null })} />
        {isMobile && state.navOpen ? <div onClick={() => ws.setState({ navOpen: false })} style={{ position: "absolute", inset: 0, zIndex: 49, background: "rgba(18,20,15,.4)" }} /> : null}
        <Sidebar v={v} ws={ws} state={state} isMobile={isMobile} />

        <main style={{ minWidth: 0, minHeight: 0, overflow: "auto", position: "relative" }}>
          {state.screen === "review" ? <Review {...props} height={`calc(100vh - ${TOPBAR_H}px)`} /> : Screen ? <Screen {...props} /> : null}
        </main>

        {v.drawer ? <SourceDrawer dr={v.drawer} onClose={() => ws.setState({ drawer: null })} /> : null}
        {state.dialog ? <ConfirmEditDialog onCancel={() => ws.setState({ dialog: false })} onConfirm={() => ws.confirmEdit(v.cur && v.cur.id)} /> : null}
      </div>
    </div>
  );
}
