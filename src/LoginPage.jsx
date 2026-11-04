import React from "react";
import { Button, Field, Icon, Input, MonoLabel } from "./ds/index.js";
import { BRAND_BAR_H, BrandBar } from "./BrandBar.jsx";
import { MENSAGEM_DADOS_SINTETICOS } from "./api.js";

/**
 * Tela de login. No modo compartilhado (fase D, D9), e-mail e senha de verdade, conferidos pelo
 * backend, com as mensagens de recusa (401, 429, 503) e o aviso de dados sintéticos (D12). No modo
 * local, o login continua ilustrativo: "Entrar no Tendra.ai" leva ao Dashboard do Workspace.
 * À esquerda, o banner da marca; à direita, o formulário.
 */
export function LoginPage({ ws, onEnter, onSite }) {
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState(null);
  const compartilhado = ws.s.modo === "compartilhado";
  const name = ws.name();
  const email = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@empresa.com.br";

  const enter = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErro(null);
    if (!compartilhado) {
      setTimeout(() => { setLoading(false); onEnter(); }, 700);
      return;
    }
    const dados = new FormData(e.currentTarget);
    try {
      await ws.entrar(String(dados.get("email") || ""), String(dados.get("senha") || ""));
      setLoading(false);
      onEnter();
    } catch (falha) {
      setLoading(false);
      setErro(falha.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      {/* No celular, o espaço do botão de menu do site: o logo fica na mesma posição em todas as telas. */}
      <BrandBar logoLabel="Tendra.ai — voltar ao site" onLogo={onSite} leading={<span className="tdr-splash-menu-space" aria-hidden="true" />} />
      <div className="tdr-login" style={{ minHeight: `calc(100vh - ${BRAND_BAR_H}px)` }}>
        <div className="tdr-login-aside">
          <div style={{ display: "grid", gap: 20, maxWidth: 460 }}>
            <MonoLabel tone="accent">Workspace</MonoLabel>
            <h2 className="tdr-login-headline">O seu segundo <span className="tdr-login-mark">cérebro</span> para responder RFPs e editais.</h2>
          </div>
        </div>
        <div className="tdr-login-main">
          <div style={{ width: "100%", maxWidth: 380, display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, letterSpacing: "-0.03em", color: "var(--text-strong)" }}>Entrar na Tendra.ai</h1>
              <span style={{ fontSize: 15, color: "var(--text-body)" }}>Use o e-mail corporativo cadastrado pelo administrador.</span>
            </div>
            {compartilhado ? <AvisoDeDadosSinteticos /> : null}
            <form onSubmit={enter} noValidate style={{ display: "grid", gap: 16 }}>
              {compartilhado ? (
                <>
                  <Field label="E-mail" htmlFor="lg-mail"><Input id="lg-mail" name="email" type="email" autoComplete="username" required /></Field>
                  <Field label="Senha" htmlFor="lg-pass"><Input id="lg-pass" name="senha" type="password" icon="lock" autoComplete="current-password" required /></Field>
                </>
              ) : (
                <>
                  <Field label="E-mail" htmlFor="lg-mail"><Input key={email} id="lg-mail" type="email" autoComplete="username" defaultValue={email} /></Field>
                  <Field label="Senha" htmlFor="lg-pass"><Input id="lg-pass" type="password" icon="lock" autoComplete="current-password" defaultValue="demonstracao" /></Field>
                </>
              )}
              {erro ? <div role="alert" style={{ fontSize: 14, color: "var(--danger)" }}>{erro}</div> : null}
              <Button type="submit" fullWidth loading={loading} iconEnd="arrow-right">Entrar no Tendra.ai</Button>
            </form>
            <a href="#" onClick={(e) => { e.preventDefault(); onSite(); }} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="chevron-left" size="sm" />Voltar para o site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Aviso fixo do ambiente compartilhado (cenário D12). */
export function AvisoDeDadosSinteticos({ compacto = false }) {
  return (
    <div role="note" style={{ display: "flex", gap: 8, alignItems: "flex-start", border: "1px solid var(--n-200)", background: "var(--n-050)", borderRadius: 10, padding: compacto ? "8px 10px" : "10px 12px", fontSize: compacto ? 12 : 13, lineHeight: 1.45, color: "var(--n-700)" }}>
      <Icon name="info" size="sm" />
      <span>{MENSAGEM_DADOS_SINTETICOS}</span>
    </div>
  );
}
