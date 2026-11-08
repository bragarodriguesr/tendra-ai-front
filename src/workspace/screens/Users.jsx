import React from "react";
import { Badge, Button, Checkbox, EmptyState, Field, Icon, Input, Select, Switch, Tooltip } from "../../ds/index.js";
import { Page, PageHeader, card, mono } from "../ui.jsx";

/**
 * Painel de Usuários (fase Q, docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md): só para o Aprovador. Nesta fase,
 * com dados de exemplo no navegador; gravar no backend e consultar o Supabase Auth são alterações futuras.
 */

const COLS = "minmax(170px,1.3fr) 140px minmax(170px,1.6fr) 96px 64px";
const rowGrid = { display: "grid", gridTemplateColumns: COLS, gap: 12, alignItems: "center" };
const TITULOS = [["pessoa", "Pessoa"], ["papel", "Papel"], ["areas", "Áreas"], ["situacao", "Situação"]];
const DICA_PROPRIA = "Peça a outro Aprovador para mudar o seu acesso.";

/** Cabeçalho no padrão das tabelas de Tarefas e da Base; os títulos ordenam, menos Ações (Q2b). */
function Cabecalho({ ordem, onOrdenar }) {
  return (
    <div role="row" style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", borderRadius: "14px 14px 0 0", ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
      {TITULOS.map(([coluna, titulo]) => {
        const direcao = ordem && ordem.coluna === coluna ? ordem.direcao : null;
        return (
          <div key={coluna} role="columnheader" aria-sort={direcao === "asc" ? "ascending" : direcao === "desc" ? "descending" : "none"}>
            <button
              type="button" onClick={() => onOrdenar(coluna)}
              aria-label={`Ordenar por ${titulo}${direcao ? `, ordem ${direcao === "asc" ? "crescente" : "decrescente"}` : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: 0, border: 0, background: "transparent", font: "inherit", letterSpacing: "inherit", textTransform: "inherit", color: "inherit", cursor: "pointer" }}
            >
              {titulo}
              {direcao ? <Icon name="chevron-down" size="sm" style={direcao === "asc" ? { transform: "rotate(180deg)" } : undefined} /> : null}
            </button>
          </div>
        );
      })}
      <span role="columnheader">Ações</span>
    </div>
  );
}

/**
 * Áreas (Q6): fechada, só as etiquetas, sem borda nem seta, como o "Geral" do Revisor; o clique nelas
 * abre a lista, que as cobre como a lista de um seletor. Fecha com um clique fora ou com Esc.
 */
function Areas({ u, areas, ws }) {
  const raiz = React.useRef(null);
  React.useEffect(() => {
    if (!u.areasAbertas) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) ws.abrirAreasDoUsuario(u.email); };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [u.areasAbertas, u.email, ws]);

  const etiquetas = u.areasNaTela.map((a) => <Badge key={a} tone={a === "Geral" ? "neutral" : "approved"}>{a}</Badge>);
  if (u.papel !== "Aprovador") return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{etiquetas}</div>;
  return (
    <div ref={raiz} style={{ position: "relative" }}>
      <Tooltip content="Escolher as áreas" placement="top">
        <button
          type="button" className="tdr-areas" disabled={!u.ativo} onClick={() => ws.abrirAreasDoUsuario(u.email)}
          aria-haspopup="true" aria-expanded={u.areasAbertas} aria-label={`Áreas de ${u.nome}: ${u.areasNaTela.join(", ")}. Escolher as áreas`}
          style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 2, margin: -2, border: "1px solid transparent", borderRadius: "var(--radius-sm)", background: "transparent", cursor: u.ativo ? "pointer" : "not-allowed", textAlign: "left" }}
        >
          {etiquetas}
        </button>
      </Tooltip>
      {u.areasAbertas ? (
        <div role="group" aria-label={`Áreas de ${u.nome}`} style={{ position: "absolute", top: 0, left: 0, zIndex: 70, width: 260, boxSizing: "border-box", padding: 8, display: "grid", background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-popover)" }}>
          {areas.map((a) => (
            <Checkbox key={a} label={a} checked={u.areas.includes(a)} onChange={() => ws.marcarAreaDoUsuario(u.email, a)} style={{ minHeight: 36, padding: "0 4px" }} />
          ))}
          <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--text-meta)", padding: "6px 4px 2px" }}>C-Level vale por todas e não se combina com outras. Sem área, aprova só as perguntas Geral.</span>
        </div>
      ) : null}
    </div>
  );
}

function Papel({ u, ws }) {
  const select = <Select size="sm" options={["Revisor", "Aprovador"]} value={u.papel} disabled={u.propria || !u.ativo} aria-label={`Papel de ${u.nome}`} onChange={(e) => ws.mudarPapelDoUsuario(u.email, e.target.value)} />;
  return u.propria ? <Tooltip content={DICA_PROPRIA} placement="top"><div>{select}</div></Tooltip> : select;
}

function Situacao({ u }) {
  return <Badge tone={u.ativo ? "approved" : "neutral"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>;
}

/** Toggle do acesso no padrão da Base de conhecimento (Q7). */
function Acesso({ u, ws }) {
  const rotulo = u.propria ? DICA_PROPRIA : u.ativo ? "Desativar acesso" : "Reativar acesso";
  return (
    <Tooltip content={rotulo} placement="top">
      <Switch checked={u.ativo} disabled={u.propria} onChange={() => ws.alternarAcessoDoUsuario(u.email)} aria-label={`${rotulo} de ${u.nome}`} />
    </Tooltip>
  );
}

function Pessoa({ u }) {
  return (
    <div style={{ minWidth: 0, display: "grid", gap: 2 }}>
      <span style={{ fontWeight: 600, color: u.ativo ? "var(--n-900)" : "var(--n-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</span>
      <span style={{ ...mono(12, "var(--n-400)"), overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</span>
    </div>
  );
}

/** Formulário de adicionar (Q3 e Q4): só aparece depois do clique em "Adicionar usuário". */
function Adicionar({ ws, isMobile }) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [erro, setErro] = React.useState(null);
  const enviar = (e) => {
    e.preventDefault();
    const recusa = ws.adicionarUsuario(nome, email);
    if (recusa) setErro(recusa);
  };
  return (
    <form onSubmit={enviar} noValidate aria-label="Adicionar usuário" style={card(14, { padding: "16px 20px", display: "grid", gap: 10 })}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1.2fr) auto auto", gap: 12, alignItems: "end" }}>
        <Field label="Nome" htmlFor="us-nome"><Input id="us-nome" size="sm" autoFocus placeholder="Ana Souza" value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} /></Field>
        <Field label="E-mail da conta" htmlFor="us-email"><Input id="us-email" size="sm" type="email" placeholder="ana.souza@empresa.com.br" value={email} onChange={(e) => { setEmail(e.target.value); setErro(null); }} /></Field>
        <Button size="sm" variant="secondary" onClick={() => ws.abrirAdicionarUsuario(false)}>Cancelar</Button>
        <Button size="sm" type="submit">Adicionar</Button>
      </div>
      {erro ? <div role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>{erro}</div> : null}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "var(--n-500)" }}>
        <Icon name="info" size="sm" />A conta precisa existir no painel do Supabase. O acesso nasce como Revisor, área <Badge>Geral</Badge>
      </div>
    </form>
  );
}

export function Users({ v, ws, pad, isMobile }) {
  const p = v.painel;
  if (!v.isA) {
    return (
      <Page pad={pad}>
        <EmptyState icon="lock" title="Só o Aprovador gerencia usuários." description="Peça a um Aprovador da sua organização para mudar acessos, papéis e áreas." />
      </Page>
    );
  }
  return (
    <Page pad={pad}>
      <PageHeader
        eyebrow="Gestão de acessos" title="Painel de Usuários"
        action={<Button icon="plus" onClick={() => ws.abrirAdicionarUsuario(!p.adicionando)} aria-expanded={p.adicionando}>Adicionar usuário</Button>}
      />
      <span style={{ marginTop: -12, color: "var(--n-500)" }}>{p.ativos} {p.ativos === 1 ? "pessoa" : "pessoas"} com acesso</span>
      <div role="note" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--n-600)" }}>
        <Icon name="info" size="sm" />Dados de exemplo: as mudanças desta tela ainda não são gravadas e voltam ao recarregar a página.
      </div>
      {p.adicionando ? <Adicionar ws={ws} isMobile={isMobile} /> : null}

      {isMobile ? (
        // Celular (Q11): um cartão por pessoa, com as ações no rodapé.
        <div style={{ display: "grid", gap: 12 }}>
          {p.linhas.map((u) => (
            <div key={u.email} style={card(14, { padding: 16, display: "grid", gap: 12, background: u.ativo ? "var(--n-000)" : "var(--n-050)" })}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><Pessoa u={u} /><Situacao u={u} /></div>
              <Areas u={u} areas={p.areasDoAprovador} ws={ws} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid var(--n-100)", paddingTop: 12 }}>
                <div style={{ width: 160 }}><Papel u={u} ws={ws} /></div>
                <Acesso u={u} ws={ws} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div role="table" aria-label="Usuários da organização" style={card(14)}>
          <Cabecalho ordem={p.ordem} onOrdenar={ws.ordenarPainel} />
          {p.linhas.map((u) => (
            <div key={u.email} role="row" style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)", background: u.ativo ? "transparent" : "var(--n-050)" }}>
              <Pessoa u={u} />
              <Papel u={u} ws={ws} />
              <Areas u={u} areas={p.areasDoAprovador} ws={ws} />
              <div><Situacao u={u} /></div>
              <Acesso u={u} ws={ws} />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
