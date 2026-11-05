import React from "react";
import { Badge, Button, EmptyState, Icon, IconButton, MonoLabel, Select, Switch, Tooltip } from "../../ds/index.js";
import { Page, card, h1Style, mono } from "../ui.jsx";
import { PanelRow, PanelSection, SidePanel } from "../overlays.jsx";

// Documento com mais largura e título em sans, para o nome não quebrar em várias linhas (revisão de design de 05/11/2026).
// Fase O (O2): Tipo, Atualizado e Enviado por saem para os detalhes; a tabela cabe sem rolagem lateral a 1.024 px.
// Com o menu aberto, a 1.024 px o cartão tem 654 px por dentro: 600 px de grade mais 40 de respiro.
const COLS = "minmax(140px,3fr) 92px 92px minmax(104px,1fr) 124px";
const rowGrid = { display: "grid", minWidth: 600, gridTemplateColumns: COLS, gap: 12 };
const SORT_OPTIONS = [{ value: "idade", label: "Ordenar por idade" }, { value: "nome", label: "Ordenar por nome" }, { value: "upload", label: "Ordenar por envio" }, { value: "status", label: "Ordenar por status" }];

function DocActions({ d }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Tooltip content="Ver detalhes" placement="top">
        <IconButton icon="file-text" label={`Ver detalhes de ${d.name}`} variant="outline" size="sm" onClick={d.openDetails} />
      </Tooltip>
      {d.canRetry ? (
        <Tooltip content="Tentar novamente" placement="top">
          <IconButton icon="refresh-cw" label="Tentar novamente" variant="outline" size="sm" onClick={d.retry} />
        </Tooltip>
      ) : null}
      <Tooltip content={d.toggleLabel} placement="top">
        <Switch checked={d.active} disabled={d.toggleDisabled} onChange={d.toggle} aria-label={d.toggleLabel} />
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
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--n-900)", lineHeight: 1.35, overflowWrap: "anywhere" }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "var(--n-400)", marginTop: 2, overflowWrap: "anywhere" }}>{subtitle(d)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge tone={d.tone} icon={d.icon}>{d.statusText}</Badge>
            {d.old ? <Badge tone="warning" icon="clock">Mais de 120 dias</Badge> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={mono(12, "var(--n-500)")}>{d.ageText} · Validade {d.validity}</span>
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
        {/* Base vazia: só o "Subir documentos" do centro da tela; ordenação e botão voltam com o primeiro documento. */}
        <div className={isMobile ? "tdr-stack-actions" : undefined} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {empty ? null : <div style={{ width: isMobile ? "100%" : 200 }}><Select options={SORT_OPTIONS} value={state.sort} onChange={(e) => ws.setState({ sort: e.target.value })} size="sm" aria-label="Ordenação" /></div>}
          {/* Fase O (O1): as regras do .md saem da tela para o painel da Dica. */}
          <Button variant="secondary" icon="lightbulb" onClick={ws.openBaseHint}>Dica</Button>
          {empty ? null : <Button icon="upload" onClick={pick} loading={state.enviando}>Subir documentos</Button>}
        </div>
      </div>
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
          <span>Documento</span><span>Validade</span><span>Idade</span><span>Status</span><span>Ações</span>
        </div>
        {v.docs.map((d) => (
          <div key={d.id} style={{ ...rowGrid, padding: "14px 20px", borderTop: "1px solid var(--n-100)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--n-900)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--n-400)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle(d)}</div>
            </div>
            <span style={mono(12, d.expired ? "var(--danger)" : "inherit")}>{d.validity}</span>
            <span style={mono(13)}>{d.ageText}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              {/* rótulos longos ("Em tratamento pelo suporte") quebram dentro da coluna em vez de invadir a vizinha */}
              <Badge tone={d.tone} icon={d.icon} style={{ whiteSpace: "normal", maxWidth: "100%", boxSizing: "border-box" }}>{d.statusText}</Badge>
              {d.old ? <Badge tone="warning" icon="clock" style={{ whiteSpace: "normal", maxWidth: "100%", boxSizing: "border-box" }}>Mais de 120 dias</Badge> : null}
            </div>
            <DocActions d={d} />
          </div>
        ))}
      </div>
      )}
      {state.baseHint ? <BaseHint onClose={ws.closeBasePanels} /> : null}
      {v.docDetails ? <DocDetails d={v.docDetails} onClose={ws.closeBasePanels} /> : null}
    </Page>
  );
}

const code = (t) => <span style={mono(12, "inherit")}>{t}</span>;
const lista = { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 14, lineHeight: 1.55, color: "var(--n-700)" };
const CABECALHO = [
  ["titulo", "Sim", "Texto de 3 a 120 caracteres. É o nome do documento na tela e na fonte citada."],
  ["tipo", "Sim", <>{code("documento")} ou {code("rfp-passada")}.</>],
  ["atualizado_em", "Sim", <>Data {code("AAAA-MM-DD")}, não futura.</>],
  ["versao", "Não", "Até 20 caracteres. Sem o campo, aparece “Sem versão”."],
  ["validade", "Não", <>Data {code("AAAA-MM-DD")}, não anterior a {code("atualizado_em")}. Sem o campo, “Indefinido”.</>]
];

