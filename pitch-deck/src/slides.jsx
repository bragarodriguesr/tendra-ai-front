import React from "react";
import { AnimatedLogo, Badge, Card, Icon, Logo, MonoLabel } from "./ds/index.js";
import { Player } from "./demo/motor.js";
import { CENAS, side } from "./demo/cenas.js";
import { STACK_ICONS } from "./stack-icons.js";
import "./demo/demo.css";

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

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Abertura de seção (slides 04 e 09): o título é escrito letra a letra e dá lugar ao logo animado,
// sobre o campo Aurora do slide. Recomeça a cada entrada no slide; com movimento reduzido, mostra o logo.
function SectionIntro({ active, title, logo }) {
  const [typed, setTyped] = React.useState(REDUCED ? title.length : 0);
  const [phase, setPhase] = React.useState(REDUCED ? "logo" : "typing");
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active || REDUCED) return undefined;
    setTyped(0);
    setPhase("typing");
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    let t = 500;
    for (let k = 1; k <= title.length; k++) later((t += 110), () => setTyped(k));
    later((t += 1100), () => setPhase("out"));
    later((t += 650), () => { setPhase("logo"); ref.current?.replay?.(); });
    return () => timers.forEach(clearTimeout);
  }, [active, title]);
  return (
    <div className="intro" data-phase={phase}>
      <h1 className="title intro-title" aria-label={title}>
        <span aria-hidden="true">{title.slice(0, typed)}</span>
        <span className="intro-caret" aria-hidden="true" />
      </h1>
      <div className="title intro-print" aria-hidden="true">{title}</div>
      <div className="intro-logo">
        {/* O desenho do logo tem folga à direita: o deslocamento centra o conjunto visível. */}
        <AnimatedLogo ref={ref} variant={logo} bare once paused={!active || phase !== "logo"} style={{ width: 760, marginLeft: 76 }} title="Tendra.ai" />
      </div>
    </div>
  );
}

// Card com eyebrow, título em display e texto (slides de três e duas colunas).
function FeatureCard({ eyebrow, title, titleSize = 34, titleLh = 1.2, children, padding = 40, gap = 22, className }) {
  return (
    <DeckCard className={["stack", className].filter(Boolean).join(" ")} style={{ padding, gap }}>
      {eyebrow ? <Eyebrow size={eyebrow.size || 26}>{eyebrow.text}</Eyebrow> : null}
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

// Logo animado na proporção do estático (símbolo de 64 px: viewBox de 224×48, com 4 de folga à esquerda).
const CAPA_LOGO_ALTURA = 64;
const CAPA_LOGO_FINAL = 5; // segundos: quadro com o logo completo (o mesmo do `once` e do movimento reduzido)

function Capa({ active }) {
  const ref = React.useRef(null);
  // Toca uma vez a cada entrada no slide; fora dele (e no PDF), fica no quadro completo.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active && !REDUCED) el.replay?.();
    else { el.pause?.(); el.currentTime = CAPA_LOGO_FINAL; }
  }, [active]);
  const k = CAPA_LOGO_ALTURA / 48;
  return (
    <>
      <AnimatedLogo ref={ref} variant="ink" bare once style={{ width: 224 * k, marginLeft: -4 * k }} title="Tendra.ai" />
      <h1 className="title" style={{ fontSize: "var(--type-display)", lineHeight: 1.02, letterSpacing: "-0.04em", margin: "auto 0 48px", maxWidth: "17ch" }}>
        Responda a um RFP em <span className="mark">horas</span>, não semanas.
      </h1>
      <div className="footer-rule" style={{ borderTop: "1px solid var(--ink-500)" }}>
        <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: "var(--ink-200)", maxWidth: "42ch" }}>O cérebro comercial e técnico da sua operação.</div>
        <Eyebrow tone="inverse" style={{ textAlign: "right", lineHeight: 1.7 }}>Novembro 2026<br />Confidencial</Eyebrow>
      </div>
    </>
  );
}

