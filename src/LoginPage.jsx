import React from "react";
import { Button, Field, Icon, Input, MonoLabel, SourceTrail } from "./ds/index.js";
import { BRAND_BAR_H, BrandBar } from "./BrandBar.jsx";
import { code } from "./workspace/data.js";

/**
 * Login ilustrativo (sem validação): "Entrar no Tendra.ai" leva ao Dashboard do Workspace.
 * À esquerda, um resumo do que espera revisão; à direita, o formulário.
 */
export function LoginPage({ ws, state, onEnter, onSite }) {
  const [loading, setLoading] = React.useState(false);
  const name = ws.name();
  const items = ws.itemsOf("t1", state);
  const open = items.filter((i) => i.st !== "aprovada").length;
  const last = items.filter((i) => i.st === "aprovada" && i.at).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
  const email = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@empresa.com.br";

  const enter = (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onEnter(); }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      <BrandBar logoLabel="Tendra.ai — voltar ao site" onLogo={onSite} />
      <div className="tdr-login" style={{ minHeight: `calc(100vh - ${BRAND_BAR_H}px)` }}>
        <div className="tdr-login-aside">
          <div style={{ display: "grid", gap: 20, maxWidth: 460 }}>
            <MonoLabel tone="accent">Workspace</MonoLabel>
            <div className="tdr-login-headline">
              {open} {open === 1 ? "item espera" : "itens esperam"} revisão ou aprovação no questionário do Banco Meridian.
            </div>
            {last ? <SourceTrail tone="ink" label="Última atividade" sources={[{ file: `${code(last)} aprovado por ${last.by} · ${last.at}` }]} /> : null}
          </div>
        </div>
        <div className="tdr-login-main">
          <div style={{ width: "100%", maxWidth: 380, display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, letterSpacing: "-0.03em", color: "var(--text-strong)" }}>Entrar na Tendra.ai</h1>
              <span style={{ fontSize: 15, color: "var(--text-body)" }}>Use o e-mail corporativo cadastrado pelo administrador.</span>
            </div>
            <form onSubmit={enter} noValidate style={{ display: "grid", gap: 16 }}>
              <Field label="E-mail" htmlFor="lg-mail"><Input key={email} id="lg-mail" type="email" autoComplete="username" defaultValue={email} /></Field>
              <Field label="Senha" htmlFor="lg-pass"><Input id="lg-pass" type="password" icon="lock" autoComplete="current-password" defaultValue="demonstracao" /></Field>
              <Button type="submit" fullWidth loading={loading} iconEnd="arrow-right">Entrar no Tendra.ai</Button>
            </form>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-meta)" }}>
              Protótipo: os dados são ilustrativos e não há validação. Entrar leva ao Dashboard como {name} ({state.role}).
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); onSite(); }} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="chevron-left" size="sm" />Voltar para o site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
