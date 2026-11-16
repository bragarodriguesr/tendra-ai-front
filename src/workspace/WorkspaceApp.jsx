import React from "react";
import { Button, Icon, Logo, TopBar, SidebarHeader, SidebarNav, SidebarProvider, Sidebar as SidebarPanel, SidebarTrigger, SidebarContent, SidebarFooter, SidebarTooltip, useSidebar } from "../ds/index.js";
import { BRAND_BAR_H } from "../BrandBar.jsx";
import { buildView } from "./viewModel.js";
import { MENSAGEM_DADOS_SINTETICOS } from "../api.js";
import { UserMenu } from "./UserMenu.jsx";
import { AlertsMenu } from "./AlertsMenu.jsx";
import { ConfirmArchiveTaskDialog, ConfirmDeleteTaskDialog, ConfirmDownloadDialog, ConfirmEditDialog, ConfirmUserChangeDialog, FinishTaskDialog, SourceDrawer, TaskDetailsDrawer, ToastHost } from "./overlays.jsx";
import { Dashboard } from "./screens/Dashboard.jsx";
import { Tasks } from "./screens/Tasks.jsx";
import { NewTask } from "./screens/NewTask.jsx";
import { TaskDetail } from "./screens/TaskDetail.jsx";
import { Review } from "./screens/Review.jsx";
import { Export } from "./screens/Export.jsx";
import { History } from "./screens/History.jsx";
import { Base } from "./screens/Base.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";
import { Users } from "./screens/Users.jsx";

const TOPBAR_H = BRAND_BAR_H;
const MOBILE_BELOW = 900;

const SCREENS = { dashboard: Dashboard, tasks: Tasks, finalizadas: Tasks, arquivadas: Tasks, new: NewTask, task: TaskDetail, export: Export, history: History, base: Base, onboarding: Onboarding, usuarios: Users };

function WorkspaceSidebar({ v, ws, state, collapsed, onSite }) {
  const { isMobile, closeReason } = useSidebar();
  return (
    <SidebarPanel>
      <SidebarHeader>
        <a href="#" className="tdr-sidebar-brand" aria-label="Tendra.ai — voltar ao site" onClick={event => { event.preventDefault(); ws.setState({ navOpen: false }); onSite(); }}>
          {/* Mesmo logo do site (28px, a --brandbar-pad da borda). Recolhido, só o nome some: o símbolo não se move. */}
          <Logo variant="ink" size={28} />
        </a>
      </SidebarHeader>
      <SidebarContent onClickCapture={event => {
        if (isMobile && event.target.closest('a')) closeReason.current = 'navigate';
      }}>
        <SidebarNav groups={v.navGroups} value={v.navValue} width="100%" collapsed={collapsed} aria-label="Workspace" />
      </SidebarContent>
      {(state.modo === "compartilhado" && !collapsed) || state.tarefasOrigem !== "servidor" ? <SidebarFooter>
        {state.modo === "compartilhado" && !collapsed ? <div role="note" className="tdr-sidebar-warning"><Icon name="info" size={16} /><span>{MENSAGEM_DADOS_SINTETICOS}</span></div> : null}
        {state.tarefasOrigem === "servidor" ? null : collapsed ? (
          <SidebarTooltip content="Aprovar todos os itens">
            <button type="button" className="tdr-sidebar-icon-button" aria-label="Painel de demo: aprovar todos os itens" onClick={ws.demoAll}><Icon name="check-check" size={20} /></button>
          </SidebarTooltip>
        ) : <div className="tdr-sidebar-demo">
          <span className="tdr-sidebar-demo-label">Painel de demo</span>
          <Button fullWidth variant="secondary" onClick={ws.demoAll} style={{ minHeight: 'var(--hit-min)', padding: 'var(--space-2) var(--space-3)' }}>Aprovar todos os itens</Button>
        </div>}
      </SidebarFooter> : null}
    </SidebarPanel>
  );
}

/** Lado direito da barra do Workspace: sino de alertas, usuário e "Sair". Também usado na abertura. */
export function WorkspaceBarActions({ v, state, ws, onLogout }) {
  return (
    <>
      <AlertsMenu alerts={v.taskAlerts} unread={v.alertsUnread} onRead={ws.readAlert} onReadAll={() => ws.readAllAlerts(v.taskAlerts.map((a) => a.key))} />
      <UserMenu name={v.userName} role={state.role} areas={v.userAreas} organization={state.sessao ? state.sessao.organizacao : null} onSwitch={state.sessao ? null : ws.switchRole} onLogout={onLogout} />
      <span className="tdr-bar-logout">
        <Button size="sm" variant="inverse-secondary" icon="log-out" onClick={onLogout}>Sair</Button>
      </span>
    </>
  );
}

