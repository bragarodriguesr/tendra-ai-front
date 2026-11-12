import React from "react";
import { Badge, Card, Logo, MonoLabel } from "./ds/index.js";

/* ---- Peças na escala do slide (1920×1080), montadas sobre o design system ---- */

function Eyebrow({ children, tone = "sage", size = "var(--type-eyebrow)", style, ...rest }) {
  return (
    <MonoLabel as="div" tone={tone} style={{ fontSize: size, lineHeight: "normal", ...style }} {...rest}>
      {children}
    </MonoLabel>
  );
}

function DeckCard({ children, style, ...rest }) {
  return (
    <Card padding="none" style={{ borderRadius: "var(--radius-deck-card)", color: "inherit", ...style }} {...rest}>
      {children}
    </Card>
  );
}

function Chip({ children, tone }) {
  return (
    <Badge tone={tone} style={{ fontSize: 22, lineHeight: "normal", letterSpacing: 0, padding: "12px 18px", borderRadius: "var(--radius-sm)" }}>
      {children}
    </Badge>
  );
}

function Heading({ children, maxWidth, style }) {
  return <h1 className="title title--h2" style={{ maxWidth, ...style }}>{children}</h1>;
}

// Abertura de seção: número grande em mono + título.
function SectionSlide({ number, title, lead, inverse }) {
  return (
    <>
      <Eyebrow tone={inverse ? "accent" : "sage"}>Seção {number}</Eyebrow>
      <div style={{ margin: "auto 0", display: "flex", alignItems: "flex-start", gap: 56 }}>
        <div aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: 180, lineHeight: 0.9, color: inverse ? "var(--ink-500)" : "var(--border-strong)" }}>{number}</div>
        <div style={{ display: "grid", gap: 28, paddingTop: 14 }}>
          <h1 className="title" style={{ fontSize: "var(--type-h2)", lineHeight: 1.08, maxWidth: "18ch" }}>{title}</h1>
          <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: inverse ? "var(--ink-200)" : "var(--text-body)", maxWidth: "46ch" }}>{lead}</div>
        </div>
      </div>
      <div style={{ borderTop: `3px solid ${inverse ? "var(--ink-500)" : "var(--brand-sage)"}` }} />
    </>
  );
}

// Card com eyebrow, título em display e texto (slides de três e duas colunas).
function FeatureCard({ eyebrow, title, titleSize = 34, titleLh = 1.2, children, padding = 40, gap = 22, className }) {
  return (
    <DeckCard className={["stack", className].filter(Boolean).join(" ")} style={{ padding, gap }}>
      <Eyebrow size={eyebrow.size || 26}>{eyebrow.text}</Eyebrow>
      <div className="card-title" style={{ fontSize: titleSize, lineHeight: titleLh }}>{title}</div>
      <div className="body-small">{children}</div>
    </DeckCard>
  );
}

// Par "sim / não": faixa de acento de 3px no topo (limão ou danger).
function ContrastCard({ positive, label, items, gap = 24, itemGap = 18 }) {
  return (
    <DeckCard className="stack" accentTop={positive ? "var(--brand-lime)" : "var(--danger)"} style={{ padding: 44, gap }}>
      <Eyebrow tone="state" size={24} style={positive ? undefined : { color: "var(--danger)" }}>{label}</Eyebrow>
      <div className="body-small" style={{ display: "grid", gap: itemGap }}>
        {items.map((item) => <div key={item}>{item}</div>)}
      </div>
    </DeckCard>
  );
}

/* ---- Slides ---- */

function Capa() {
  return (
    <>
      <Logo variant="ink" size={64} />
      <Eyebrow tone="inverse" style={{ margin: "auto 0 40px" }}>Apresentação do produto</Eyebrow>
      <h1 className="title" style={{ fontSize: "var(--type-display)", lineHeight: 1.02, letterSpacing: "-0.04em", margin: "0 0 48px", maxWidth: "17ch" }}>
        Responda a um RFP em <span className="mark">horas</span>, não semanas.
      </h1>
      <div className="footer-rule" style={{ borderTop: "1px solid var(--ink-500)" }}>
        <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: "var(--ink-200)", maxWidth: "42ch" }}>O cérebro comercial e técnico da sua operação.</div>
        <Eyebrow tone="inverse" style={{ textAlign: "right", lineHeight: 1.7 }}>Novembro 2026<br />Confidencial</Eyebrow>
      </div>
    </>
  );
}

