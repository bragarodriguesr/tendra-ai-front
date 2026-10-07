import React from "react";
import { WebsiteApp } from "./site/WebsiteApp.jsx";
import { WorkspaceApp, WorkspaceBarActions } from "./workspace/WorkspaceApp.jsx";
import { buildView } from "./workspace/viewModel.js";
import { LoginPage } from "./LoginPage.jsx";
import { Splash } from "./Splash.jsx";
import { BrandBar } from "./BrandBar.jsx";
import { Button } from "./ds/index.js";
import { useWorkspace } from "./workspace/useWorkspace.js";

/**
 * Site institucional, login, abertura e Workspace numa só página. Site e Workspace ficam montados e
 * alternam sem recarregar, então cada um volta exatamente onde o usuário estava.
 */
export function App() {
  const { state, ws } = useWorkspace();
  const view = state.view;
  // "Sair" volta à Home do site: remontar o site o leva para a página inicial.
  const [siteKey, setSiteKey] = React.useState(0);
  const show = (v) => (view === v ? { display: "block" } : { display: "none" });
  const logout = () => { setSiteKey((k) => k + 1); ws.setState({ navOpen: false }); ws.showView("site"); };
  return (
    <>
      <div style={view === "site" ? { minHeight: "100vh", background: "#F5F6F1" } : { display: "none" }}>
        <WebsiteApp key={siteKey} onLogin={() => ws.showView("login")} />
      </div>
      {view === "login" ? (
        <LoginPage ws={ws} onSite={() => ws.showView("site")} onEnter={() => { ws.go("dashboard"); ws.showView("splash"); }} />
      ) : null}
      {view === "splash" ? (
        <Splash
          onDone={() => ws.showView("app")}
          // Mesma barra do Workspace, para a troca para o Dashboard não mexer no topo da tela.
          header={
            <BrandBar logoLabel="Tendra.ai — voltar ao site" onLogo={() => ws.showView("site")} leading={<span className="tdr-splash-menu-space" aria-hidden="true" />}>
              <WorkspaceBarActions v={buildView(state, ws)} state={state} ws={ws} onLogout={logout} />
            </BrandBar>
          }
        />
      ) : null}
      <div style={show("app")}>
        <WorkspaceApp
          state={state}
          ws={ws}
          onSite={() => ws.showView("site")}
          onLogout={logout}
        />
      </div>
    </>
  );
}
