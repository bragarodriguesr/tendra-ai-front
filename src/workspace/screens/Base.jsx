import React from "react";
import { Badge, Button, EmptyState, Icon, IconButton, MonoLabel, Select, Switch, Tooltip } from "../../ds/index.js";
import { Page, card, h1Style, mono } from "../ui.jsx";

const COLS = "minmax(0,2.2fr) 100px 110px 170px minmax(150px,1fr) 120px 110px";
const rowGrid = { display: "grid", minWidth: 1040, gridTemplateColumns: COLS, gap: 16 };
const SORT_OPTIONS = [{ value: "idade", label: "Ordenar por idade" }, { value: "nome", label: "Ordenar por nome" }, { value: "upload", label: "Ordenar por envio" }];

function DocActions({ d }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {d.canRetry ? (
        <Tooltip content="Tentar novamente" placement="top">
          <IconButton icon="refresh-cw" label="Tentar novamente" variant="outline" size="sm" onClick={d.retry} />
        </Tooltip>
      ) : null}
      <Tooltip content={d.toggleLabel} placement="top">
        <Switch checked={d.active} onChange={d.toggle} aria-label={d.toggleLabel} />
      </Tooltip>
    </div>
  );
}

/** Versão e, para documentos do servidor, o nome do arquivo (a identidade na base). */
const subtitle = (d) => (d.file ? `${d.version} · ${d.file}` : d.version);

/** Grupos do resultado de um envio, na ordem do resumo do comando carregar-base. */
const RESULT_GROUPS = [
  { key: "carregados", label: "Carregados", tone: "approved", icon: "check" },
  { key: "atualizados", label: "Atualizados", tone: "approved", icon: "refresh-cw" },
  { key: "semMudanca", label: "Sem mudança", tone: "neutral", icon: "minus" },
  { key: "recusados", label: "Recusados", tone: "danger", icon: "circle-alert", detail: "motivo" },
  { key: "ignorados", label: "Ignorados", tone: "neutral", icon: "file-text", detail: "motivo" },
  { key: "avisos", label: "Avisos", tone: "accent", icon: "triangle-alert", detail: "mensagem" }
];