const SCATTER_PATH = "M 12 9 L 88 13 L 22 50 L 91 50 L 29 89 L 88 85 Z";
const SCATTER_CHIPS = [
  { text: "E-mail", drift: "a", pos: { top: 10, left: 10 } },
  { text: "PDF antigo", drift: "b", pos: { top: 30, right: 0 } },
  { text: "Proposta anterior", drift: "c", pos: { top: 200, left: 40 } },
  { text: "Chat", drift: "d", pos: { top: 200, right: 20 } },
  { text: "Planilha", drift: "b", pos: { bottom: 20, left: 130 } },
  { text: "Pessoas", drift: "a", pos: { bottom: 40, right: 10 } }
];

function Problema() {
  return (
    <>
      <Eyebrow style={{ marginBottom: "var(--gap-title)" }}>O problema</Eyebrow>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,0.85fr)" }}>
        <div style={{ display: "grid", gap: 28, alignContent: "center" }}>
          <h1 className="title" style={{ fontSize: "var(--type-title)", lineHeight: 1.08, maxWidth: "15ch" }}>Responder uma proposta ainda começa com uma caça ao arquivo certo.</h1>
          <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "34ch" }}>
            Dias procurando informação espalhada por e-mails, PDFs antigos, propostas anteriores e mensagens de chat — sob risco constante de responder com dado desatualizado ou fora de compliance.
          </div>
        </div>
        <div style={{ display: "grid", gap: 24 }}>
          <div className="scatter">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={SCATTER_PATH} fill="none" stroke="var(--brand-ink)" strokeWidth="4.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.14" />
              <path className="dash-flow" pathLength="1" d={SCATTER_PATH} fill="none" stroke="var(--brand-lime)" strokeWidth="3" strokeDasharray="0.02 0.05" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {SCATTER_CHIPS.map((c) => (
              <div key={c.text} className={`scatter-chip drift-${c.drift}`} style={c.pos}>{c.text}</div>
            ))}
          </div>
          <Eyebrow tone="default" size={19}>↳ um processo que hoje envolve, em média, 8 pessoas e mais de 40 horas</Eyebrow>
        </div>
      </div>
    </>
  );
}

function Custo() {
  return (
    <>
      <Eyebrow tone="accent">Para refletir</Eyebrow>
      <h1 className="title" style={{ fontSize: 96, lineHeight: 1.12, margin: "auto 0", maxWidth: "20ch" }}>
        Quantas horas por semana sua equipe gasta <span className="mark" style={{ padding: "0 14px" }}>só procurando</span> informação para montar uma proposta?
      </h1>
      <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: "var(--ink-200)", maxWidth: "50ch", borderTop: "1px solid var(--ink-500)", paddingTop: 36 }}>
        Multiplique por cada proposta do mês — e pelo custo de enviar uma resposta desatualizada ou fora de compliance.
      </div>
    </>
  );
}

function SecaoSolucao() {
  return <SectionSlide number="02" title="A solução" lead="Tendra.ai: da caça ao arquivo à resposta revisada e aprovada." />;
}

const UPLOADS = ["RFPs passadas, com perguntas e respostas", "Whitepapers, políticas e certificações", "Documentação técnica do produto"];

function Produto() {
  return (
    <>
      <Eyebrow style={{ marginBottom: "var(--gap-title)" }}>O produto</Eyebrow>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,0.9fr)" }}>
        <div style={{ display: "grid", gap: 28 }}>
          <Heading maxWidth="16ch">Uma plataforma que transforma dado desestruturado em proposta vencedora.</Heading>
          <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "36ch" }}>
            A empresa sobe os seus documentos e a Tendra.ai responde a partir deles — no lugar de um processo que hoje exige, em média, 8 pessoas e mais de 40 horas por proposta.
          </div>
          <div className="chips">
            <Chip tone="approved">Conhecimento centralizado</Chip>
            <Chip tone="neutral">Sem pessoa-chave</Chip>
          </div>
        </div>
        <DeckCard tone="ink" style={{ padding: 44, display: "grid", gap: 24, borderColor: "var(--ink-600)" }}>
          <Eyebrow tone="inverse" size={22}>A empresa sobe, em .md</Eyebrow>
          <div style={{ display: "grid", gap: 14 }}>
            {UPLOADS.map((u) => (
              <Card key={u} tone="ink-panel" padding="none" radius="lg" style={{ padding: "18px 22px", color: "var(--n-075)", fontSize: 24 }}>{u}</Card>
            ))}
          </div>
          <div aria-hidden="true" style={{ textAlign: "center", color: "var(--brand-lime)", fontFamily: "var(--font-mono)", fontSize: 26 }}>↓</div>
          <div style={{ background: "var(--lime-wash)", border: "1px solid var(--brand-lime)", borderRadius: "var(--radius-lg)", padding: 22, color: "var(--brand-paper)", fontSize: 26, fontWeight: 600, textAlign: "center" }}>Base do cliente, indexada</div>
        </DeckCard>
      </div>
    </>
  );
}

