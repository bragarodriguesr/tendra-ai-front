import React from "react";
import { SiteHeader } from "./SiteHeader.jsx";
import { SiteFooter } from "./SiteFooter.jsx";
import { HomePage } from "./HomePage.jsx";
import { PricingPage } from "./PricingPage.jsx";
import { ContactPage } from "./ContactPage.jsx";
import { BRAND_BAR_H } from "../BrandBar.jsx";
import "./site.css";

export function WebsiteApp({ onLogin }) {
  const [page, setPage] = React.useState("home");
  const [anchor, setAnchor] = React.useState(null);

  // Depois de trocar de página: rola até a seção pedida (descontando a barra fixa) ou volta ao topo.
  React.useEffect(() => {
    const el = anchor && document.getElementById(anchor);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - BRAND_BAR_H, behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [page, anchor]);

  const onNav = (l) => {
    if (l.section) { setPage("home"); setAnchor(null); requestAnimationFrame(() => setAnchor(l.section)); }
    else { setAnchor(null); setPage(l.page); }
  };
  const onPage = (p) => onNav({ page: p });

  return (
    <div className="tdr-site" style={{ background: "var(--surface-page)", minHeight: "100%" }}>
      <SiteHeader page={page} onNav={onNav} onLogin={onLogin} />
      {page === "home" ? <HomePage onPage={onPage} /> : null}
      {page === "precos" ? <PricingPage /> : null}
      {page === "contato" ? <ContactPage onPage={onPage} /> : null}
      <SiteFooter />
    </div>
  );
}
