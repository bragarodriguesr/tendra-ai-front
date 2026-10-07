import React from "react";
import { Button, IconButton } from "../ds/index.js";
import { BrandBar } from "../BrandBar.jsx";

// Itens do menu do site. "section" rola a Home até a seção; "page" abre outra página.
export const SITE_LINKS = [
  { label: "Plataforma", section: "como-funciona" },
  { label: "Casos de uso", section: "por-que-confiam" },
  { label: "Contato", page: "contato" },
  { label: "Preços", page: "precos" }
];

function SiteLinks({ page, onNav, className, onPick }) {
  return (
    <nav aria-label="Site" className={className}>
      {SITE_LINKS.map((l) => {
        const on = !!l.page && l.page === page;
        return (
          <a
            key={l.label}
            href="#"
            className="tdr-site-link"
            aria-current={on ? "page" : undefined}
            onClick={(e) => { e.preventDefault(); onPick && onPick(); onNav(l); }}
          >
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}

export function SiteHeader({ page, onNav, onLogin }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <BrandBar
        logoLabel="Tendra.ai — página inicial"
        onLogo={() => { setOpen(false); onNav({ page: "home" }); }}
        leading={<IconButton className="tdr-site-menu-btn" icon={open ? "x" : "menu"} variant="inverse" label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(!open)} />}
        links={<SiteLinks page={page} onNav={onNav} className="tdr-site-links" />}
      >
        <Button size="sm" variant="inverse-secondary" icon="log-in" onClick={() => { setOpen(false); onLogin(); }}>Entrar</Button>
      </BrandBar>
      {open ? <SiteLinks page={page} onNav={onNav} onPick={() => setOpen(false)} className="tdr-site-links-mobile" /> : null}
    </>
  );
}
