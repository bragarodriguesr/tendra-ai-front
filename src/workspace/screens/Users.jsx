import React from "react";
import { Badge, Button, Checkbox, EmptyState, Field, Icon, IconButton, Input, Select, Switch, Tooltip } from "../../ds/index.js";
import { Page, PageHeader, card, mono } from "../ui.jsx";

/**
 * Painel de Usuários (fase Q, docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md): só para o Aprovador. Nesta fase,
 * com dados de exemplo no navegador; gravar no backend e consultar o Supabase Auth são alterações futuras.
 */

const COLS = "minmax(170px,1.3fr) 140px minmax(170px,1.6fr) 96px 64px";
const rowGrid = { display: "grid", gridTemplateColumns: COLS, gap: 12, alignItems: "center" };
const TITULOS = [["pessoa", "Pessoa"], ["papel", "Papel"], ["areas", "Áreas"], ["situacao", "Situação"]];
const DICA_PROPRIA = "Peça a outro Aprovador para mudar o seu acesso.";
// Lápis das áreas (fase S, apêndice SA1): contorno cinza dos botões secundários e, com o mouse por cima, fundo preto.
const LAPIS = { borderColor: "var(--action-secondary-border)", color: "var(--action-secondary-fg)" };
const LAPIS_POR_CIMA = { background: "var(--action-primary-bg)", borderColor: "var(--action-primary-bg)", color: "var(--action-primary-fg)" };

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
 * Áreas (Q6): só as etiquetas, como o "Geral" do Revisor; quem pode ter as áreas alteradas (Aprovador
 * ativo) ganha o lápis, que abre a lista por cima das etiquetas. Fecha com um clique fora ou com Esc.
 */
function Areas({ u, areas, ws }) {
  const raiz = React.useRef(null);
  const [porCima, setPorCima] = React.useState(false);
  React.useEffect(() => {
    if (!u.areasAbertas) return undefined;
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) ws.abrirAreasDoUsuario(u.id); };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [u.areasAbertas, u.id, ws]);

  const etiquetas = <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{u.areasNaTela.map((a) => <Badge key={a} tone={a === "Geral" ? "neutral" : "approved"}>{a}</Badge>)}</div>;
  // Revisor (sem área, PN3) e pessoa inativa: só as etiquetas, sem o lápis.
  if (u.papel !== "Aprovador" || !u.ativo) return etiquetas;
  return (
    <div ref={raiz} style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
      {etiquetas}
      <Tooltip content="Editar áreas" placement="top">
        <IconButton
          icon="pencil" label={`Editar áreas de ${u.nome}`} variant="ghost" size="sm" onClick={() => ws.abrirAreasDoUsuario(u.id)}
          aria-haspopup="true" aria-expanded={u.areasAbertas}
          // Fase S (apêndice SA1): contorno cinza, como os botões secundários, e fundo preto com o mouse por cima, como "Alterar área" da Revisão.
          onMouseEnter={() => setPorCima(true)} onMouseLeave={() => setPorCima(false)}
          style={porCima ? LAPIS_POR_CIMA : LAPIS}
        />
      </Tooltip>
      {u.areasAbertas ? (
        <div role="group" aria-label={`Áreas de ${u.nome}`} aria-busy={u.ocupado} style={{ position: "absolute", top: 0, left: 0, zIndex: 70, width: 260, boxSizing: "border-box", padding: 8, display: "grid", background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-popover)" }}>
          {areas.map((a) => (
            <Checkbox key={a} label={a} checked={u.areas.includes(a)} disabled={u.ocupado} onChange={() => ws.marcarAreaDoUsuario(u.id, a)} style={{ minHeight: 36, padding: "0 4px" }} />
          ))}
          <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--text-meta)", padding: "6px 4px 2px" }}>C-Level vale por todas e não se combina com outras. O Aprovador precisa de pelo menos uma área.</span>
        </div>
      ) : null}
    </div>
  );
}

function Papel({ u, ws }) {
  const select = <Select size="sm" options={["Revisor", "Aprovador"]} value={u.papel} disabled={u.propria || !u.ativo || u.ocupado} aria-label={`Papel de ${u.nome}`} onChange={(e) => ws.mudarPapelDoUsuario(u.id, e.target.value)} />;
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
      <Switch checked={u.ativo} disabled={u.propria || u.ocupado} onChange={() => ws.alternarAcessoDoUsuario(u.id)} aria-label={`${rotulo} de ${u.nome}`} />
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
  const [enviando, setEnviando] = React.useState(false);
  // No modo compartilhado, espera a resposta do backend (Q3); um segundo clique não repete o pedido (PQ4).
  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    const recusa = await ws.adicionarUsuario(nome, email);
    setEnviando(false);
    if (recusa) setErro(recusa);
  };
  return (
    <form onSubmit={enviar} noValidate aria-label="Adicionar usuário" style={card(14, { padding: "16px 20px", display: "grid", gap: 10 })}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1.2fr) auto auto", gap: 12, alignItems: "end" }}>
        <Field label="Nome" htmlFor="us-nome"><Input id="us-nome" size="sm" autoFocus placeholder="Ana Souza" value={nome} onChange={(e) => { setNome(e.target.value); setErro(null); }} /></Field>
        <Field label="E-mail da conta" htmlFor="us-email"><Input id="us-email" size="sm" type="email" placeholder="ana.souza@empresa.com.br" value={email} onChange={(e) => { setEmail(e.target.value); setErro(null); }} /></Field>
        <Button size="sm" variant="secondary" onClick={() => ws.abrirAdicionarUsuario(false)} disabled={enviando}>Cancelar</Button>
        <Button size="sm" type="submit" loading={enviando}>Adicionar</Button>
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
      {p.carregando || p.erro ? null : <span style={{ marginTop: -12, color: "var(--n-500)" }}>{p.ativos} {p.ativos === 1 ? "pessoa" : "pessoas"} com acesso</span>}
      {/* Só no modo local (DF2): no publicado, a lista vem do banco. */}
      {p.exemplo ? (
        <div role="note" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--n-600)" }}>
          <Icon name="info" size="sm" />Dados de exemplo: as mudanças desta tela ainda não são gravadas e voltam ao recarregar a página.
        </div>
      ) : null}
      {p.adicionando ? <Adicionar ws={ws} isMobile={isMobile} /> : null}

      {p.carregando ? (
        <div role="status" style={card(14, { padding: 24, display: "flex", gap: 10, alignItems: "center", color: "var(--n-500)" })}>
          <Icon name="loader-circle" size="sm" style={{ animation: "tdr-spin 900ms linear infinite" }} />Carregando as pessoas da organização…
        </div>
      ) : p.erro ? (
        // Q13: a lista não carregou; nada é mostrado como se estivesse vazio.
        <EmptyState icon="triangle-alert" title="Não foi possível carregar os usuários." description={p.erro} action={<Button variant="secondary" icon="refresh-cw" onClick={ws.carregarPainel}>Tentar de novo</Button>} />
      ) : isMobile ? (
        // Celular (Q11): um cartão por pessoa, com as ações no rodapé.
        <div style={{ display: "grid", gap: 12 }}>
          {p.linhas.map((u) => (
            <div key={u.id} style={card(14, { padding: 16, display: "grid", gap: 12, background: u.ativo ? "var(--n-000)" : "var(--n-050)" })}>
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
            <div key={u.id} role="row" style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)", background: u.ativo ? "transparent" : "var(--n-050)" }}>
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