const STEPS = [
  { n: "01", title: "Importação e indexação", text: "A empresa sobe seus documentos em .md e a plataforma os divide em trechos citáveis, numa base própria da organização." },
  { n: "02", title: "Geração com rastreabilidade", text: "Ao subir uma nova RFP em planilha .xlsx, a IA cruza as perguntas com a base e gera o rascunho com a fonte de cada resposta." },
  { n: "03", title: "Revisão e aprovação", text: "O time deixa de escrever do zero e passa a revisar. A IA classifica cada pergunta por área, e só o Aprovador daquela área a aprova." }
];

function ComoFunciona() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Como funciona</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: "var(--gap-title)" }}>Três passos, nenhuma resposta sem fonte.</Heading>
      <div className="cols cols--3">
        {STEPS.map((s, i) => (
          <FeatureCard key={s.n} className={`rise-${i + 1}`} eyebrow={{ text: s.n }} title={s.title} titleSize={38} titleLh={1.15}>{s.text}</FeatureCard>
        ))}
      </div>
    </>
  );
}

const COVERAGE = 92;
const COVERAGE_MS = 1600; // --duration-fill

// Conta de 0 a 92% a cada entrada no slide (e repete a cada 15s enquanto ele está na tela).
function useCoverage(active) {
  const [pct, setPct] = React.useState(COVERAGE);
  React.useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPct(COVERAGE);
      return undefined;
    }
    let raf;
    const play = () => {
      const start = performance.now();
      cancelAnimationFrame(raf);
      const step = (now) => {
        const t = Math.min(1, (now - start) / COVERAGE_MS);
        setPct(Math.round((1 - Math.pow(1 - t, 3)) * COVERAGE));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      setPct(0);
      raf = requestAnimationFrame(step);
    };
    play();
    const interval = setInterval(play, 15000);
    return () => { clearInterval(interval); cancelAnimationFrame(raf); };
  }, [active]);
  return pct;
}

function Rastreabilidade({ active }) {
  const pct = useCoverage(active);
  return (
    <>
      <Eyebrow style={{ marginBottom: "var(--gap-title)" }}>Conformidade</Eyebrow>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)" }}>
        <div style={{ display: "grid", gap: 28 }}>
          <Heading maxWidth="15ch" style={{ lineHeight: 1.08 }}>Cada resposta chega com a fonte que a sustenta.</Heading>
          <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "34ch" }}>
            O revisor vê a afirmação, o documento de origem, a seção e a linha. Texto da IA sem fonte é descartado, e nenhum item sai sem aprovação humana.
          </div>
          <div className="chips">
            <Chip tone="approved">Conformidade OK</Chip>
            <Chip tone="neutral">Fonte rastreável</Chip>
          </div>
        </div>
        <Card tone="ink" padding="none" style={{ borderRadius: 26, padding: 46, display: "grid", gap: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
            <Eyebrow as="span" tone="inverse" size={22}>REQ-084/210 · Cliente exemplo</Eyebrow>
            <Logo variant="ink" lockup="symbol" size={34} />
          </div>
          <Card tone="ink-panel" padding="none" radius="3xl" style={{ padding: 32, display: "grid", gap: 22 }}>
            <div style={{ fontSize: 25, lineHeight: 1.45, color: "var(--ink-200)" }}>"Descreva os controles de criptografia de dados em repouso."</div>
            <div style={{ height: 1, background: "var(--ink-600)" }} />
            <div style={{ fontSize: 27, lineHeight: 1.55, color: "var(--n-075)" }}>Os dados em repouso são criptografados com AES-256. Os dados em trânsito usam TLS 1.2 ou superior.</div>
            <MonoLabel as="div" size="mono" tone="inverse" uppercase={false} style={{ fontSize: 21 }}>↳ politica-seguranca-informacao.md · 4. Criptografia · linha 36</MonoLabel>
          </Card>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Eyebrow as="span" tone="inverse" size={21}>Preenchimento</Eyebrow>
              <Eyebrow as="span" tone="accent" size={21}>{pct}%</Eyebrow>
            </div>
            <div role="progressbar" aria-label="Preenchimento" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 10, background: "var(--ink-600)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: pct + "%", background: "var(--brand-lime)" }} />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

const ARCH = [
  { eyebrow: "Motor de IA", title: "Claude via API da Anthropic", text: "O modelo redige a resposta só com o que está na base da organização. Pela API comercial, o dado do cliente não é usado para treinar modelos." },
  { eyebrow: "Contexto e citações", title: "Base inteira no contexto, com citações", text: "Sem embeddings: o modelo lê toda a base ativa da organização e cita os trechos. O código confere cada citação contra o documento e descarta texto sem fonte." },
  { eyebrow: "Dados e acesso", title: "Postgres gerenciado + RBAC", text: "Documentos e respostas no Postgres gerenciado (Supabase), separados por organização. Perfis Revisor e Aprovador (RBAC), com aprovação por área, já implementados." }
];

function Arquitetura() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Arquitetura</Eyebrow>
      <Heading maxWidth="26ch" style={{ marginBottom: "var(--gap-title)" }}>Uma base técnica pensada para não alucinar.</Heading>
      <div className="cols cols--3">
        {ARCH.map((a) => (
          <FeatureCard key={a.eyebrow} eyebrow={{ text: a.eyebrow }} title={a.title}>{a.text}</FeatureCard>
        ))}
      </div>
    </>
  );
}

