import React from "react";
import { Badge, Button, Icon, ProgressBar, Tabs } from "../../ds/index.js";
import { ClickRow, DISPLAY, Page, StackedBar, bigNumber, card, h1Style, legendDot, mono } from "../ui.jsx";

const statusCard = (accent) => card(16, {
  padding: 32, display: "flex", flexDirection: "column", gap: 16, maxWidth: 640,
  ...(accent ? { border: "1px solid var(--danger)", borderTop: "3px solid var(--danger)" } : null)
});
const cardTitle = { fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: "var(--n-900)" };

export function TaskDetail({ v, ws, state, pad }) {
  const { task, counts: c } = v;
  return (
    <Page pad={pad}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={mono(12, "var(--n-400)")}>
          <a href="#" onClick={(e) => { e.preventDefault(); ws.go("tasks"); }} style={{ color: "var(--n-400)" }}>Tarefas</a> / {task.name}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.hasItems ? <div><Badge tone={task.sTone} icon={task.sIcon}>{task.sTxt}</Badge></div> : null}
            <h1 style={h1Style}>{task.name}</h1>
            <span style={{ color: "var(--n-400)" }}>{task.company} · {task.type} · prazo {task.due} ({task.dueText}) · responsável {task.owner}</span>
          </div>
          {task.hasItems ? (
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="secondary" icon="download" onClick={() => ws.go("export", { taskId: "t1" })}>Exportação</Button>
              <Button icon="eye" onClick={() => ws.go("review")}>Abrir revisão</Button>
            </div>
          ) : null}
        </div>
      </div>

      {task.isProcessing ? (
        <div style={statusCard()}>
          <div><Badge tone="neutral" icon="loader-circle">Processando</Badge></div>
          <div style={cardTitle}>Processando: 42 de 180 perguntas.</div>
          <ProgressBar value={23} />
          <div style={{ color: "var(--n-400)" }}>Você pode sair desta tela. Avisaremos aqui quando terminar.</div>
          <div><Button variant="secondary" onClick={() => ws.go("tasks")}>Sair e voltar depois</Button></div>
        </div>
      ) : null}

      {task.isFailed ? (
        <div style={statusCard(true)}>
          <div><Badge tone="danger" icon="triangle-alert">Falha no carregamento</Badge></div>
          <div style={cardTitle}>Não foi possível carregar este arquivo. Tente de novo ou fale com o suporte.</div>
          <div style={{ color: "var(--n-900)", lineHeight: 1.6 }}><b>Causa:</b> arquivo ilegível ou protegido por senha.</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Button icon="refresh-cw" onClick={ws.retryTask}>Tentar de novo</Button>
            <Button variant="secondary" icon="upload" onClick={() => ws.go("new")}>Importar novo arquivo</Button>
          </div>
        </div>
      ) : null}

      {task.isReady ? (
        <div style={statusCard()}>
          <div><Badge tone="approved" icon="check-check">Pronta para exportar</Badge></div>
          <div style={cardTitle}>{task.progText}</div>
          <ProgressBar value={100} />
          <div style={{ color: "var(--n-400)", lineHeight: 1.6 }}>Nenhum alerta pendente. Um Aprovador pode exportar a planilha com respostas e fontes.</div>
          <div><Button icon="download" onClick={() => ws.go("export", { taskId: task.id })}>Ir para exportação</Button></div>
        </div>
      ) : null}

      {task.hasItems ? (
        <>
          <div style={card(16, { padding: 24, display: "flex", flexDirection: "column", gap: 20 })}>
            <div style={{ display: "flex", gap: 48, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={bigNumber}>{c.approved} <span style={{ fontSize: 24, color: "var(--n-400)" }}>de {c.total}</span></span>
                <span style={{ color: "var(--n-700)" }}>itens aprovados</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ ...cardTitle, fontSize: 28 }}>{c.withDraft} de {c.total}</span>
                <span style={{ color: "var(--n-700)" }}>com sugestão</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ ...cardTitle, fontSize: 28 }}>{c.alerts}</span>
                <span style={{ color: "var(--n-700)" }}>itens com alerta pendente</span>
              </div>
            </div>
            <StackedBar segments={v.segs} />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {v.segs.map((g) => (
                <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={legendDot(g.color)} /><span style={mono(undefined)}>{g.n}</span><span>{g.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Tabs items={v.filterTabs} value={state.filter} onChange={ws.setFilter} />
          <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
            {v.rows.map((r) => (
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
            ))}
          </div>
        </>
      ) : null}
    </Page>
  );
}