/** Área do produto: barra superior fixa, menu lateral e as telas T0–T9. */
function WorkspaceLayout({ state, ws, onSite, onLogout }) {
  const { mainRef } = useSidebar();
  const v = buildView(state, ws);
  const isMobile = state.vw < MOBILE_BELOW;
  // No desktop o menu lateral pode ser recolhido a uma barra só de ícones, para dar mais espaço ao conteúdo.
  const collapsed = !isMobile && state.sideCollapsed;
  const pad = isMobile ? "20px 16px" : "40px";
  const Screen = SCREENS[state.screen];
  const props = { v, ws, state, pad, isMobile };

  return (
    <div className="tdr-workspace-shell">
      <WorkspaceSidebar v={v} ws={ws} state={state} collapsed={collapsed} onSite={onSite} />
      <div className="tdr-workspace-column">
        <TopBar tone="ink" className="tdr-workspace-header" start={<>
          <SidebarTrigger />
          {/* No celular o menu lateral fica fechado: o logo vem depois do botão, como no site. */}
          {isMobile ? <a href="#" className="tdr-logo-link" aria-label="Tendra.ai — voltar ao site" onClick={(e) => { e.preventDefault(); onSite(); }} style={{ display: "flex" }}><Logo variant="ink" size={28} /></a> : null}
        </>} end={<WorkspaceBarActions v={v} state={state} ws={ws} onLogout={onLogout} />} />
        <div className="tdr-workspace-layout">
          <ToastHost toast={state.toast} isMobile={isMobile} onClose={() => ws.setState({ toast: null })} />

          <main ref={mainRef} tabIndex={-1}>
            {state.screen === "review" ? <Review {...props} height={`calc(100vh - ${TOPBAR_H}px)`} /> : Screen ? <Screen {...props} /> : null}
          </main>

          {v.drawer ? <SourceDrawer dr={v.drawer} onClose={() => ws.setState({ drawer: null })} /> : null}
          {v.detalhes ? <TaskDetailsDrawer d={v.detalhes} onClose={ws.closeTaskDetails} /> : null}
          {state.dialog ? <ConfirmEditDialog onCancel={() => ws.setState({ dialog: false })} onConfirm={() => ws.confirmEdit(v.cur && v.cur.id)} /> : null}
          {v.deletingTask ? <ConfirmDeleteTaskDialog task={v.deletingTask} busy={state.excluindo} onCancel={() => ws.setState({ deleting: null })} onConfirm={ws.deleteTask} /> : null}
          {v.downloadTask ? <ConfirmDownloadDialog task={v.downloadTask} onCancel={() => ws.setState({ confirmDownload: null })} onConfirm={ws.confirmDownloadSheet} /> : null}
          {v.finishingTask ? <FinishTaskDialog task={v.finishingTask} busy={state.mudandoSituacao} onCancel={() => ws.setState({ finishing: null })} onConfirm={ws.finishTask} /> : null}
          {v.archivingTask ? <ConfirmArchiveTaskDialog task={v.archivingTask} busy={state.mudandoSituacao} onCancel={() => ws.setState({ archiving: null })} onConfirm={ws.archiveTask} /> : null}
          {v.painel.confirmacao ? <ConfirmUserChangeDialog confirmacao={v.painel.confirmacao} areas={v.painel.areasDoAprovador} onMarcarArea={ws.marcarAreaDaConfirmacao} onCancel={() => ws.setState({ painelConfirmacao: null })} onConfirm={ws.confirmarMudancaDeUsuario} /> : null}
        </div>
      </div>
    </div>
  );
}

/** Estado compartilhado com ws.go/logout; provider inclui trigger e painel. */
export function WorkspaceApp(props) {
  const { state, ws } = props;
  const setOpen = React.useCallback(open => ws.setState({ sideCollapsed: !open }), [ws]);
  const setOpenMobile = React.useCallback(navOpen => ws.setState({ navOpen }), [ws]);
  React.useEffect(() => {
    if (state.view !== 'app' && state.navOpen) setOpenMobile(false);
  }, [state.view, state.navOpen, setOpenMobile]);
  return <SidebarProvider open={!state.sideCollapsed} onOpenChange={setOpen} openMobile={state.navOpen && state.view === 'app'} onOpenMobileChange={setOpenMobile} isMobile={state.vw < MOBILE_BELOW} enabled={state.view === 'app'}>
    <WorkspaceLayout {...props} />
  </SidebarProvider>;
}
