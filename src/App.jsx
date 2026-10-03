import React from "react";
import { WebsiteApp } from "./site/WebsiteApp.jsx";
import { WorkspaceApp } from "./workspace/WorkspaceApp.jsx";
import { useWorkspace } from "./workspace/useWorkspace.js";

/**
 * Site institucional e Workspace numa só página. As duas visões ficam montadas e
 * alternam sem recarregar, então cada uma volta exatamente onde o usuário estava.
 */
export function App() {
  const { state, ws } = useWorkspace();
  const onSite = state.view === "site";
  return (
    <>
      <div style={onSite ? { minHeight: "100vh", background: "#F5F6F1" } : { display: "none" }}>
        <WebsiteApp onWorkspace={() => { ws.go("dashboard"); ws.showView("app"); }} />
      </div>
      <div style={onSite ? { display: "none" } : { display: "block" }}>
        <WorkspaceApp state={state} ws={ws} onSite={() => ws.showView("site")} />
      </div>
    </>
  );
}
