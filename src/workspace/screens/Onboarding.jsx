import React from "react";
import { Badge, Button, Card, Divider, Icon, MonoLabel } from "../../ds/index.js";
import { DISPLAY, Page, mono } from "../ui.jsx";

const ACCEPTED = ".doc · .docx · .xls · .xlsx · .md · .pdf · .ppt · .pptx · .txt · .csv";

const CONTEXT_TIPS = [
  ["shield-check", "Whitepaper e políticas de segurança", "Criptografia, acesso, logs, incidentes"],
  ["file-text", "RFPs e RFIs já respondidas", "Entram como “RFP passada”"],
  ["book-open", "Contrato padrão e anexos de SLA", "Responsabilidade, multas, disponibilidade"],
  ["check-check", "Certificados e relatórios de auditoria", "ISO 27001, SOC 2, pentest"]
];

const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

function Uploader({ ws }) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef(null);
  const add = (files) => { if (files.length) ws.onboardFiles(files); };
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
        <span style={{ fontSize: 13, lineHeight: 1.55, color: "var(--n-400)" }}>Aceitos: {ACCEPTED} e arquivos do Google baixados (Docs, Planilhas e Apresentações). Vários arquivos por vez.</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <input ref={input} type="file" multiple hidden onChange={(e) => { add(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <Button icon="upload" onClick={() => input.current.click()}>Subir documentos</Button>
        <Button variant="secondary" icon="file-text" onClick={ws.onboardSample}>Usar arquivos de exemplo</Button>
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

function Step({ n, title, meta, state }) {
  return (
    <div className={"tdr-onb-step" + (state ? " is-" + state : "")} aria-current={state === "on" ? "step" : undefined}>
      <MonoLabel>Passo {n}</MonoLabel>
      <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{title}</span>
      <span style={{ fontSize: 13, color: "var(--n-400)" }}>{meta}</span>
    </div>
  );
}

export function Onboarding({ v, ws, pad, isMobile }) {
  const { list, sent, ready, done } = v.onb;
  return (
    <Page pad={pad} gap={32}>
      <div style={{ display: "grid", gap: 8 }}>
        <MonoLabel tone="sage">Primeiro uso · Banco de conhecimento</MonoLabel>
        <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: isMobile ? 26 : 30, lineHeight: 1.18, letterSpacing: "-.02em", color: "var(--n-900)", textWrap: "balance" }}>Suba os documentos que sustentam suas respostas</h1>
        <p style={{ margin: 0, maxWidth: "66ch", fontSize: 15, lineHeight: 1.6, color: "var(--n-700)", textWrap: "pretty" }}>Cada rascunho da Tendra.ai cita o documento de onde veio. Propostas anteriores, políticas, contratos padrão e certificados dão contexto às próximas RFPs. Mais documentos, rascunhos melhores.</p>
      </div>

      <div className="tdr-onb-steps">
        <Step n={1} title="Subir documentos" state={ready ? "done" : "on"} meta={sent ? `${plural(sent, "enviado", "enviados")} · ${done} processados` : "Nenhum documento enviado"} />
        <Step n={2} title="Criar a primeira RFP" state={ready ? "on" : null} meta="Importe a lista de perguntas" />
        <Step n={3} title="Revisar e aprovar" meta="Item a item, com a fonte ao lado" />
      </div>

      <div className="tdr-onb-two">
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Uploader ws={ws} />
          <UploadList list={list} />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <Button iconEnd="arrow-right" disabled={!ready} onClick={() => ws.go("new")}>Criar primeira RFP</Button>
            <Button variant="ghost" onClick={() => ws.go("tasks")}>Fazer depois</Button>
            {ready
              ? <span style={{ fontSize: 13, color: "var(--n-400)" }}>{plural(ready, "documento pronto", "documentos prontos")}</span>
              : <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--n-700)" }}><Icon name="info" size={14} />Disponível quando ao menos um documento estiver pronto.</span>}
          </div>
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
    </Page>
  );
}
