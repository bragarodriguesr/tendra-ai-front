import React from "react";
import { SiteHeader } from "./SiteHeader.jsx";
import { SiteFooter } from "./SiteFooter.jsx";
import { HomePage } from "./HomePage.jsx";
import { PricingPage } from "./PricingPage.jsx";

export function WebsiteApp({ onWorkspace }) {
  const [page, setPage] = React.useState("home");
  React.useEffect(() => { window.scrollTo(0, 0); }, [page]);
  return (
    <div style={{ background: "var(--surface-page)", minHeight: "100%" }}>
      <SiteHeader onPage={setPage} onWorkspace={onWorkspace} />
      {page === "home" ? <HomePage onPage={setPage} /> : null}
      {page === "precos" ? <PricingPage /> : null}
      <SiteFooter />
    </div>
  );
}