/** Resultado do último envio: cada arquivo com o que aconteceu e, nas recusas, o motivo. */
export function SendResult({ result, onClose }) {
  const groups = RESULT_GROUPS.filter((g) => result[g.key].length);
  return (
    <div role="status" style={card(14, { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <MonoLabel>Resultado do envio</MonoLabel>
        <IconButton icon="x" label="Fechar resultado do envio" variant="ghost" size="sm" onClick={onClose} />
      </div>
      {groups.map((g) => (
        <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div><Badge tone={g.tone} icon={g.icon}>{g.label}: {result[g.key].length}</Badge></div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {result[g.key].map((x, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--n-600)", overflowWrap: "anywhere" }}>
                <span style={mono(12)}>{g.detail ? x.nome : x}</span>{g.detail ? ": " + x[g.detail] : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Celular: cada documento vira um cartão com status, idade e ações no rodapé. */
function DocCards({ docs }) {
  return (
    <div style={card(14, { overflow: "hidden" })}>
      {docs.map((d, i) => (
        <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px", borderTop: i ? "1px solid var(--n-100)" : 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...mono(13), overflowWrap: "anywhere" }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "var(--n-400)", marginTop: 2, overflowWrap: "anywhere" }}>{subtitle(d)} · {d.type} · {d.by}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge tone={d.tone} icon={d.icon}>{d.statusText}</Badge>
            {d.old ? <Badge tone="danger" icon="clock">Mais de 120 dias</Badge> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={mono(12, "var(--n-500)")}>Atualizado {d.upd} · {d.ageText}</span>
            <DocActions d={d} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Base({ v, ws, state, pad, isMobile }) {
  const picker = React.useRef(null);
  const pick = () => picker.current && picker.current.click();
  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    ws.sendDocs(files);
  };
  const empty = state.baseOrigem === "servidor" && !state.docs.length;
  return (
    <Page pad={pad}>
      {/* Seletor de arquivos do computador. A validação de cada .md é do backend (FORMATO_BASE_MD.md). */}
      <input ref={picker} type="file" accept=".md,text/markdown" multiple hidden onChange={onPick} aria-hidden="true" tabIndex={-1} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MonoLabel>Base de conhecimento</MonoLabel>
          <h1 style={h1Style}>{state.docs.length} documentos na base</h1>
          <span style={{ color: "var(--n-400)" }}>Prazo de aging em vigor: <b style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500 }}>120 dias</b> sem atualização.</span>
        </div>
        <div className={isMobile ? "tdr-stack-actions" : undefined} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: isMobile ? "100%" : 200 }}><Select options={SORT_OPTIONS} value={state.sort} onChange={(e) => ws.setState({ sort: e.target.value })} size="sm" aria-label="Ordenação" /></div>
          <Tooltip content="Arquivo .md com tipo: rfp-passada no cabeçalho" placement="top">
            <Button variant="secondary" icon="history" onClick={pick} disabled={state.enviando}>Importar RFP passada</Button>
          </Tooltip>
          <Button icon="upload" onClick={pick} loading={state.enviando}>Subir documentos</Button>
        </div>
      </div>
      <span style={{ fontSize: 13, color: "var(--n-500)" }}>
        Aceita arquivos <b style={mono(13, "inherit")}>.md</b> com o cabeçalho de título, tipo e data de atualização, até 10 MB por envio. Enviar de novo um arquivo com o mesmo nome atualiza o documento.
      </span>
      {state.baseOrigem === "exemplo" ? (
        <div role="note" style={card(12, { padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", background: "var(--n-050)" })}>
          <Icon name="circle-alert" size={16} />
          <span style={{ fontSize: 13, color: "var(--n-600)" }}>Servidor da base desconectado: a lista abaixo é de exemplo. Para subir documentos, inicie o servidor com <span style={mono(12, "inherit")}>npm run servidor</span>, na pasta backend.</span>
        </div>
      ) : null}
      {state.envio ? <SendResult result={state.envio} onClose={ws.closeSendResult} /> : null}
      {empty ? (
        <EmptyState icon="database" title="Base vazia" description="Sua base ainda não tem documentos. Suba propostas anteriores e documentos técnicos para gerar rascunhos." action={<Button icon="upload" onClick={pick} loading={state.enviando}>Subir documentos</Button>} />
      ) : isMobile ? <DocCards docs={v.docs} /> : (
      <div style={card(14, { overflowX: "auto", overflowY: "hidden" })}>
        <div style={{ ...rowGrid, padding: "12px 20px", background: "var(--n-050)", borderBottom: "1px solid var(--n-200)", ...mono(11, "var(--n-400)"), letterSpacing: ".1em", textTransform: "uppercase" }}>
          <span>Documento</span><span>Tipo</span><span>Atualizado</span><span>Idade</span><span>Status</span><span>Enviado por</span><span>Ações</span>
        </div>
        {v.docs.map((d) => (
          <div key={d.id} style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...mono(13), overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--n-400)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle(d)}</div>
            </div>
            <span>{d.type}</span>
            <span style={mono(12, "inherit")}>{d.upd}</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span style={mono(13)}>{d.ageText}</span>
              {d.old ? <Badge tone="danger" icon="clock">Mais de 120 dias</Badge> : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              {/* rótulos longos ("Em tratamento pelo suporte") quebram dentro da coluna em vez de invadir a vizinha */}
              <Badge tone={d.tone} icon={d.icon} style={{ whiteSpace: "normal", maxWidth: "100%", boxSizing: "border-box" }}>{d.statusText}</Badge>
            </div>
            <span>{d.by}</span>
            <DocActions d={d} />
          </div>
        ))}
      </div>
      )}
    </Page>
  );
}
