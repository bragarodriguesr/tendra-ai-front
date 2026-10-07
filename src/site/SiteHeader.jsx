import React from "react";
import { Button } from "../ds/index.js";
import { BrandBar, WorkspaceLabel } from "../BrandBar.jsx";

export function SiteHeader({ onPage, onWorkspace }) {
  return (
    <BrandBar logoLabel="Tendra.ai — página inicial" onLogo={() => onPage("home")}>
      <Button size="sm" variant="inverse-secondary" icon="layout-grid" onClick={onWorkspace}><WorkspaceLabel /></Button>
      <Button size="sm" variant="accent" onClick={() => onPage("precos")}>Preços</Button>
    </BrandBar>
  );
}
