import React from "react";
import { Badge, Button, IconButton, Toast } from "../ds/index.js";
import { DISPLAY, card, mono } from "./ui.jsx";

const bar = (width, height = 6, background = "var(--n-100)") => <div style={{ height, width, background, borderRadius: 2 }} />;

/** T7 — trecho de origem destacado numa gaveta lateral. Esc fecha. */
// Sobreposições fixas na tela inteira: o escurecimento cobre também o menu lateral e a barra superior
// (revisão de design de 05/11/2026).
export function SourceDrawer({ dr, onClose }) {
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current && closeRef.current.querySelector("button")?.focus(); }, [dr.doc, dr.k]);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(18,20,15,.32)" }} onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Visualizador de fonte" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, maxWidth: "92vw", zIndex: 111, background: "var(--n-000)", borderLeft: "1px solid var(--n-200)", boxShadow: "var(--shadow-overlay)", display: "flex", flexDirection: "column", animation: "tdr-fade var(--duration-base) var(--ease-out) both" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase" }}>Fonte [{dr.k}] · {dr.type}</span>
            <span style={{ ...mono(15), fontWeight: 500, wordBreak: "break-word" }}>{dr.doc}</span>
            <span style={{ fontSize: 13, color: "var(--n-400)" }}>{dr.loc} · {dr.ageText}</span>
          </div>
          <span ref={closeRef} style={{ display: "flex" }}><IconButton icon="x" label="Fechar fonte" onClick={onClose} /></span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--n-100)" }}>
          {dr.missing ? (
            <div style={card(12, { padding: 24, display: "flex", flexDirection: "column", gap: 12 })}>
              <div><Badge tone="danger" icon="triangle-alert">Documento indisponível</Badge></div>
              <div style={{ lineHeight: 1.6, color: "var(--n-900)" }}>Este documento não está mais na base. Mostramos o nome e a página registrados.</div>
              <div style={mono(13, "var(--n-700)")}>{dr.doc} · {dr.loc}</div>
            </div>
          ) : (
            <div style={card(4, { padding: "40px 36px", display: "flex", flexDirection: "column", gap: 12, minHeight: 520 })}>
              {bar("40%", 10, "var(--n-200)")}
              {bar("100%")}{bar("94%")}{bar("97%")}
              <div style={{ height: 16 }} />
              <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--n-900)" }}>
                <mark style={{ background: "var(--brand-lime)", color: "var(--brand-ink)", padding: "2px 0" }}>{dr.ex}</mark>
              </div>
              <div style={{ height: 16 }} />
              {bar("96%")}{bar("88%")}{bar("60%")}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={mono(11, "var(--n-400)")}>Esc fecha e volta ao item</span>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      </aside>
    </>
  );
}

const cnpjDaTela = (d) => (d && d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d || "—");

function Linha({ rotulo, valor, mono: emMono }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 12, alignItems: "baseline" }}>
      <span style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".08em", textTransform: "uppercase" }}>{rotulo}</span>
      <span style={{ ...(emMono ? mono(13) : { fontSize: 14 }), color: "var(--n-900)", overflowWrap: "anywhere" }}>{valor || "—"}</span>
    </div>
  );
}

/**
 * Painel lateral com título, conteúdo rolável e "Fechar" (fase O, PO12): o mesmo dos detalhes da
 * tarefa, da Dica e dos detalhes do documento. Clique fora e Esc fecham; no celular, ocupa a tela.
 */
