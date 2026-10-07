import React from "react";
import { AnimatedLogo } from "./ds/index.js";

// A animação dura até o logo completo (5 s) e o componente avisa com o evento "ended".
// Margem de segurança caso o evento não chegue; com movimento reduzido o logo já vem completo.
const MAX_MS = 6500;
const REDUCED_MS = 900;

/** Abertura do Workspace: logo animado em papel no centro da tela, depois segue para o Dashboard. */
export function Splash({ onDone }) {
  const logo = React.useRef(null);
  const done = React.useRef(false);
  const finish = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    const el = logo.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onEnded = () => setTimeout(finish, 400); // segura o logo completo por um instante
    el && el.addEventListener("ended", onEnded);
    const guard = setTimeout(finish, reduced ? REDUCED_MS : MAX_MS);
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    return () => {
      el && el.removeEventListener("ended", onEnded);
      clearTimeout(guard);
      window.removeEventListener("keydown", skip);
    };
  }, [finish]);

  return (
    <div
      role="status"
      aria-label="Abrindo o Workspace"
      onClick={finish}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--brand-paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <AnimatedLogo ref={logo} variant="paper" bare once style={{ width: "min(420px, 72vw)" }} />
    </div>
  );
}