function SecaoNegocio() {
  return <SectionSlide inverse number="03" title="O negócio" lead="Cliente ideal, modelo de receita e o que compõe o MVP." />;
}

const ICP = [
  { label: "Setor-alvo", value: "Tecnologia — Software e Infraestrutura" },
  { label: "Porte", value: "Mid-market a Enterprise, com área de licitações ou pré-vendas" },
  { label: "Usuário final", value: "Engenheiro de pré-vendas, Bid Manager, Analista Jurídico" },
  { label: "Decisor de compra", value: "Diretor de Vendas (CSO) ou Diretor de Operações (COO)" }
];

function ClienteIdeal() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Perfil de cliente</Eyebrow>
      <Heading maxWidth="26ch" style={{ marginBottom: 20 }}>Foco em concorrências técnicas, longas e reguladas.</Heading>
      <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "56ch", marginBottom: "var(--gap-title)" }}>
        Onde copiar e colar tradicionalmente gera mais risco de compliance do que agilidade.
      </div>
      <div className="cols cols--2" style={{ gap: 28 }}>
        {ICP.map((c) => (
          <DeckCard key={c.label} className="stack" style={{ padding: 36, gap: 12 }}>
            <Eyebrow size={21}>{c.label}</Eyebrow>
            <div style={{ fontSize: 30, lineHeight: 1.3, fontWeight: 600 }}>{c.value}</div>
          </DeckCard>
        ))}
      </div>
      <Eyebrow tone="default" size={20} style={{ marginTop: 28 }}>Mercado potencial fora do foco do MVP: Engenharia, Logística, Saúde e Consultoria.</Eyebrow>
    </>
  );
}

function Diferencial() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Diferencial</Eyebrow>
      <Heading maxWidth="30ch" style={{ marginBottom: "var(--gap-title)" }}>Copiar e colar não escala com segurança.</Heading>
      <div className="cols cols--2">
        <ContrastCard positive label="Com Tendra.ai" items={[
          "Resposta com fonte rastreável até o documento de origem.",
          "Base de conhecimento centralizada, sem repetir o trabalho em cada proposta.",
          "Time revisa e aprova, não redige do zero."
        ]} />
        <ContrastCard label="Copiar e colar tradicional" items={[
          "Processo que hoje envolve, em média, 8 pessoas e mais de 40 horas por proposta.",
          "Resposta sem link para a fonte que a sustenta.",
          "Risco de compliance a cada novo envio."
        ]} />
      </div>
    </>
  );
}