/** Dica (fase O, cenário O1): as regras de FORMATO_BASE_MD.md em blocos, num painel lateral. */
function BaseHint({ onClose }) {
  return (
    <SidePanel label="Como preparar os arquivos" eyebrow="Dica" title="Como preparar os arquivos" onClose={onClose}>
      <PanelSection label="Formatos aceitos">
        <ul style={lista}>
          <li>Só arquivos {code(".md")} (Markdown), em UTF-8.</li>
          <li>Até 10 MB e 100 arquivos por envio. Vários arquivos podem ir de uma vez.</li>
          <li>A identidade do documento é o nome do arquivo: cada documento da base precisa de um nome único.</li>
        </ul>
      </PanelSection>
      <PanelSection label="Cabeçalho">
        <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--n-700)" }}>O arquivo começa, na linha 1, com um bloco entre duas linhas {code("---")}, só com estes campos:</span>
        <div role="table" aria-label="Campos do cabeçalho" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CABECALHO.map(([campo, obrigatorio, regra]) => (
            <div role="row" key={campo} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 12, alignItems: "baseline" }}>
              <span role="cell" style={mono(13)}>{campo}</span>
              <span role="cell" style={{ fontSize: 14, lineHeight: 1.5, color: "var(--n-700)" }}><b style={{ fontWeight: 600 }}>{obrigatorio === "Sim" ? "Obrigatório." : "Opcional."}</b> {regra}</span>
            </div>
          ))}
        </div>
        <pre style={{ margin: 0, padding: 12, background: "var(--n-100)", borderRadius: 8, ...mono(12), lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{"---\ntitulo: Política de Segurança da Informação\ntipo: documento\natualizado_em: 2026-08-14\nversao: \"3.2\"\nvalidade: 2027-08-14\n---"}</pre>
      </PanelSection>
      <PanelSection label="Datas">
        <ul style={lista}>
          <li>As datas vão no formato {code("AAAA-MM-DD")}.</li>
          <li>{code("atualizado_em")} é a data em que o conteúdo foi conferido, não a da última edição: corrigir uma vírgula não renova a data.</li>
          <li>Com mais de 120 dias desde {code("atualizado_em")}, o documento ganha o aviso “Mais de 120 dias”, e as respostas que o citam, o alerta de fonte antiga.</li>
          <li>Na data da {code("validade")}, inclusive, o documento vence: fica inativo, sai da geração e não volta pela chave.</li>
        </ul>
      </PanelSection>
      <PanelSection label="Como a base trata os arquivos">
        <ul style={lista}>
          <li>Enviar de novo um arquivo com o mesmo nome atualiza o documento; renomear cria um documento novo.</li>
          <li>Conteúdo igual ao da base é ignorado (“Sem mudança”).</li>
          <li>Campos desconhecidos no cabeçalho geram um aviso e são ignorados; arquivo sem campo obrigatório é recusado, com o motivo.</li>
          <li>O tipo (documento ou RFP passada) vem do cabeçalho de cada arquivo.</li>
          <li>Ativar e desativar é pela chave da tabela; recarregar o arquivo não muda essa escolha.</li>
          <li>Um documento vencido só volta a valer com uma nova versão, com validade futura.</li>
        </ul>
      </PanelSection>
    </SidePanel>
  );
}

/** Detalhes do documento (fase O, cenário O3): tudo o que a tabela não mostra, sem ações que mudem o documento. */
function DocDetails({ d, onClose }) {
  return (
    <SidePanel label="Detalhes do documento" eyebrow="Detalhes do documento" title={d.name} onClose={onClose} focusKey={d.id}>
      <PanelSection label="Documento">
        <PanelRow rotulo="Nome" valor={d.name} />
        <PanelRow rotulo="Arquivo" valor={d.file} mono />
        <PanelRow rotulo="Tipo" valor={d.type} />
        <PanelRow rotulo="Versão" valor={d.ver || "Sem versão"} />
      </PanelSection>
      <PanelSection label="Datas e situação">
        <PanelRow rotulo="Atualizado" valor={`${d.upd} · ${d.ageText}`} mono />
        <PanelRow rotulo="Validade" valor={d.validity} mono />
        <PanelRow rotulo="Status" valor={<span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}><Badge tone={d.tone} icon={d.icon}>{d.statusText}</Badge>{d.old ? <Badge tone="warning" icon="clock">Mais de 120 dias</Badge> : null}</span>} />
      </PanelSection>
      <PanelSection label="Envio">
        <PanelRow rotulo="Enviado por" valor={d.by} />
        <PanelRow rotulo="Enviado em" valor={d.sentAt || "—"} mono />
      </PanelSection>
    </SidePanel>
  );
}