export function SidePanel({ label, eyebrow, title, onClose, children, focusKey, closeLabel }) {
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current && closeRef.current.querySelector("button")?.focus(); }, [focusKey]);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(18,20,15,.32)" }} onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={label} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, maxWidth: "min(100vw, 520px)", zIndex: 111, background: "var(--n-000)", borderLeft: "1px solid var(--n-200)", boxShadow: "var(--shadow-overlay)", display: "flex", flexDirection: "column", animation: "tdr-fade var(--duration-base) var(--ease-out) both" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span style={{ ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase" }}>{eyebrow}</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: "var(--n-900)", overflowWrap: "anywhere" }}>{title}</span>
          </div>
          <span ref={closeRef} style={{ display: "flex" }}><IconButton icon="x" label={closeLabel || `Fechar ${label.toLowerCase()}`} onClick={onClose} /></span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--n-050)", display: "flex", flexDirection: "column", gap: 20 }}>
          {children}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--n-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={mono(11, "var(--n-400)")}>Esc fecha</span>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      </aside>
    </>
  );
}

/** Bloco do painel lateral: rótulo em caixa alta e o conteúdo num cartão. */
export function PanelSection({ label, children }) {
  return (
    <section aria-label={label} style={card(12, { padding: 20, display: "flex", flexDirection: "column", gap: 12 })}>
      <span style={{ ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</span>
      {children}
    </section>
  );
}

export { Linha as PanelRow };

/** Barra lateral "Ver detalhes" da tarefa: dados da empresa e contatos informados na Nova RFP (cenário 64). Esc fecha. */
export function TaskDetailsDrawer({ d, onClose }) {
  const t = d.task;
  return (
    <SidePanel label="Detalhes da tarefa" eyebrow="Detalhes da tarefa" title={t.name} onClose={onClose} focusKey={d.id} closeLabel="Fechar detalhes">
      <PanelSection label="Empresa">
        <Linha rotulo="Nome" valor={d.empresa ? d.empresa.nome : t.company} />
        <Linha rotulo="CNPJ" valor={d.empresa ? cnpjDaTela(d.empresa.cnpj) : "—"} emMono />
        <Linha rotulo="Tipo" valor={t.type} />
        <Linha rotulo="Prazo" valor={t.due && t.due !== "—" ? `${t.due} (${t.dueText})` : "Sem prazo"} emMono />
        <Linha rotulo="Responsável" valor={t.owner} />
        {t.file ? <Linha rotulo="Arquivo" valor={t.file} emMono /> : null}
      </PanelSection>
      <section aria-label="Contatos" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ ...mono(11, "var(--n-500)"), letterSpacing: ".1em", textTransform: "uppercase" }}>Contatos · {d.carregando ? "…" : d.contatos.length}</span>
        {d.carregando ? <div style={{ fontSize: 14, color: "var(--n-500)" }}>Carregando…</div>
          : d.erro ? <div role="alert" style={{ fontSize: 14, color: "var(--danger)" }}>Não foi possível ler os dados: {d.erro}</div>
          : !d.contatos.length ? <div style={{ fontSize: 14, color: "var(--n-500)" }}>Nenhum contato informado na importação.</div>
          : d.contatos.map((c, i) => (
            <div key={i} style={card(12, { padding: 16, display: "flex", flexDirection: "column", gap: 10 })}>
              <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{c.nome || "Sem nome"}</span>
              <Linha rotulo="Cargo" valor={c.cargo} />
              <Linha rotulo="Telefone" valor={c.telefone} emMono />
              <Linha rotulo="E-mail" valor={c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : ""} emMono />
            </div>
          ))}
      </section>
    </SidePanel>
  );
}

/** Confirmação antes de editar um item já aprovado. */
export function ConfirmEditDialog({ onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,20,15,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="tdr-edit-title" style={{ width: 440, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: "var(--n-000)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-overlay)" }}>
        <div id="tdr-edit-title" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: "var(--n-900)" }}>Editar remove a aprovação.</div>
        <div style={{ lineHeight: 1.6 }}>O item volta para Em revisão e o evento fica registrado.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm} autoFocus>Editar e remover aprovação</Button>
        </div>
      </div>
    </div>
  );
}