function Receita() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Modelo de receita</Eyebrow>
      <Heading maxWidth="30ch" style={{ marginBottom: 20 }}>Preço por revisor, não por resposta.</Heading>
      <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "56ch", marginBottom: "var(--gap-title)" }}>
        Cobrar por resposta gerada premiaria o volume. Cobramos por quem revisa, porque é a revisão que garante a entrega.
      </div>
      <div className="cols cols--2">
        <FeatureCard eyebrow={{ text: "Assentos", size: 24 }} title="Por revisor" titleSize={40} titleLh="normal" padding={44} gap={20}>
          No plano Basic, até 5 revisores com acesso à plataforma: pré-vendas, jurídico e engenharia.
        </FeatureCard>
        <FeatureCard eyebrow={{ text: "Volume", size: 24 }} title="Por semestre" titleSize={40} titleLh="normal" padding={44} gap={20}>
          No plano Basic, até 20 RFPs por semestre. No Enterprise, volume ilimitado, com SSO.
        </FeatureCard>
      </div>
    </>
  );
}

function Escopo() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Escopo</Eyebrow>
      <Heading maxWidth="30ch" style={{ marginBottom: "var(--gap-title)" }}>O que compõe o MVP.</Heading>
      <div className="cols cols--2">
        <ContrastCard positive label="Dentro do MVP" gap={20} itemGap={16} items={[
          "Upload de documentos e RFPs passadas em .md, numa base isolada por organização e usada para elaborar as respostas.",
          "Processamento de uma nova RFP em planilha .xlsx e geração do rascunho de resposta.",
          "Fonte citada em cada resposta (arquivo · seção · linha), com o trecho original a um clique.",
          "Aprovação por área: cada pergunta vai ao Aprovador responsável (Produto, Tecnologia, Segurança e privacidade, Comercial ou Jurídico)."
        ]} />
        <ContrastCard label="Fora do MVP" gap={20} itemGap={16} items={[
          "Conversão de PDF, DOCX e outros formatos para a base.",
          "Integrações nativas via API com CRMs, como Salesforce.",
          "Conexão direta com diretórios corporativos (Google Drive, SharePoint).",
          "Fluxos complexos de aprovação em múltiplos níveis de diretoria."
        ]} />
      </div>
    </>
  );
}

const METRICS = [
  { label: "ROI para o cliente", items: ["Tempo de ciclo de resposta", "Taxa de aceitação da IA, sem reescrita", "Win rate do cliente"] },
  { label: "Sucesso do produto", items: ["Time-to-First-Value (TTFV)", "CAC versus LTV"] }
];

