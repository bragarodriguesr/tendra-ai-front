import React from "react";
import { Badge, Button, Card, Divider, Icon, MonoLabel } from "../../ds/index.js";
import { DISPLAY, Page, mono } from "../ui.jsx";
import { SendResult } from "./Base.jsx";

const ACCEPTED = ".doc · .docx · .xls · .xlsx · .md · .pdf · .ppt · .pptx · .txt · .csv";

const CONTEXT_TIPS = [
  ["shield-check", "Whitepaper e políticas de segurança", "Criptografia, acesso, logs, incidentes"],
  ["file-text", "RFPs e RFIs já respondidas", "Entram como “RFP passada”"],
  ["book-open", "Contrato padrão e anexos de SLA", "Responsabilidade, multas, disponibilidade"],
  ["check-check", "Certificados e relatórios de auditoria", "ISO 27001, SOC 2, pentest"]
];

const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

function Uploader({ ws, online, sending }) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef(null);
  // Com o servidor, o envio é o mesmo da Base: arquivos .md para POST /api/base/documentos.
  const add = (files) => { if (files.length) (online ? ws.sendDocs(files) : ws.onboardFiles(files)); };
  return (
    <div
      className={"tdr-dropzone" + (over ? " is-over" : "")}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); add(Array.from(e.dataTransfer.files || [])); }}
    >
      <span className="tdr-dropzone-frame"><Icon name="upload" size={24} /></span>
      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontWeight: 600, color: "var(--n-900)" }}>Arraste arquivos aqui ou selecione no computador</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: "var(--n-400)" }}>{online
          ? "Arquivos .md no formato da base, vários por vez, até 10 MB por envio."
          : <>Aceitos: {ACCEPTED} e arquivos do Google baixados (Docs, Planilhas e Apresentações). Vários arquivos por vez.</>}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <input ref={input} type="file" multiple hidden accept={online ? ".md" : undefined} onChange={(e) => { add(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <Button icon="upload" loading={sending} onClick={() => input.current.click()}>Subir documentos</Button>
        {online ? null : <Button variant="secondary" icon="file-text" onClick={ws.onboardSample}>Usar arquivos de exemplo</Button>}
      </div>
    </div>
  );
}

function UploadList({ list }) {
  if (!list.length) return null;
  return (
    <div className="tdr-files" aria-live="polite">
      {list.map((d) => {
        const err = d.st === "formato" || d.st === "erro";
        const msg = d.st === "pronto" ? `Pronto · ${d.type} · última atualização ${d.upd}` : d.st === "processando" ? "Processando" : d.note;
        return (
          <div className="tdr-file" key={d.id}>
            <span style={{ display: "flex", color: err ? "var(--danger)" : "var(--brand-sage)" }}><Icon name={err ? "circle-alert" : "file-text"} size={18} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...mono(12.5), overflowWrap: "anywhere" }}>{d.name}</div>
              <div style={{ fontSize: 13, marginTop: 2, color: err ? "var(--danger)" : "var(--n-400)" }}>{msg}</div>
              {d.st === "processando" ? <div className="tdr-mini-bar"><i style={{ animationDuration: (d.ms || 1800) + "ms" }} /></div> : null}
            </div>
            <div className="tdr-file-status">
              {d.canRetry
                ? <Button size="sm" variant="secondary" icon="refresh-cw" onClick={d.retry}>Tentar novamente</Button>
                : <Badge tone={d.tone} icon={d.icon}>{d.st === "formato" ? "Não enviado" : d.statusText}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STEPS = [
  { title: "Subir documentos" },
  { title: "Criar a primeira RFP", meta: "Importe a lista de perguntas" },
  { title: "Revisar e aprovar", meta: "Item a item, com a fonte ao lado" }
];

/**
 * Título de um passo: navega para ele, sem aparência de botão. Concluído, ganha a marca limão; o passo
 * seguinte ao atual fica bloqueado até o atual ser concluído.
 */
function Step({ n, title, meta, done, open, shown, onOpen }) {
  const state = done ? "done" : shown ? "on" : open ? null : "locked";
  return (
    <button
      type="button"
      className={"tdr-onb-step" + (state ? " is-" + state : "") + (shown ? " is-shown" : "")}
      aria-current={shown ? "step" : undefined}
      aria-disabled={open ? undefined : true}
      disabled={!open}
      onClick={onOpen}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {done ? <span className="tdr-onb-check" aria-hidden="true"><Icon name="check" size={12} /></span> : null}
        <MonoLabel>Passo {n}{done ? " · concluído" : ""}</MonoLabel>
      </span>
      <span style={{ fontWeight: 600, color: open ? "var(--n-900)" : "var(--n-400)" }}>{title}</span>
      <span style={{ fontSize: 13, color: "var(--n-400)" }}>{meta}</span>
    </button>
  );
}

/** Aviso de passo concluído, no topo do passo aberto. */
function DoneNote({ children }) {
  return (
    <div className="tdr-onb-done-note" role="status">
      <span className="tdr-onb-check" aria-hidden="true"><Icon name="check" size={12} /></span>
      <span>{children}</span>
    </div>
  );
}

export function Onboarding({ v, ws, state, pad, isMobile }) {
  const { list, sent, ready, done, online, steps, shown, current, allDone } = v.onb;
  // Passo concluído: a tela segue para o próximo (o passo aberto volta a ser o atual).
  const anterior = React.useRef(current);
  React.useEffect(() => {
    if (current > anterior.current) ws.setState({ onbStep: null });
    anterior.current = current;
  }, [ws, current]);
  const meta1 = online ? (sent ? `${plural(sent, "documento", "documentos")} na base · ${ready} ${ready === 1 ? "ativo" : "ativos"}` : "Nenhum documento na base") : sent ? `${plural(sent, "enviado", "enviados")} · ${done} processados` : "Nenhum documento enviado";
  return (
    <Page pad={pad} gap={32}>
      <div style={{ display: "grid", gap: 8 }}>
        <MonoLabel tone="sage">Primeiro uso · Banco de conhecimento</MonoLabel>
        <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: isMobile ? 26 : 30, lineHeight: 1.18, letterSpacing: "-.02em", color: "var(--n-900)", textWrap: "balance" }}>Suba os documentos que sustentam suas respostas</h1>
        <p style={{ margin: 0, maxWidth: "66ch", fontSize: 15, lineHeight: 1.6, color: "var(--n-700)", textWrap: "pretty" }}>Cada rascunho da Tendra.ai cita o documento de onde veio. Propostas anteriores, políticas, contratos padrão e certificados dão contexto às próximas RFPs. Mais documentos, rascunhos melhores.</p>
      </div>

      <nav className="tdr-onb-steps" aria-label="Passos">
        {steps.map((p, i) => (
          <Step key={p.n} n={p.n} title={STEPS[i].title} meta={i === 0 ? meta1 : STEPS[i].meta} done={p.done} open={p.open} shown={shown === p.n} onOpen={() => ws.setState({ onbStep: p.n })} />
        ))}
      </nav>

      {shown === 1 ? (
        <div className="tdr-onb-two">
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            {steps[0].done ? <DoneNote>{plural(ready, online ? "documento ativo" : "documento pronto", online ? "documentos ativos" : "documentos prontos")} na base. Você pode subir mais quando quiser.</DoneNote> : null}
            <Uploader ws={ws} online={online} sending={state.enviando} />
            {online && state.envio ? <SendResult result={state.envio} onClose={ws.closeSendResult} /> : null}
            <UploadList list={list} />
          </div>

          <Card padding="lg">
            <div style={{ display: "grid", gap: 16 }}>
              <MonoLabel>O que costuma dar mais contexto</MonoLabel>
              {CONTEXT_TIPS.map(([icon, t, d]) => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ display: "flex", paddingTop: 2, color: "var(--brand-sage)" }}><Icon name={icon} size={18} /></span>
                  <span style={{ display: "grid", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--n-900)" }}>{t}</span>
                    <span style={{ fontSize: 13, color: "var(--n-400)" }}>{d}</span>
                  </span>
                </div>
              ))}
              <Divider tone="subtle" />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--n-400)" }}>Não há número mínimo de documentos. Com a base pequena, parte dos itens chega sem rascunho e pede preenchimento manual.</p>
            </div>
          </Card>
        </div>
      ) : null}

      {shown === 2 ? (
        <Card padding="lg">
          <div style={{ display: "grid", gap: 16, maxWidth: "66ch" }}>
            {steps[1].done ? <DoneNote>Primeira RFP criada. Ela está no painel de tarefas.</DoneNote> : null}
            <MonoLabel>Passo 2 · Criar a primeira RFP</MonoLabel>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--n-700)" }}>Importe a planilha <b>.xlsx</b> com as perguntas da RFP ou RFI e informe a empresa, o prazo e o responsável. A Tendra.ai identifica as perguntas e prepara um rascunho para cada uma, com a fonte na base.</p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <Button iconEnd="arrow-right" onClick={() => ws.go("new")}>Criar primeira RFP</Button>
              <Button variant="ghost" onClick={() => ws.go("tasks")}>Fazer depois</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {shown === 3 ? (
        <Card padding="lg">
          <div style={{ display: "grid", gap: 16, maxWidth: "66ch" }}>
            {steps[2].done ? <DoneNote>{allDone ? "Tudo pronto: você já revisou ou aprovou respostas na Tendra.ai." : "Passo concluído."}</DoneNote> : null}
            <MonoLabel>Passo 3 · Revisar e aprovar</MonoLabel>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--n-700)" }}>Quando a tarefa terminar de processar, abra a Revisão. Em cada item, confira o rascunho com a fonte ao lado, edite o que for preciso e marque como revisado. Quem tem o perfil Aprovador aprova a resposta final. Este passo é concluído quando ao menos um item for revisado ou aprovado.</p>
          </div>
        </Card>
      ) : null}
    </Page>
  );
}
