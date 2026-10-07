import React from "react";
import { AnimatedLogo } from "./ds/index.js";
import { BRAND_BAR_H } from "./BrandBar.jsx";

// A animação dura até o logo completo (5 s) e o componente avisa com o evento "ended".
// Margem de segurança caso o evento não chegue; com movimento reduzido o logo já vem completo.
const MAX_MS = 6500;
const REDUCED_MS = 900;

/**
 * Abertura do Workspace: a barra superior do Workspace fica no topo e o logo animado em papel
 * ocupa o centro da área abaixo dela; depois segue para o Dashboard.
 */
export function Splash({ header, onDone }) {
  const logo = React.useRef(null);
  const done = React.useRef(false);
  const finish = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    done.current = false; // o StrictMode do React monta duas vezes em desenvolvimento
    const el = logo.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onEnded = () => setTimeout(finish, 400); // segura o logo completo por um instante
    el && el.addEventListener("ended", onEnded);
    const guard = setTimeout(finish, reduced ? REDUCED_MS : MAX_MS);
    // Teclas pulam a abertura, menos quando o foco está num link ou botão da barra (ex.: Enter em "Sair").
    const skip = (e) => { if (e.target && e.target.closest && e.target.closest("a, button")) return; finish(); };
    window.addEventListener("keydown", skip);
    return () => {
      done.current = true; // saiu da abertura por outro caminho (Sair, logo): nada mais dispara onDone
      el && el.removeEventListener("ended", onEnded);
      clearTimeout(guard);
      window.removeEventListener("keydown", skip);
    };
  }, [finish]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--brand-paper)" }}>
      {header}
      <div
        role="status"
        aria-label="Abrindo o Workspace"
        onClick={finish}
        style={{ height: `calc(100vh - ${BRAND_BAR_H}px)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <AnimatedLogo ref={logo} variant="paper" bare once style={{ width: "min(420px, 72vw)" }} />
      </div>
    </div>
  );
}