function Metricas() {
  return (
    <>
      <Eyebrow tone="accent" style={{ marginBottom: 26 }}>Métricas</Eyebrow>
      <Heading maxWidth="30ch" style={{ marginBottom: "var(--gap-title)" }}>Como medimos o resultado.</Heading>
      <div className="cols cols--2" style={{ gap: 56 }}>
        {METRICS.map((m) => (
          <div key={m.label} className="stack" style={{ gap: 28 }}>
            <Eyebrow tone="inverse" size={22} style={{ borderBottom: "1px solid var(--ink-500)", paddingBottom: 18 }}>{m.label}</Eyebrow>
            {m.items.map((item) => (
              <div key={item} style={{ fontSize: 30, lineHeight: 1.4, color: "var(--n-075)" }}>{item}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

const ROADMAP = [
  "Integrações nativas com CRMs (Salesforce)",
  "Upload de PDF, DOCX e PPTX e conexão com Google Drive e SharePoint",
  "Fluxos de aprovação em múltiplos níveis",
  "Integrações via MCP com documentações técnicas de API",
  "Base pré-carregada com normas técnicas e regulatórias do mercado brasileiro (LGPD etc.)",
  "Modo assistente para preparação de documentos de propostas comerciais e técnicas",
  "Expansão para Engenharia, Logística, Saúde e Consultoria"
];

function Roadmap() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Depois do MVP</Eyebrow>
      <Heading maxWidth="26ch" style={{ marginBottom: "var(--gap-title)" }}>Roadmap.</Heading>
      <div className="roadmap">
        <div className="roadmap-line" />
        <ol className="roadmap-steps">
          {ROADMAP.map((text, i) => (
            <li key={text} className="roadmap-step">
              <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true" style={{ zIndex: 1, flexShrink: 0 }}>
                <rect width="48" height="48" rx="8" fill="var(--brand-ink)" />
                <rect x="17" y="17" width="14" height="14" fill="var(--brand-lime)" />
              </svg>
              <Eyebrow size={19}>{String(i + 1).padStart(2, "0")}</Eyebrow>
              <DeckCard style={{ padding: "22px 18px", fontSize: 21, lineHeight: 1.35, textAlign: "center" }}>{text}</DeckCard>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

const TEAM = ["Rafael Braga", "Matheus Alcântara", "Mariana Fugimoto", "Renata Lima", "Everton Santos", "Roberta Vitalina"];

function Time() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Quem constrói</Eyebrow>
      <Heading maxWidth="26ch" style={{ marginBottom: "var(--gap-title)" }}>Nosso time.</Heading>
      <div className="cols cols--3" style={{ gap: 28, alignContent: "center" }}>
        {TEAM.map((name) => (
          <DeckCard key={name} style={{ padding: "32px 24px", display: "grid", justifyItems: "center", gap: 20, textAlign: "center" }}>
            <div className="avatar" aria-hidden="true" />
            <div style={{ fontSize: 25, fontWeight: 600 }}>{name}</div>
          </DeckCard>
        ))}
      </div>
    </>
  );
}

function Fechamento() {
  return (
    <>
      <Logo variant="mono-ink" size={48} />
      <h1 className="title" style={{ fontSize: 100, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "auto 0 48px", maxWidth: "17ch" }}>
        Vamos levar sua equipe da caça por respostas à revisão e aprovação.
      </h1>
      <div className="footer-rule" style={{ borderTop: "2px solid var(--brand-ink)" }}>
        <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, fontWeight: 600 }}>contato@tendra.ai · tendra.ai</div>
        <Eyebrow style={{ color: "inherit" }}>Perguntas da banca</Eyebrow>
      </div>
    </>
  );
}

// tone: campo do slide (paper | ink | lime). notes: notas do apresentador (tecla N).
export const SLIDES = [
  { label: "Capa", tone: "ink", Component: Capa, notes: "Abertura: apresentar o Tendra.ai e a promessa central antes de detalhar a dor." },
  { label: "O problema", tone: "paper", Component: Problema, notes: "Descrever a dor: dias caçando informação dispersa, risco de compliance." },
  { label: "Custo do problema", tone: "ink", Component: Custo, notes: "Pausa para a banca refletir sobre o custo real antes de apresentar a solução." },
  { label: "Seção: A solução", tone: "paper", Component: SecaoSolucao, notes: "Transição para a apresentação do produto." },
  { label: "Introduzindo Tendra.ai", tone: "paper", Component: Produto, notes: "Apresentar o produto como cérebro comercial e técnico da empresa." },
  { label: "Como funciona", tone: "paper", Component: ComoFunciona, notes: "Os três passos do fluxo: subir a base em .md, gerar com fonte a partir da planilha .xlsx, revisar e aprovar pela área responsável." },
  { label: "Rastreabilidade", tone: "paper", Component: Rastreabilidade, notes: "Mostrar o exemplo de resposta com fonte citada e a barra de preenchimento." },
  { label: "Arquitetura técnica", tone: "paper", Component: Arquitetura, notes: "Explicar por que a base técnica evita alucinação: Claude via API da Anthropic lendo a base inteira da organização, citações conferidas pelo código, Postgres gerenciado separado por organização e perfis Revisor e Aprovador (RBAC) com aprovação por área." },
  { label: "Seção: O negócio", tone: "ink", Component: SecaoNegocio, notes: "Transição para cliente, modelo de receita e escopo do MVP." },
  { label: "Cliente ideal", tone: "paper", Component: ClienteIdeal, notes: "Descrever o ICP: vertical, porte e personas." },
  { label: "Diferencial competitivo", tone: "paper", Component: Diferencial, notes: "Contraste entre o método tradicional e o Tendra.ai." },
  { label: "Modelo de receita", tone: "paper", Component: Receita, notes: "Mesmo modelo da página de Preços do site: cobrança por revisor; o plano Basic tem até 5 revisores e 20 RFPs por semestre, e o Enterprise tem volume ilimitado." },
  { label: "Escopo do MVP", tone: "paper", Component: Escopo, notes: "O que está dentro e fora do MVP: base em .md, RFP em .xlsx e aprovação por área dentro; outros formatos e integrações fora." },
  { label: "Métricas", tone: "ink", Component: Metricas, notes: "Como medimos ROI para o cliente e sucesso do produto." },
  { label: "Roadmap", tone: "paper", Component: Roadmap, notes: "O que vem depois do MVP." },
  { label: "Time", tone: "paper", Component: Time, notes: "Apresentar o time fundador." },
  { label: "Fechamento", tone: "lime", Component: Fechamento, notes: "Encerrar reforçando a promessa central e abrir para perguntas da banca." }
];