// Slide 02: as fontes espalhadas, uma após a outra, ligadas por um conector limão em gradiente.
// "mail" e "sheet" vêm do Lucide (ISC), como os demais ícones do DS; o resto usa o <Icon>.
const FONTE_GLIFOS = {
  mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect>',
  sheet: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 9v12"></path><path d="M15 9v12"></path>'
};
// Centro do ícone de cada fonte, em px, num quadro de 760×580 (zigue-zague de cima para baixo).
const FONTES = [
  { text: "E-mail", glifo: "mail", x: 110, y: 66 },
  { text: "PDF antigo", icon: "file-text", x: 640, y: 84 },
  { text: "Proposta anterior", icon: "archive", x: 150, y: 276 },
  { text: "Chat", icon: "message-square", x: 620, y: 288 },
  { text: "Planilha", glifo: "sheet", x: 120, y: 486 },
  { text: "Pessoas", icon: "users", x: 640, y: 476 }
];
const FONTE_LIGACOES = FONTES.slice(1).map((b, i) => {
  const a = FONTES[i];
  return { x: a.x, y: a.y, len: Math.hypot(b.x - a.x, b.y - a.y), ang: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
});

function FonteIcone({ fonte }) {
  if (fonte.icon) return <Icon name={fonte.icon} size={48} strokeWidth={1.75} />;
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }} dangerouslySetInnerHTML={{ __html: FONTE_GLIFOS[fonte.glifo] }} />
  );
}

function Problema({ active }) {
  // A sequência toca de novo a cada entrada no slide.
  const [run, setRun] = React.useState(0);
  React.useEffect(() => { if (active) setRun((n) => n + 1); }, [active]);
  return (
    <>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,0.85fr)" }}>
        <div style={{ display: "grid", gap: 28, alignContent: "center" }}>
          <h1 className="title" style={{ fontSize: "var(--type-title)", lineHeight: 1.08, maxWidth: "15ch" }}>Responder uma proposta ainda começa com uma caça ao arquivo certo.</h1>
          <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "34ch" }}>
            Dias procurando informação espalhada por e-mails, PDFs antigos, propostas anteriores e mensagens de chat — sob risco constante de responder com dado desatualizado ou fora de compliance.
          </div>
        </div>
        <div style={{ display: "grid", gap: 24 }}>
          <div key={run} className="fontes" role="img" aria-label="Fontes espalhadas: e-mail, PDF antigo, proposta anterior, chat, planilha e pessoas">
            {FONTE_LIGACOES.map((l, i) => (
              <i key={i} className="fonte-link" style={{ left: l.x, top: l.y, width: l.len, transform: `rotate(${l.ang}deg)`, "--i": i }} />
            ))}
            {FONTES.map((f, i) => (
              <div key={f.text} className="fonte" style={{ left: f.x, top: f.y, "--i": i }} aria-hidden="true">
                <span className="fonte-icone"><FonteIcone fonte={f} /></span>
                <span className="fonte-tag">{f.text}</span>
              </div>
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
      <h1 className="title" style={{ fontSize: 96, lineHeight: 1.12, margin: "auto 0", maxWidth: "20ch" }}>
        Quantas horas por semana sua equipe gasta <span className="mark" style={{ padding: "0 14px" }}>só procurando</span> informação para montar uma proposta?
      </h1>
      <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: "var(--ink-200)", maxWidth: "50ch", borderTop: "1px solid var(--ink-500)", paddingTop: 36 }}>
        Multiplique por cada proposta no mês — e pelo custo de enviar uma resposta desatualizada ou fora de compliance. Em média, 45 de cada 100 ficam sem resposta validada por falta de capacidade.
      </div>
    </>
  );
}

function SecaoSolucao({ active }) {
  return <SectionIntro active={active} title="A solução" logo="lime" />;
}

// Janela do produto: toca uma cena da demonstração do site ("O produto em ação"), em laço, enquanto
// está visível. O palco tem 920×520 e é escalado para a largura do cartão.
function DemoWindow({ scene, label }) {
  const win = React.useRef(null);
  React.useEffect(() => {
    if (!win.current) return undefined;
    const player = Player(win.current, { scenes: [scene], side, advance: false, compactBelow: 0 });
    return () => player.destroy();
  }, [scene]);
  return (
    <div ref={win} className="tdr-demo deck-demo" role="img" aria-label={label}>
      <div className="win-view" />
    </div>
  );
}

