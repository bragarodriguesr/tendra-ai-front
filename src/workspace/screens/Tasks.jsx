import React from "react";
import { Badge, EmptyState, IconButton, ProgressBar, Tooltip } from "../../ds/index.js";
import { ClickRow, Page, PageHeader, card, mono } from "../ui.jsx";
import { NewRfpButton } from "../NewRfpButton.jsx";

const COLS = "minmax(0,2.2fr) 64px minmax(0,1.7fr) 150px 130px 130px 96px";
const rowGrid = { display: "grid", minWidth: 1050, gridTemplateColumns: COLS, gap: 16 };

/** Excluir tarefa (cenário 60): o clique não abre a tarefa; a exclusão pede confirmação. */
function DeleteTask({ t }) {
  if (!t.canDelete) return null;
  return (
    <Tooltip content="Excluir tarefa" placement="top">
      <IconButton icon="trash-2" label={`Excluir ${t.title}`} variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); t.del(); }} />
    </Tooltip>
  );
}

/** Arquivar (fase O, cenário O10): só em Em andamento; desabilitado durante o processamento, com o motivo na dica. */
function ArchiveTask({ t }) {
  if (!t.canArchive) return null;
  return (
    <Tooltip content={t.archiveLabel} placement="top">
      <span style={{ display: "inline-flex" }}>
        <IconButton icon="archive" label={`Arquivar ${t.title}`} variant="outline" size="sm" disabled={t.archiveDisabled} onClick={(e) => { e.stopPropagation(); t.archive(); }} />
      </span>
    </Tooltip>
  );
}

function Actions({ t, kind }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {kind === "andamento" ? <ArchiveTask t={t} /> : null}
      {kind !== "finalizadas" ? <DeleteTask t={t} /> : null}
    </div>
  );
}

/** Prazo em Em andamento; quem encerrou e quando em Finalizadas e Arquivadas (O8). */
function When({ t, kind, compact }) {
  if (kind === "andamento") {
    return compact
      ? <span><span style={mono(undefined)}>{t.due}</span> · <span style={{ color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span></span>
      : (
        <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={mono(13)}>{t.due}</span>
          <span style={{ fontSize: 12, color: t.dueColor, fontWeight: t.dueWeight }}>{t.dueText}</span>
        </div>
      );
  }
  return compact
    ? <span>{t.closedBy} · <span style={mono(undefined)}>{t.closedAt}</span></span>
    : (
      <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={mono(13)}>{t.closedAt}</span>
        <span style={{ fontSize: 12, color: "var(--n-500)", overflowWrap: "anywhere" }}>{t.closedBy}</span>
      </div>
    );
}

export function Tasks({ v, ws, pad, isMobile }) {
  const list = v.taskList, kind = list.kind;
  const whenHeader = kind === "andamento" ? "Prazo" : kind === "finalizadas" ? "Finalizada" : "Arquivada";
  return (
    <Page pad={pad}>
      <PageHeader eyebrow={list.eyebrow} title={list.title} action={kind === "andamento" ? <NewRfpButton v={v} ws={ws} /> : null} />
      {!list.items.length ? (
        <EmptyState icon={kind === "arquivadas" ? "archive" : kind === "finalizadas" ? "check-check" : "layout-grid"} title={list.empty[0]} description={list.empty[1]} />
      ) : !isMobile ? (
        <div role="table" aria-label="Tarefas" style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
          <div role="row" style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span role="columnheader">Tarefa</span><span role="columnheader">Itens</span><span role="columnheader">Progresso</span>
            <span role="columnheader">{whenHeader}</span><span role="columnheader">Responsável</span><span role="columnheader">Status</span>
            <span role="columnheader"><span style={{ position: "absolute", left: -9999 }}>Ações</span></span>
          </div>
          {list.items.map((t) => (
            <ClickRow key={t.id} role="row" aria-label={`Abrir ${t.title}`} onClick={t.open} style={{ ...rowGrid, padding: "16px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center", background: "var(--n-000)" }}>
              <div role="cell" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--n-900)" }}>{t.title}</div>
                <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type}</div>
              </div>
              <span role="cell" style={mono(13)}>{t.items}</span>
              <div role="cell" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div style={{ width: "100%" }}><ProgressBar value={t.pct} fillClassName={t.isProcessing ? "tdr-progress-ai" : undefined} /></div>
                <span style={{ fontSize: 12, color: "#4B5046" }}>{t.compText}</span>
              </div>
              <When t={t} kind={kind} />
              <span role="cell">{t.owner}</span>
              <div role="cell"><Badge tone={t.tone} icon={t.icon}>{t.status}</Badge></div>
              <div role="cell"><Actions t={t} kind={kind} /></div>
            </ClickRow>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.items.map((t) => (
            <ClickRow key={t.id} className="" onClick={t.open} style={card(14, { padding: 16, display: "flex", flexDirection: "column", gap: 12 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--n-900)", lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: "var(--n-500)", marginTop: 2 }}>{t.company} · {t.type}</div>
                </div>
                <Badge tone={t.tone} icon={t.icon}>{t.status}</Badge>
              </div>
              <ProgressBar value={t.pct} fillClassName={t.isProcessing ? "tdr-progress-ai" : undefined} />
              <span style={{ fontSize: 13, color: "#4B5046" }}>{t.compText}</span>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <When t={t} kind={kind} compact />
                <span>{t.owner}</span>
              </div>
              {(kind === "andamento" && (t.canArchive || t.canDelete)) || (kind === "arquivadas" && t.canDelete)
                ? <div style={{ display: "flex", justifyContent: "flex-end" }}><Actions t={t} kind={kind} /></div> : null}
            </ClickRow>
          ))}
        </div>
      )}
    </Page>
  );
}