/** Confirmação antes de excluir uma tarefa com todos os registros dela (cenário 60). */
export function ConfirmDeleteTaskDialog({ task, busy, onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,20,15,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="tdr-del-title" aria-describedby="tdr-del-desc" style={{ width: 460, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: "var(--n-000)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-overlay)" }}>
        <div id="tdr-del-title" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: "var(--n-900)" }}>Excluir “{task.title}”?</div>
        <div id="tdr-del-desc" style={{ lineHeight: 1.6 }}>A tarefa sai para todas as pessoas, com os itens, as edições, as aprovações, as avaliações, o histórico e as planilhas. Não é possível desfazer.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>Cancelar</Button>
          <Button variant="danger" icon="trash-2" onClick={onConfirm} loading={busy}>Excluir tarefa</Button>
        </div>
      </div>
    </div>
  );
}

/** Download da planilha com a revisão ainda não concluída: pede a confirmação antes de baixar. */
export function ConfirmDownloadDialog({ task, onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,20,15,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="tdr-dl-title" aria-describedby="tdr-dl-desc" style={{ width: 460, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: "var(--n-000)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-overlay)" }}>
        <div id="tdr-dl-title" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: "var(--n-900)" }}>A revisão ainda não foi finalizada.</div>
        <div id="tdr-dl-desc" style={{ lineHeight: 1.6 }}>
          “{task.title}” ainda não está pronta{task.shortProg ? ` (${task.shortProg})` : ""}. A planilha sai com o estado atual da revisão, e os itens não aprovados aparecem com a situação deles.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={onCancel} autoFocus>Voltar para revisão</Button>
          <Button icon="download" onClick={onConfirm}>Baixar mesmo assim</Button>
        </div>
      </div>
    </div>
  );
}

/** Diálogo de confirmação no padrão dos demais (largura de 460 px, Esc fecha pelo atalho do Workspace). */
function Confirm({ id, title, children, actions }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,20,15,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`} style={{ width: 460, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: "var(--n-000)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "var(--shadow-overlay)" }}>
        <div id={`${id}-title`} style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: "var(--n-900)" }}>{title}</div>
        <div id={`${id}-desc`} style={{ lineHeight: 1.6 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>{actions}</div>
      </div>
    </div>
  );
}

/** Box de conclusão depois de baixar a tarefa pronta (fase O, cenário O6). */
export function FinishTaskDialog({ task, busy, onCancel, onConfirm }) {
  return (
    <Confirm id="tdr-fim" title={`${task.kind} concluída. Parabéns pelo trabalho!`} actions={<>
      <Button variant="secondary" onClick={onCancel} disabled={busy}>Agora não</Button>
      <Button icon="check-check" onClick={onConfirm} loading={busy} autoFocus>Finalizar {task.kind}</Button>
    </>}>
      Quer finalizar “{task.title}”? Ela sai das tarefas em andamento e fica em Finalizadas, só para leitura.
    </Confirm>
  );
}

/** Confirmação antes de arquivar (fase O, cenário O10). */
export function ConfirmArchiveTaskDialog({ task, busy, onCancel, onConfirm }) {
  return (
    <Confirm id="tdr-arq" title={`Arquivar “${task.title}”?`} actions={<>
      <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>Cancelar</Button>
      <Button icon="archive" onClick={onConfirm} loading={busy}>Arquivar tarefa</Button>
    </>}>
      Ela sai das tarefas em andamento e fica em Arquivadas, só para leitura, com os itens, os alertas e o estágio de agora. Você pode reativá-la depois.
    </Confirm>
  );
}

export function ToastHost({ toast, onClose, isMobile }) {
  return (
    <>
      <div aria-live="polite" style={{ position: "absolute", left: -9999 }}>{toast ? `${toast.title}. ${toast.desc}` : ""}</div>
      {toast ? (
        <div style={isMobile
          // No celular o aviso fica no topo, para não cobrir a barra de revisar/aprovar.
          ? { position: "absolute", left: 16, right: 16, top: 12, zIndex: 130 }
          : { position: "absolute", right: 24, bottom: 24, zIndex: 130 }}>
          <Toast title={toast.title} description={toast.desc} tone={toast.tone} onClose={onClose} />
        </div>
      ) : null}
    </>
  );
}