function Produto() {
  return (
    <>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)" }}>
        <div style={{ display: "grid", gap: 28 }}>
          <Heading maxWidth="16ch">Uma plataforma que transforma dado desestruturado em resposta revisada e aprovada.</Heading>
          <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "36ch" }}>
            A empresa sobe os seus documentos e a Tendra.ai responde a partir deles — no lugar de um processo que hoje exige, em média, 8 pessoas e mais de 40 horas por proposta.
          </div>
          <div className="chips">
            <Chip tone="approved">Conhecimento centralizado</Chip>
            <Chip tone="neutral">Sem pessoa-chave</Chip>
          </div>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <DemoWindow scene={CENAS[0]} label="Demonstração: documentos sobem para a base de conhecimento e entram na lista, com versão e situação. Dados fictícios." />
          <div className="demo-caption">
            <span className="demo-caption-mark" aria-hidden="true"><Icon name="database" size={22} /></span>
            Base do cliente, em blocos citáveis
          </div>
        </div>
      </div>
    </>
  );
}

// Passos 01 a 04 do site ("O produto em ação"), com o texto lateral de cada um. O 00 está no slide 05.
const PASSOS = [
  { n: "01", tela: "Tarefas", t: "Importe o questionário", d: "Suba a planilha do cliente. A Tendra.ai separa as perguntas item por item e classifica cada uma por área.", itens: ["Planilha .xlsx ou .csv, na estrutura do cliente", "Perguntas separadas item por item", "Classificação por área responsável"] },
  { n: "02", tela: "IA em ação", t: "Gere com rastreabilidade", d: "O modelo cruza cada pergunta com a base aprovada e escreve a resposta citando o documento e a página que a sustenta.", itens: ["Resposta redigida só com a base aprovada", "Documento e página em cada parágrafo", "Citação que não existe no documento é descartada"] },
  { n: "03", tela: "Revisão", t: "Revise e aprove", d: "Alertas apontam o que exige atenção. O revisor edita, aprova nominalmente e a trilha de auditoria registra tudo.", itens: ["Alertas de fonte antiga, sem fonte e baixa confiança", "Edição com a sugestão original sempre visível", "Aprovação nominal registrada na trilha"] },
  { n: "04", tela: "Exportação", t: "Exporte a planilha aprovada", d: "O arquivo sai na ordem original do edital, com a resposta aprovada, as edições do revisor e as fontes usadas.", itens: ["Planilha na ordem original do edital", "Resposta aprovada, edições e fontes no arquivo", "Respostas aprovadas voltam para a base"] }
];

