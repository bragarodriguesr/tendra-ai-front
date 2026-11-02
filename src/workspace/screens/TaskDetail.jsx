import React from "react";
import { Badge, Button, EmptyState, Icon, Input, ProgressBar, FilterMenu } from "../../ds/index.js";
import { ClickRow, DISPLAY, ESMAECIDO, Page, SegmentBar, bigNumber, card, h1Style, legendDot, mono } from "../ui.jsx";
import { filtroAoClicar } from "../filtroPeloProgresso.js";

const statusCard = (accent, compact) => card(16, {
  padding: compact ? 20 : 32, display: "flex", flexDirection: "column", gap: 16, maxWidth: 640,
  ...(accent ? { border: "1px solid var(--danger)", borderTop: "3px solid var(--danger)" } : null)
});
const cardTitle = { fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: "var(--n-900)" };

export function TaskDetail({ v, ws, state, pad, isMobile }) {
  const { task, counts: c } = v;
  return (
    <Page pad={pad}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.hasItems || task.isServer ? <div><Badge tone={task.sTone} icon={task.sIcon}>{task.sTxt}</Badge></div> : null}
            <h1 style={h1Style}>{task.name}</h1>
            <span style={{ color: "var(--n-400)" }}>{task.company} · {task.type} · prazo {task.due} ({task.dueText}) · responsável {task.owner}</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {task.hasItems ? (task.isServer
              ? <Button variant="secondary" icon="download" disabled={!task.podeBaixar} title={task.podeBaixar ? undefined : "O Revisor baixa a planilha quando a tarefa estiver pronta: todos os itens aprovados e nenhum alerta pendente."} onClick={() => ws.askDownload(task.id)}>Baixar planilha preenchida</Button>
              : <Button variant="secondary" icon="download" onClick={() => ws.go("export", { taskId: "t1" })}>Exportação</Button>) : null}
            <Button variant="secondary" icon="building-2" onClick={() => ws.openTaskDetails(task.id)}>Ver detalhes</Button>
            {task.hasItems ? <Button icon="eye" onClick={() => ws.go("review")}>Abrir revisão</Button> : null}
          </div>
        </div>
      </div>

      {task.isProcessing ? (
        <div style={statusCard(false, isMobile)}>
          <div><Badge tone="neutral" icon="loader-circle">Processando</Badge></div>
          {task.isServer ? (
            <>
              <div style={cardTitle}>{task.items ? `Processando: ${task.done} de ${task.items} perguntas.` : "Lendo a planilha."}</div>
              <ProgressBar value={task.items ? Math.round((task.done / task.items) * 100) : 0} fillClassName="tdr-progress-ai" />
              <div style={{ ...mono(12, "var(--n-500)"), overflowWrap: "anywhere" }}>{task.file}</div>
            </>
          ) : (
            <>
              <div style={cardTitle}>Processando: 42 de 180 perguntas.</div>
              <ProgressBar value={23} fillClassName="tdr-progress-ai" />
            </>
          )}
          <div style={{ color: "var(--n-400)" }}>Você pode sair desta tela. Avisaremos aqui quando terminar.</div>
          <div><Button variant="secondary" onClick={() => ws.go("tasks")}>Sair e voltar depois</Button></div>
        </div>
      ) : null}

      {task.isFailed ? (
        <div style={statusCard(true, isMobile)}>
          <div><Badge tone="danger" icon="triangle-alert">Falha no carregamento</Badge></div>
          <div style={cardTitle}>Não foi possível carregar este arquivo. Tente de novo ou fale com o suporte.</div>
          <div style={{ color: "var(--n-900)", lineHeight: 1.6 }}><b>Causa:</b> {task.isServer ? task.reason || "sem motivo registrado." : "arquivo ilegível ou protegido por senha."}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {task.isServer ? null : <Button icon="refresh-cw" onClick={ws.retryTask}>Tentar de novo</Button>}
            <Button variant="secondary" icon="upload" onClick={() => ws.go("new")}>Importar novo arquivo</Button>
          </div>
        </div>
      ) : null}

      {task.isReady ? (
        <div style={statusCard(false, isMobile)}>
          <div><Badge tone="approved" icon="check-check">Pronta para exportar</Badge></div>
          <div style={cardTitle}>{task.progText}</div>
          <ProgressBar value={100} />
          <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>Nenhum alerta pendente. A planilha com respostas e fontes já pode ser baixada por Aprovadores e Revisores.</div>
          <div><Button icon="download" onClick={() => ws.go("export", task.isServer ? {} : { taskId: task.id })}>Ir para exportação</Button></div>
        </div>
      ) : null}

      {task.hasItems ? (
        <>
          <div style={card(16, { padding: 24, display: "flex", flexDirection: "column", gap: 20 })}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={bigNumber}>{v.destaqueDoCartao.n} <span style={{ fontSize: 24, color: "var(--n-400)" }}>de {c.total}</span></span>
              <span style={{ color: "var(--n-700)" }}>{v.destaqueDoCartao.texto}</span>
            </div>
            {/* Barra e legenda aplicam o filtro por estado; clicar de novo volta para "Todos" (SPEC_FASE_M.md, M1 a M5). */}
            <SegmentBar segments={v.segs} total={c.total} unit="itens" selected={state.filter} onSelect={(estado) => ws.setFilter(filtroAoClicar(state.filter, estado))} />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {v.segs.map((g, _, todos) => {
                const filtrando = todos.some((x) => x.value === state.filter);
                const conteudo = <><span aria-hidden="true" style={legendDot(g.color)} /><span style={{ ...mono(undefined), fontVariantNumeric: "tabular-nums" }}>{g.n}</span><span>{g.label}</span></>;
                const estilo = {
                  display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                  opacity: filtrando && g.value !== state.filter ? ESMAECIDO : 1, transition: "opacity var(--duration-fast) var(--ease-out)"
                };
                // Estado sem itens: sem clique e fora da ordem do Tab (M9).
                if (g.n === 0) return <div key={g.label} style={estilo}>{conteudo}</div>;
                return (
                  <button
                    key={g.label} type="button" aria-pressed={g.value === state.filter} aria-label={`${g.label}: ${g.n} de ${c.total} itens`}
                    onClick={() => ws.setFilter(filtroAoClicar(state.filter, g.value))}
                    style={{ ...estilo, padding: 0, border: 0, background: "transparent", font: "inherit", fontSize: 13, color: "inherit", cursor: "pointer" }}
                  >
                    {conteudo}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Busca à esquerda e filtro à direita, na mesma linha (SPEC_FASE_L.md, B13); no celular, o filtro vai abaixo (B17). */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <Input
              icon="search" placeholder="Buscar por palavras ou código" aria-label="Buscar perguntas"
              value={state.busca} onChange={(e) => ws.setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") ws.setBusca(""); }}
              style={isMobile ? { flex: "1 1 100%" } : { flex: "0 1 320px", minWidth: 220 }}
            />
            <div style={isMobile ? undefined : { marginLeft: "auto" }}>
              {/* No computador o filtro fica à direita: o menu abre alinhado à direita do botão, sem passar da tela. */}
              <FilterMenu items={v.filterTabs} value={state.filter} onChange={ws.setFilter} align={isMobile ? "start" : "end"} />
            </div>
          </div>
          <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
            {v.buscaSemResultado ? (
              <EmptyState icon="search" title="Nenhuma pergunta encontrada." description="Confira as palavras ou limpe a busca." />
            ) : null}
            {v.rowsDaBusca.map((r) => (
              isMobile ? (
                <ClickRow key={r.id} onClick={r.openFromTask} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderTop: "1px solid var(--n-100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={mono(12)}>{r.code}</span>
                    {r.hasAlert ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--danger)", fontSize: 12, fontWeight: 500 }}><Icon name="triangle-alert" size="sm" />{r.alertText}</span> : null}
                  </div>
                  <span style={{ color: "var(--n-900)", lineHeight: 1.4 }}>{r.q}</span>
                  <div><Badge tone={r.tone} icon={r.icon}>{r.st}</Badge></div>
                </ClickRow>
              ) : (
                <ClickRow key={r.id} onClick={r.openFromTask} style={{ display: "grid", minWidth: 980, gridTemplateColumns: "120px minmax(0,1fr) 150px 150px", gap: 16, alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--n-100)" }}>
                  <span style={mono(12)}>{r.code}</span>
                  <span style={{ color: "var(--n-900)" }}>{r.q}</span>
                  <div><Badge tone={r.tone} icon={r.icon}>{r.st}</Badge></div>
                  {r.hasAlert ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontSize: 13, fontWeight: 500 }}>
                      <Icon name="triangle-alert" size="sm" />{r.alertText}
                    </span>
                  ) : <span />}
                </ClickRow>
              )
            ))}
          </div>
        </>
      ) : null}
    </Page>
  );
}
