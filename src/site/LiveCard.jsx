import React from "react";
import { Badge, Card, Divider, Icon, MonoLabel, ProgressBar, SourceTrail } from "../ds/index.js";
import { REDUCED, makeCtx, onView, run } from "./demo/motor.js";

// Requisitos de exemplo que o cartão responde em sequência. O primeiro é o estado de repouso
// (o mesmo cartão estático de antes), usado também com movimento reduzido.
const REQS = [
  { id: "REQ-084", q: "Descreva os controles de criptografia de dados em repouso e em trânsito.", a: "Dados em repouso cifrados com AES-256, chaves em HSM FIPS 140-2 nível 3 com rotação a cada 90 dias; tráfego em TLS 1.3 com perfect forward secrecy.", file: "whitepaper-seguranca.md · 3.2 Criptografia · linha 48", pct: 92 },
  { id: "REQ-085", q: "Onde ficam armazenados os backups?", a: "Backups ficam em região distinta da produção, criptografados com AES-256 e retidos por 35 dias.", file: "politica-backup-dr.md · 4. Cópias · linha 33", pct: 93, aviso: "Fonte com mais de 120 dias" },
  { id: "REQ-086", q: "A plataforma possui certificação ISO 27001?", a: "Sim. A certificação ISO/IEC 27001 está vigente, com escopo que cobre desenvolvimento e operação da plataforma.", file: "certificado-iso27001.md · 1. Escopo · linha 12", pct: 94 }
];
const palavras = (t) => t.split(" ");
const PRONTO = { n: 0, q: Infinity, a: Infinity, fonte: true, etapa: "ok", pct: REQS[0].pct };

function Selo({ etapa, aviso }) {
  if (etapa === "ok") return <Badge tone="approved-inverse" icon="check">Conformidade OK</Badge>;
  if (etapa === "aviso") return <Badge tone="warning" icon="clock">{aviso}</Badge>;
  if (etapa === "aprovada") return <Badge tone="approved-inverse" icon="check-check">Aprovada por M. Vieira</Badge>;
  const rotulo = { lendo: "Lendo o edital", redigindo: "Redigindo", verificando: "Verificando a citação" }[etapa];
  return (
    <Badge tone="inverse">
      <span className="tdr-site-live-spin"><Icon name="loader-circle" size={12} /></span>
      {rotulo}
    </Badge>
  );
}

/**
 * Cartão do hero: a pergunta do edital é digitada, a resposta é escrita com a fonte, a citação é
 * verificada e a pessoa aprova. Roda só enquanto está na tela.
 */
export function LiveCard() {
  const ref = React.useRef(null);
  const [s, setS] = React.useState(PRONTO);
  React.useEffect(() => {
    if (REDUCED || !ref.current) return undefined;
    let tk = { off: true };
    const loop = async () => {
      const c = makeCtx(tk);
      await c.wait(2600);
      for (let n = 1; ; n++) {
        const i = n % REQS.length, r = REQS[i];
        const pct = REQS[(i + REQS.length - 1) % REQS.length].pct;
        setS({ n: i, q: 0, a: 0, fonte: false, etapa: "lendo", pct });
        await c.wait(400);
        for (let k = 1; k <= r.q.length; k++) { setS((p) => ({ ...p, q: k })); await c.wait(16); }
        await c.wait(500);
        setS((p) => ({ ...p, q: Infinity, etapa: "redigindo" }));
        const total = palavras(r.a).length;
        for (let k = 1; k <= total; k++) { setS((p) => ({ ...p, a: k })); await c.wait(60); }
        setS((p) => ({ ...p, a: Infinity, fonte: true }));
        await c.wait(700);
        setS((p) => ({ ...p, etapa: "verificando" }));
        await c.wait(1100);
        setS((p) => ({ ...p, etapa: r.aviso ? "aviso" : "ok" }));
        await c.wait(1500);
        setS((p) => ({ ...p, etapa: "aprovada", pct: r.pct }));
        await c.wait(2800);
      }
    };
    const parar = onView(ref.current, (v) => { tk.off = true; if (v) { tk = { off: false }; run(loop()); } });
    return () => { tk.off = true; parar(); };
  }, []);

  const r = REQS[s.n];
  const resposta = palavras(r.a);
  return (
    <Card tone="ink" radius="3xl" padding="lg" role="img" aria-label="Exemplo: a Tendra.ai responde a um requisito do edital citando o documento, a seção e a linha da fonte.">
      <div ref={ref} aria-hidden="true" style={{ display: "grid", gap: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3) var(--space-4)", flexWrap: "wrap" }}>
          <MonoLabel tone="inverse">{r.id}/210 · Banco Aurora</MonoLabel>
          <Selo etapa={s.etapa} aviso={r.aviso} />
        </div>
        <Card tone="ink-panel" radius="lg" padding="sm">
          <div className="tdr-site-live-panel">
            <div className="tdr-site-live-q">{s.q > 0 ? `“${r.q.slice(0, s.q)}${s.q >= r.q.length ? "”" : ""}` : ""}</div>
            <Divider tone="inverse" />
            <div className="tdr-site-live-a">
              {s.n === 0 && s.a === Infinity ? (
                <>Dados em repouso cifrados com AES-256, chaves em HSM FIPS 140-2 nível 3 com rotação a cada 90 dias; tráfego em TLS 1.3 com <span style={{ color: "var(--brand-lime)" }}>perfect forward secrecy</span>.</>
              ) : resposta.slice(0, s.a).map((w, k) => <span key={`${s.n}-${k}`} className="tdr-site-live-w">{w} </span>)}
            </div>
            <SourceTrail key={`${s.n}-${s.fonte}`} tone="ink" className={s === PRONTO ? undefined : "tdr-site-live-src"} style={{ visibility: s.fonte ? "visible" : "hidden" }} sources={[{ file: r.file }]} />
          </div>
        </Card>
        <ProgressBar tone="ink" label="Preenchimento automático" value={s.pct} />
      </div>
    </Card>
  );
}