// Carrossel: as setas trazem o passo seguinte da direita para a esquerda (ou o anterior, no
// sentido contrário). Cada painel toca a sua cena só enquanto está à vista.
function ComoFunciona({ active }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => { if (!active) setI(0); }, [active]);
  const ir = (d) => setI((k) => Math.min(PASSOS.length - 1, Math.max(0, k + d)));
  return (
    <>
      <Heading maxWidth="34ch" style={{ marginBottom: 48 }}>Quatro passos, nenhuma resposta sem fonte.</Heading>
      <div className="carousel" role="group" aria-roledescription="carrossel" aria-label="Passos 01 a 04">
        <button type="button" className="carousel-arrow carousel-arrow--prev" aria-label="Passo anterior" disabled={i === 0} onClick={() => ir(-1)}><Icon name="chevron-left" size={36} /></button>
        <div className="carousel-view">
          <div className="carousel-track" style={{ transform: `translateX(${-100 * i}%)` }}>
            {PASSOS.map((p, k) => (
              <div key={p.n} className="carousel-panel" role="group" aria-roledescription="passo" aria-label={`${p.n} de 04: ${p.t}`} aria-hidden={k !== i} inert={k !== i ? "" : undefined}>
                <div className="step-text">
                  <MonoLabel as="div" style={{ fontSize: 24, lineHeight: "normal" }}>{p.n} · {p.tela}</MonoLabel>
                  <h2 className="title" style={{ fontSize: 54, lineHeight: 1.1 }}>{p.t}</h2>
                  <p style={{ margin: 0, fontSize: 28, lineHeight: 1.5, color: "var(--text-body)" }}>{p.d}</p>
                  <ul className="step-list">
                    {p.itens.map((x) => (
                      <li key={x}><span className="step-check" aria-hidden="true"><Icon name="check" size={18} /></span>{x}</li>
                    ))}
                  </ul>
                </div>
                <DemoWindow scene={CENAS[k + 1]} label={`Demonstração do passo ${p.n}, ${p.t}. Dados fictícios.`} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="carousel-arrow carousel-arrow--next" aria-label="Próximo passo" disabled={i === PASSOS.length - 1} onClick={() => ir(1)}><Icon name="chevron-right" size={36} /></button>
        <div className="carousel-dots" aria-hidden="true">
          {PASSOS.map((p, k) => <span key={p.n} className={k === i ? "is-on" : undefined} />)}
        </div>
        <div className="sr-only" aria-live="polite">Passo {PASSOS[i].n} de 04: {PASSOS[i].t}</div>
      </div>
    </>
  );
}

// Mesmo conteúdo da seção "Plataforma AI native" do site, com a divisão entre IA e código explícita.
const IA_PASSOS = [
  { t: "Classifica por área", d: "A IA atribui uma área a cada pergunta do edital e a cada documento da base: Produto, Tecnologia, Segurança etc. Assim cada item chega ao aprovador certo.", tag: "IA + regras" },
  { t: "Entende o edital", d: "Lê a planilha e separa as perguntas item por item. Se a estrutura fugir do padrão, a IA localiza as perguntas e a sua equipe confirma a lista.", tag: "IA + regras" },
  { t: "Redige com a sua base", d: "O modelo cruza cada pergunta com a base aprovada e escreve a resposta citando o documento e o trecho. Citação que não existe no documento é descartada.", tag: "IA + regras" },
  { t: "Sinaliza contradição", d: "A IA aponta quando as fontes citadas numa resposta se contradizem. Os demais alertas (sem fonte, baixa confiança, base vencida) são regras do código.", tag: "IA + regras" }
];

function PlataformaIA() {
  return (
    <>
      <Heading maxWidth="30ch" style={{ fontSize: 56, lineHeight: 1.1, marginBottom: 40 }}>A IA não é um recurso extra. É como a Tendra.ai foi construída.</Heading>
      <div className="cols cols--4" style={{ flex: "none" }}>
        {IA_PASSOS.map((p, i) => (
          <DeckCard key={p.t} className={`stack ai-card rise-${i + 1}`} style={{ padding: 28, gap: 14 }}>
            <span className="ai-chip" aria-hidden="true"><Icon name="sparkles" size={24} /></span>
            <div className="card-title" style={{ fontSize: 28, lineHeight: 1.2 }}>{p.t}</div>
            <div style={{ fontSize: 21, lineHeight: 1.45, color: "var(--text-body)" }}>{p.d}</div>
            <div><span className="ai-tag">{p.tag}</span></div>
          </DeckCard>
        ))}
      </div>
      <div className="ai-foot">
        Cada etapa da resposta passa por um modelo de linguagem, sempre sob regras que garantem fonte, privacidade e revisão humana. Uma combinação inteligente de IA com guardrails em código determinístico. <b>A IA sugere; a sua equipe decide.</b>
      </div>
    </>
  );
}

// Stack do produto: marca (Simple Icons, em tinta) e a função de cada peça.
const STACK = [
  { icons: ["anthropic", "claude"], nome: "Anthropic · API Claude", d: "Os modelos Claude redigem cada resposta com citações e apontam contradições; um modelo menor identifica as perguntas e classifica as áreas. Pela API comercial, o dado do cliente não treina modelos." },
  { icons: ["github"], nome: "GitHub", d: "Código, revisão de cada mudança e integração contínua: testes do backend, jornada de ponta a ponta e varredura de segredos antes de publicar." },
  { icons: ["supabase"], nome: "Supabase", d: "Postgres gerenciado com os documentos e as respostas, separados por organização; armazenamento privado das planilhas e conferência de login." },
  { icons: ["render"], nome: "Render", d: "Hospeda o backend: a API, o processamento de cada RFP e as chamadas à IA, com publicação automática a cada mudança aprovada." },
  { icons: ["vercel"], nome: "Vercel", d: "Hospeda o site, o Workspace e este deck, com uma prévia de cada mudança antes de ir ao ar." }
];

function Marca({ slug }) {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" fill="var(--brand-ink)"><path d={STACK_ICONS[slug].path} /></svg>
  );
}

function Arquitetura() {
  return (
    <>
      <Heading maxWidth="34ch" style={{ marginBottom: 44 }}>Uma stack enxuta, com cada peça no seu papel.</Heading>
      <ul className="stack-list">
        {STACK.map((s, i) => (
          <li key={s.nome} className={`stack-row rise-${i + 1}`}>
            <div className="stack-logos">{s.icons.map((slug) => <span key={slug} className="stack-logo"><Marca slug={slug} /></span>)}</div>
            <div className="card-title" style={{ fontSize: 30, lineHeight: 1.2 }}>{s.nome}</div>
            <div style={{ fontSize: 23, lineHeight: 1.45, color: "var(--text-body)" }}>{s.d}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

function SecaoNegocio({ active }) {
  return <SectionIntro active={active} title="O negócio" logo="ink" />;
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
  "Upload de PDF, DOCX e PPTX e conexão com Google Drive e SharePoint",
  "Fluxos de aprovação em múltiplos níveis",
  "Integrações via MCP com documentações técnicas de API",
  "Base pré-carregada com normas técnicas e regulatórias do mercado brasileiro (LGPD etc.)",
  "Modo assistente para preparação de documentos de propostas comerciais e técnicas"
];

// A linha cresce e cada ponto aparece com o seu número e texto, uma vez a cada entrada no slide.
function Roadmap({ active }) {
  const [run, setRun] = React.useState(0);
  React.useEffect(() => { if (active) setRun((n) => n + 1); }, [active]);
  return (
    <>
      <Heading maxWidth="26ch" style={{ marginBottom: "var(--gap-title)" }}>Roadmap.</Heading>
      <div key={run} className="roadmap" style={{ "--steps": ROADMAP.length }}>
        <div className="roadmap-line" />
        <ol className="roadmap-steps">
          {ROADMAP.map((text, i) => (
            <li key={text} className="roadmap-step" style={{ "--i": i }}>
              <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true" style={{ zIndex: 1, flexShrink: 0 }}>
                <rect width="48" height="48" rx="8" fill="var(--brand-ink)" />
                <rect x="17" y="17" width="14" height="14" fill="var(--brand-lime)" />
              </svg>
              <Eyebrow size={19}>{String(i + 1).padStart(2, "0")}</Eyebrow>
              <DeckCard style={{ padding: "22px 18px", fontSize: 23, lineHeight: 1.35, textAlign: "center" }}>{text}</DeckCard>
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
  { label: "Seção: A solução", tone: "aurora-lime", Component: SecaoSolucao, notes: "Transição para a apresentação do produto: \"A solução\" é escrita e dá lugar ao logo animado." },
  { label: "Introduzindo Tendra.ai", tone: "paper", Component: Produto, notes: "Apresentar o produto como cérebro comercial e técnico da empresa. A janela mostra o passo 00: documentos entrando na base." },
  { label: "Como funciona", tone: "paper", Component: ComoFunciona, notes: "Carrossel com os passos 01 a 04 (importar, gerar com fonte, revisar e aprovar, exportar). Avance com as setas laterais do slide." },
  { label: "Plataforma AI native", tone: "paper", Component: PlataformaIA, notes: "A IA classifica perguntas e documentos por área, entende o edital, redige com fonte e sinaliza contradição; guardrails em código determinístico conferem tudo, e a pessoa aprova." },
  { label: "Arquitetura técnica", tone: "paper", Component: Arquitetura, notes: "A stack: Claude pela API da Anthropic, GitHub, Supabase, Render e Vercel, e o papel de cada um no produto." },
  { label: "Seção: O negócio", tone: "aurora-ink", Component: SecaoNegocio, notes: "Transição para cliente, modelo de receita e escopo do MVP: \"O negócio\" é escrito e dá lugar ao logo animado." },
  { label: "Cliente ideal", tone: "paper", Component: ClienteIdeal, notes: "Descrever o ICP: vertical, porte e personas." },
  { label: "Diferencial competitivo", tone: "paper", Component: Diferencial, notes: "Contraste entre o método tradicional e o Tendra.ai." },
  { label: "Modelo de receita", tone: "paper", Component: Receita, notes: "Mesmo modelo da página de Preços do site: cobrança por revisor; o plano Basic tem até 5 revisores e 20 RFPs por semestre, e o Enterprise tem volume ilimitado." },
  { label: "Escopo do MVP", tone: "paper", Component: Escopo, notes: "O que está dentro e fora do MVP: base em .md, RFP em .xlsx e aprovação por área dentro; outros formatos e integrações fora." },
  { label: "Métricas", tone: "ink", Component: Metricas, notes: "Como medimos ROI para o cliente e sucesso do produto." },
  { label: "Roadmap", tone: "paper", Component: Roadmap, notes: "O que vem depois do MVP. Os pontos aparecem um a um ao entrar no slide." },
  { label: "Time", tone: "aurora-lime", Component: Time, notes: "Apresentar o time fundador." },
  { label: "Fechamento", tone: "lime", Component: Fechamento, notes: "Encerrar reforçando a promessa central e abrir para perguntas da banca." }
];
