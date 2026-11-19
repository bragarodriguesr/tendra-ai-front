import React from "react";
import { Badge, Button, Card, Icon, MonoLabel } from "../ds/index.js";
import { REDUCED, cycle } from "./demo/motor.js";

const h3 = { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", lineHeight: 1.25, letterSpacing: "-0.02em", color: "var(--text-strong)" };
const sub = { margin: 0, fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" };

// Trechos de exemplo que sustentam cada citação do cartão "Fonte de cada afirmação".
const FONTES = [
  { file: "politica-backup-dr.md", page: "4. Cópias · linha 33", antes: "…as cópias são armazenadas em ", marca: "região distinta da produção", depois: ", com replicação diária…" },
  { file: "whitepaper-seguranca.md", page: "3.2 Criptografia · linha 48", antes: "…backups e volumes são ", marca: "criptografados com AES-256", depois: ", com chaves em HSM…" },
  { file: "politica-backup-dr.md", page: "4.2 Retenção · linha 41", antes: "…a retenção padrão das cópias é de ", marca: "35 dias", depois: ", salvo exigência contratual…" }
];

/** Liga o ciclo "acende um a um" no elemento enquanto ele está montado. */
function useCycle(opts) {
  const ref = React.useRef(null);
  React.useEffect(() => (ref.current ? cycle(ref.current, opts) : undefined), []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

function Tile({ wide, titulo, texto, children }) {
  return (
    <Card as="article" padding="md" radius="2xl" className={"tdr-site-feat" + (wide ? " is-wide" : "")}>
      <div style={{ display: "grid", gap: 6 }}>
        <h3 style={h3}>{titulo}</h3>
        <p style={sub}>{texto}</p>
      </div>
      {children}
    </Card>
  );
}

/** Citações clicáveis: cada selo mostra o trecho do documento que sustenta a afirmação. */
function FonteDemo() {
  const [n, setN] = React.useState(0);
  const pausa = React.useRef(0);
  React.useEffect(() => {
    if (REDUCED) return undefined;
    const t = setInterval(() => { if (Date.now() > pausa.current && !document.hidden) setN((k) => (k + 1) % FONTES.length); }, 2800);
    return () => clearInterval(t);
  }, []);
  const escolher = (i) => { pausa.current = Date.now() + 6000; setN(i); };
  const cite = (i) => (
    <button type="button" className={"tdr-site-cite" + (i === n ? " is-on" : "")} aria-label={`Ver fonte ${i + 1}`} aria-pressed={i === n} onMouseEnter={() => escolher(i)} onFocus={() => escolher(i)} onClick={() => escolher(i)}>{i + 1}</button>
  );
  const f = FONTES[n];
  return (
    <div className="tdr-site-feat-demo tdr-site-feat-src">
      <p className="tdr-site-feat-ans">Backups ficam em região distinta da produção {cite(0)}, criptografados com AES-256 {cite(1)} e retidos por 35 dias {cite(2)}.</p>
      <div key={n} className="tdr-site-feat-panel" aria-live="polite">
        <span className="tdr-site-feat-file"><Icon name="file-text" size="sm" /><span><b>{f.file}</b> · {f.page}</span></span>
        <p>{f.antes}<mark>{f.marca}</mark>{f.depois}</p>
      </div>
    </div>
  );
}

/** "Funcionalidades": cinco cartões com um fragmento de interface em movimento cada. */
export function Features() {
  const alertas = useCycle({ step: 700, hold: 2600 });
  const barras = useCycle({ step: 160, hold: 3600 });
  const base = useCycle({ step: 700, hold: 3000 });
  const diff = useCycle({ step: 900, hold: 3200 });
  return (
    <div className="tdr-site-feats">
      <Tile wide titulo="Fonte de cada afirmação, até a linha" texto="Passe o cursor por uma citação para ver o trecho do documento que a sustenta.">
        <FonteDemo />
      </Tile>
      <Tile titulo="Alertas que pedem atenção" texto="A revisão começa pelo que tem risco.">
        <div ref={alertas} className="tdr-site-feat-demo" aria-hidden="true">
          {[["warning", "Fonte antiga", "REQ-091"], ["warning", "Sem fonte na base", "REQ-117"], ["neutral", "Baixa confiança", "REQ-140"]].map(([tone, t, id]) => (
            <div key={id} className="tdr-site-feat-row vi on"><Badge tone={tone}>{t}</Badge><span>{id}</span></div>
          ))}
        </div>
      </Tile>
      <Tile titulo="Dashboard da operação" texto="Status, prazos e volume de propostas em uma tela.">
        <div ref={barras} className="tdr-site-feat-demo" aria-hidden="true">
          <MonoLabel>RFPs concluídas por mês</MonoLabel>
          <div className="tdr-site-feat-bars">{[38, 52, 46, 68, 74, 92].map((h, i) => <i key={i} className="vi on" style={{ height: h + "%" }} />)}</div>
          <div className="tdr-site-feat-bars-x">{["Jun", "Jul", "Ago", "Set", "Out", "Nov"].map((m) => <MonoLabel key={m}>{m}</MonoLabel>)}</div>
        </div>
      </Tile>
      <Tile titulo="Base curada, com validade" texto="Cada documento tem quem enviou, versão e validade.">
        <div ref={base} className="tdr-site-feat-demo" aria-hidden="true">
          {[["certificado-iso27001.md", "approved", "Vigente"], ["politica-backup-dr.md", "warning", "Mais de 120 dias"], ["rfp-aurora-2025.md", "neutral", "RFP passada"]].map(([f, tone, t]) => (
            <div key={f} className="tdr-site-feat-row vi on"><span>{f}</span><Badge tone={tone}>{t}</Badge></div>
          ))}
        </div>
      </Tile>
      <Tile titulo="Revisão de texto com IA" texto="Nas respostas manuais, sob demanda: corrige a redação sem acrescentar informação.">
        <div ref={diff} className="tdr-site-feat-demo" aria-hidden="true">
          <p className="tdr-site-feat-diff">A plataforma <span className="del vi on">tem</span> <span className="ins vi on">mantém</span> a certificação ISO/IEC 27001 <span className="del vi on">valida</span><span className="ins vi on"> vigente</span>.</p>
          <div><Button size="sm" variant="secondary" icon="sparkles" tabIndex={-1}>Revisar com IA</Button></div>
        </div>
      </Tile>
    </div>
  );
}
