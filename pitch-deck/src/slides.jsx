import React from "react";
import { AnimatedLogo, Badge, Card, Icon, MonoLabel } from "./ds/index.js";
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

// Abertura de seção (slides 05 e 10): o título é escrito letra a letra e dá lugar ao logo animado,
// sobre o campo Aurora do slide. Recomeça a cada entrada no slide; com movimento reduzido, mostra o logo.
// Digitação dos títulos (capa e aberturas de seção): começa após 500 ms, uma letra a cada 110 ms.
const DIGITA_INICIO_MS = 500;
const DIGITA_LETRA_MS = 110;

// Com `after`, o logo completo encolhe para o canto e o texto do slide entra (slides 05 e 17).
// Sem `title`, começa direto pelo logo no centro (slide 17). `after` pode ser uma função que recebe
// se a fase final já chegou, para o texto animar só a partir dela.
const INTRO_LOGO_MS = 4200; // o logo termina de se desenhar aos 4,2 s (a palavra entra por último); o texto vem em seguida, sem pausa

function SectionIntro({ active, title = "", logo, after, className }) {
  const comTexto = Boolean(after);
  const final = comTexto ? "after" : "logo";
  const [typed, setTyped] = React.useState(REDUCED ? title.length : 0);
  const [phase, setPhase] = React.useState(REDUCED ? final : title ? "typing" : "logo");
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    if (!active || REDUCED) return undefined;
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    let t = 0;
    if (title) {
      setTyped(0);
      setPhase("typing");
      t = DIGITA_INICIO_MS;
      for (let k = 1; k <= title.length; k++) later((t += DIGITA_LETRA_MS), () => setTyped(k));
      later((t += 1100), () => setPhase("out"));
      later((t += 650), () => { setPhase("logo"); ref.current?.replay?.(); });
    } else {
      setPhase("logo");
      ref.current?.replay?.();
    }
    if (comTexto) later((t += INTRO_LOGO_MS), () => setPhase("after"));
    return () => timers.forEach(clearTimeout);
  }, [active, title, comTexto]);
  const depois = typeof after === "function" ? after(phase === "after") : after;
  return (
    <div className={["intro", after ? "intro--after" : "", className].filter(Boolean).join(" ")} data-phase={phase}>
      {title ? (
        <>
          <h1 className="title intro-title" aria-label={title}>
            <span aria-hidden="true">{title.slice(0, typed)}</span>
            <span className="intro-caret" aria-hidden="true" />
          </h1>
          <div className="title intro-print" aria-hidden="true">{title}</div>
        </>
      ) : null}
      <div className="intro-logo">
        {/* O desenho do logo tem folga à direita: o deslocamento centra o conjunto visível. */}
        <AnimatedLogo ref={ref} variant={logo} bare once paused={!active || phase !== "logo"} style={{ width: 760, marginLeft: 76 }} title="Tendra.ai" />
      </div>
      {after ? <div className="intro-after" aria-hidden={phase !== "after"}>{depois}</div> : null}
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

/* ---- Slides ---- */

// Logo animado na proporção do estático (símbolo de 64 px: viewBox de 224×48, com 4 de folga à esquerda).
const CAPA_LOGO_ALTURA = 64;
const CAPA_LOGO_FINAL = 5; // segundos: quadro com o logo completo (o mesmo do `once` e do movimento reduzido)
const CAPA_LOGO_PAUSA_MS = 5000; // com o logo completo, espera 5 s e toca a animação de novo

// Título da capa em trechos: o do meio leva o realce limão.
// "\n" quebra a linha (o título tem white-space: pre-line): três linhas fixas desde a primeira letra.
const CAPA_TITULO = [{ t: "Responda a uma\nproposta em " }, { t: "horas", mark: true }, { t: ",\nnão semanas." }];
const CAPA_TITULO_TEXTO = CAPA_TITULO.map((p) => p.t).join("");
const CAPA_CURSOR_MS = 1400; // o cursor pisca mais um pouco depois da última letra

/**
 * Título digitado letra a letra. O texto inteiro já ocupa o lugar (o que falta fica invisível),
 * então as linhas não se mexem durante a digitação. O realce de "horas" cresce junto com as letras.
 */
function TituloDigitado({ partes = CAPA_TITULO, typed, cursor }) {
  // O cursor fica no primeiro trecho ainda incompleto (ou no fim, quando tudo foi digitado).
  let inicio = 0;
  const trechos = partes.map((p) => {
    const n = Math.max(0, Math.min(p.t.length, typed - inicio));
    inicio += p.t.length;
    return { ...p, feito: p.t.slice(0, n), falta: p.t.slice(n) };
  });
  const incompleto = trechos.findIndex((p) => p.falta);
  const comCursor = incompleto === -1 ? trechos.length - 1 : incompleto;
  return trechos.map((p, i) => {
    const caret = cursor && i === comCursor ? <span className="type-caret" /> : null;
    if (!p.mark) {
      return <React.Fragment key={i}>{p.feito}{caret}{p.falta ? <span className="type-rest">{p.falta}</span> : null}</React.Fragment>;
    }
    // Realce partido em dois enquanto digita: o padding de cada lado fica com a sua metade.
    return (
      <React.Fragment key={i}>
        {p.feito ? <span className="mark" style={p.falta ? { paddingRight: 0 } : undefined}>{p.feito}</span> : null}
        {caret}
        {p.falta ? <span className="mark type-rest" style={p.feito ? { paddingLeft: 0 } : undefined}>{p.falta}</span> : null}
      </React.Fragment>
    );
  });
}

// Logo da capa. Em laço enquanto o slide está na tela:
// desenha o logo, segura o quadro completo por 5 s e recomeça. Fora dele (e no PDF ou sem movimento),
// fica no quadro completo. variant: "ink" no campo tinta, "lime" no campo limão.
function LogoEmLaco({ active, variant }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!active || REDUCED) { el.pause?.(); el.currentTime = CAPA_LOGO_FINAL; return undefined; }
    el.replay?.();
    const laco = setInterval(() => el.replay?.(), CAPA_LOGO_FINAL * 1000 + CAPA_LOGO_PAUSA_MS);
    return () => clearInterval(laco);
  }, [active]);
  const k = CAPA_LOGO_ALTURA / 48;
  return <AnimatedLogo ref={ref} variant={variant} bare once style={{ width: 224 * k, marginLeft: -4 * k }} title="Tendra.ai" />;
}

function Capa({ active }) {
  // Título: digitado a cada entrada no slide; fora dele (e no PDF), inteiro.
  const total = CAPA_TITULO_TEXTO.length;
  const [typed, setTyped] = React.useState(total);
  const [cursor, setCursor] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!active || REDUCED) { setTyped(total); setCursor(false); return undefined; }
    setTyped(0);
    setCursor(true);
    const timers = [];
    let t = DIGITA_INICIO_MS;
    for (let k = 1; k <= total; k++) timers.push(setTimeout(() => setTyped(k), (t += DIGITA_LETRA_MS)));
    timers.push(setTimeout(() => setCursor(false), t + CAPA_CURSOR_MS));
    return () => timers.forEach(clearTimeout);
  }, [active, total]);
  return (
    <>
      <LogoEmLaco active={active} variant="ink" />
      <h1 className="title" aria-label={CAPA_TITULO_TEXTO.replace(/\n/g, " ")} style={{ fontSize: "var(--type-display)", lineHeight: 1.02, letterSpacing: "-0.04em", margin: "auto 0 48px", whiteSpace: "pre-line" }}>
        <span aria-hidden="true"><TituloDigitado typed={typed} cursor={cursor} /></span>
      </h1>
      <div className="footer-rule" style={{ borderTop: "1px solid var(--ink-500)" }}>
        <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, color: "var(--ink-200)", maxWidth: "42ch" }}>O cérebro comercial e técnico da sua operação.</div>
        <Eyebrow tone="inverse" style={{ textAlign: "right", lineHeight: 1.7 }}>Novembro 2026<br />Confidencial</Eyebrow>
      </div>
    </>
  );
}

// Fontes espalhadas (slide 03), uma após a outra, ligadas por um conector limão em gradiente.
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

// Centro do grupo: as fontes se afastam dele e voltam (flutuação leve).
const FONTES_CENTRO = { x: FONTES.reduce((t, f) => t + f.x, 0) / FONTES.length, y: FONTES.reduce((t, f) => t + f.y, 0) / FONTES.length };
const FONTES_CICLO_MS = 10000; // a sequência recomeça a cada 10 s
const FONTES_SAIDA_MS = 500; // esmaecimento antes de recomeçar

// Posição de cada fonte no instante t (s): vai e volta na direção do centro, com um leve desvio lateral.
function posicoesDasFontes(t) {
  return FONTES.map((f, i) => {
    const dx = f.x - FONTES_CENTRO.x, dy = f.y - FONTES_CENTRO.y, d = Math.hypot(dx, dy) || 1;
    const radial = 14 * Math.sin((2 * Math.PI * t) / (4.6 + i * 0.35) + i * 1.7);
    const lateral = 6 * Math.sin((2 * Math.PI * t) / (5.8 + i * 0.27) + i);
    return { x: f.x + (dx / d) * radial - (dy / d) * lateral, y: f.y + (dy / d) * radial + (dx / d) * lateral };
  });
}

/** Uma passada da sequência: as fontes surgem uma a uma e flutuam; os conectores acompanham. */
function FontesCena({ active, saindo }) {
  const nodes = React.useRef([]);
  const links = React.useRef([]);
  React.useEffect(() => {
    if (!active || REDUCED) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now) => {
      const pos = posicoesDasFontes((now - t0) / 1000);
      pos.forEach((p, i) => {
        const el = nodes.current[i];
        if (el) el.style.translate = `${p.x - FONTES[i].x}px ${p.y - FONTES[i].y}px`;
      });
      links.current.forEach((el, i) => {
        if (!el) return;
        const a = pos[i], b = pos[i + 1];
        el.style.left = `${a.x}px`;
        el.style.top = `${a.y}px`;
        el.style.width = `${Math.hypot(b.x - a.x, b.y - a.y)}px`;
        el.style.transform = `rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI}deg)`;
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return (
    <div className={"fontes" + (saindo ? " is-out" : "")} role="img" aria-label="Fontes espalhadas: e-mail, PDF antigo, proposta anterior, chat, planilha e pessoas">
      {FONTE_LIGACOES.map((l, i) => (
        <i key={i} ref={(el) => { links.current[i] = el; }} className="fonte-link" style={{ left: l.x, top: l.y, width: l.len, transform: `rotate(${l.ang}deg)`, "--i": i }} />
      ))}
      {FONTES.map((f, i) => (
        <div key={f.text} ref={(el) => { nodes.current[i] = el; }} className="fonte" style={{ left: f.x, top: f.y, "--i": i }} aria-hidden="true">
          <span className="fonte-icone"><FonteIcone fonte={f} /></span>
          <span className="fonte-tag">{f.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Toca a sequência ao entrar no slide e a recomeça a cada 10 s enquanto ele está na tela. */
function Fontes({ active }) {
  const [run, setRun] = React.useState(0);
  const [saindo, setSaindo] = React.useState(false);
  React.useEffect(() => {
    if (!active) return undefined;
    setRun((n) => n + 1);
    setSaindo(false);
    if (REDUCED) return undefined;
    let restart = 0;
    const ciclo = setInterval(() => {
      setSaindo(true);
      restart = setTimeout(() => { setRun((n) => n + 1); setSaindo(false); }, FONTES_SAIDA_MS);
    }, FONTES_CICLO_MS);
    return () => { clearInterval(ciclo); clearTimeout(restart); };
  }, [active]);
  return <FontesCena key={run} active={active} saindo={saindo} />;
}

// Nota de fonte no pé do slide, em mono, como nos slides de referência.
function Nota({ children, tone = "paper", style }) {
  return (
    <MonoLabel as="div" size="mono" uppercase={false} tone={tone === "ink" ? "inverse" : "default"} className="nota" style={{ fontSize: 20, lineHeight: 1.4, ...(tone === "lime" ? { color: "var(--brand-ink)" } : null), ...style }}>{children}</MonoLabel>
  );
}

// Número que conta de 0 até o valor a cada entrada no slide; fora dele (e no PDF), fica no valor.
function Contagem({ active, valor, ms = 1400, formato = (n) => String(n) }) {
  const [n, setN] = React.useState(valor);
  React.useEffect(() => {
    if (!active || REDUCED) { setN(valor); return undefined; }
    let raf = 0;
    const t0 = performance.now() + 250;
    const passo = (agora) => {
      const t = Math.max(0, Math.min(1, (agora - t0) / ms));
      setN(Math.round((1 - Math.pow(1 - t, 3)) * valor));
      if (t < 1) raf = requestAnimationFrame(passo);
    };
    setN(0);
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [active, valor, ms]);
  return <>{formato(n)}</>;
}

// Slide 02: a persona fictícia que conduz a narrativa. A pergunta dela aparece numa tela de chat
// clara: é digitada no campo, o botão de enviar é pressionado e o balão sobe para a conversa.
// Recomeça a cada entrada no slide; fora dele (e no PDF ou sem movimento), mostra a mensagem enviada.
const PERGUNTA = "Quem consegue confirmar qual política de segurança vale hoje?";
// As mensagens da Marina, em ordem. A segunda sai 1 h 30 min depois: a primeira ficou sem resposta.
const MENSAGENS_MARINA = [
  { texto: PERGUNTA, hora: "09:41" },
  { texto: "Pessoal, alguém?", hora: "11:11" }
];
const CHAT_INICIO_MS = 900; // o cartão entra antes de a digitação começar
const CHAT_LETRA_MS = 40;
const CHAT_ANTES_DE_ENVIAR_MS = 450;
const CHAT_CLIQUE_MS = 260;
const CHAT_ENTRE_ENVIOS_MS = 10000; // a segunda mensagem sai 10 s depois da primeira (a digitação conta dentro desse tempo)

// Estado do chat: quantas mensagens já foram enviadas e o que está no campo da mensagem seguinte.
function usarChat(active) {
  const fim = { enviadas: MENSAGENS_MARINA.length, typed: 0, etapa: "parada" };
  const [estado, setEstado] = React.useState(fim);
  React.useEffect(() => {
    if (!active || REDUCED) { setEstado(fim); return undefined; }
    setEstado({ enviadas: 0, typed: 0, etapa: "parada" });
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    let t = CHAT_INICIO_MS;
    MENSAGENS_MARINA.forEach((m, i) => {
      // Pausa antes de digitar: o envio cai exatamente CHAT_ENTRE_ENVIOS_MS depois do anterior.
      if (i > 0) t += CHAT_ENTRE_ENVIOS_MS - (m.texto.length * CHAT_LETRA_MS + CHAT_ANTES_DE_ENVIAR_MS + CHAT_CLIQUE_MS);
      for (let k = 1; k <= m.texto.length; k++) later((t += CHAT_LETRA_MS), () => setEstado({ enviadas: i, typed: k, etapa: "digitando" }));
      later((t += CHAT_ANTES_DE_ENVIAR_MS), () => setEstado({ enviadas: i, typed: m.texto.length, etapa: "clicando" }));
      later((t += CHAT_CLIQUE_MS), () => setEstado({ enviadas: i + 1, typed: 0, etapa: "parada" }));
    });
    return () => timers.forEach(clearTimeout);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return estado;
}

function Persona({ active }) {
  const { enviadas, typed, etapa } = usarChat(active);
  const proxima = MENSAGENS_MARINA[enviadas];
  const noCampo = proxima && etapa !== "parada" ? proxima.texto.slice(0, typed) : "";
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>A história · persona fictícia</Eyebrow>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1fr) 760px", gap: 96 }}>
        <div style={{ display: "grid", gap: 36 }}>
          <h1 className="title" style={{ fontSize: "var(--type-title)", lineHeight: 1.06, maxWidth: "14ch" }}>Marina tem até sexta para enviar a proposta</h1>
          <p style={{ margin: 0, fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)", maxWidth: "36ch" }}>
            Ela lidera pré-vendas numa empresa brasileira de software. O cliente enviou uma planilha com perguntas sobre produto, segurança e privacidade.
          </p>
        </div>
        <figure className={"chat" + (active ? " is-on" : "")} aria-label={`Chat da equipe. Marina pergunta às 09:41: “${PERGUNTA}” Sem resposta, às 11:11 ela escreve: “Pessoal, alguém?”`}>
          <div className="chat-topo" aria-hidden="true">
            <span className="chat-canal">proposta-cliente</span>
            <MonoLabel size="mono" uppercase={false} style={{ fontSize: 19 }}>5 pessoas</MonoLabel>
          </div>
          <div className="chat-conversa" aria-hidden="true">
            <div className="chat-msg">
              <span className="chat-avatar">C</span>
              <div className="chat-corpo">
                <div className="chat-autor">Comercial <span>09:12</span></div>
                <div className="chat-balao">O cliente mandou a planilha. Precisamos enviar até sexta.</div>
              </div>
            </div>
            {MENSAGENS_MARINA.slice(0, enviadas).map((m, i) => (
              <div key={m.hora} className="chat-msg chat-msg--minha chat-sobe">
                <div className="chat-corpo">
                  <div className="chat-autor">Marina <span>{m.hora}</span></div>
                  <div className="chat-balao">{m.texto}</div>
                  {/* "Sem resposta" acompanha só a última mensagem enviada. */}
                  <div className="chat-status"><Icon name="check" size={18} />{i === enviadas - 1 ? "Enviada · sem resposta" : "Enviada"}</div>
                </div>
                <span className="chat-avatar chat-avatar--marina">M</span>
              </div>
            ))}
          </div>
          <div className="chat-entrada" aria-hidden="true">
            <div className={"chat-campo" + (noCampo ? "" : " is-vazio")}>
              {noCampo || "Escreva uma mensagem"}
              {etapa === "digitando" ? <span className="type-caret" /> : null}
            </div>
            <span className={"chat-enviar" + (noCampo ? " is-pronto" : "") + (etapa === "clicando" ? " is-clique" : "")}><Icon name="send" size={26} /></span>
          </div>
        </figure>
      </div>
    </>
  );
}

// Slide 03: o processo de hoje, com as fontes espalhadas (animação do antigo slide 02) ao lado.
const CACA = [
  { n: "01", t: "Buscar", d: "Ela abre propostas antigas, e-mails e pastas em busca de respostas." },
  { n: "02", t: "Confirmar", d: "Ela aciona engenharia, segurança e jurídico para checar o que ainda vale." },
  { n: "03", t: "Consolidar", d: "Ela copia as respostas, revisa as versões e cobra aprovações." }
];

function Caca({ active }) {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>O processo hoje</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: 14 }}>A caça à resposta certa</Heading>
      <div style={{ fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-body)" }}>Marina coordena o trabalho em uma planilha e por mensagens.</div>
      <div className="split" style={{ gridTemplateColumns: "minmax(0,1fr) 548px", gap: 120, margin: "8px 0 40px" }}>
        <ol className="caca-steps">
          {CACA.map((p, i) => (
            <li key={p.n} className={`caca-step rise-${i + 1}`}>
              <Eyebrow as="span" size={24}>{p.n}</Eyebrow>
              <div style={{ display: "grid", gap: 6 }}>
                <div className="card-title" style={{ fontSize: 36, lineHeight: 1.15 }}>{p.t}</div>
                <div style={{ fontSize: 26, lineHeight: 1.45, color: "var(--text-body)" }}>{p.d}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="fontes-escala"><Fontes active={active} /></div>
      </div>
      <div className="caca-alerta">
        <span className="caca-alerta-icone" aria-hidden="true"><Icon name="triangle-alert" size={28} /></span>
        Uma resposta desatualizada pode virar um compromisso com o cliente ou a perda de um contrato.
      </div>
    </>
  );
}

// Slide 04: o custo, em dois números do benchmark global; contam a cada entrada no slide.
function CustoProblema({ active }) {
  return (
    <>
      <Eyebrow tone="accent">O custo do problema</Eyebrow>
      <div style={{ margin: "auto 0", display: "grid", gap: 56 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div className="title custo-numero"><Contagem active={active} valor={33} /> h</div>
          <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.4, color: "var(--ink-200)" }}>de trabalho por proposta, em média</div>
        </div>
        <div className="custo-linha">
          <div className="title" style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.035em", whiteSpace: "nowrap" }}><Contagem active={active} valor={8} ms={1000} /> pessoas</div>
          <div style={{ fontSize: 30, lineHeight: 1.45, color: "var(--ink-200)", maxWidth: "34ch" }}>quantidade média de pessoas necessárias para responder a uma proposta</div>
        </div>
      </div>
      <Nota tone="ink">Loopio e APMP 2026 · benchmark global</Nota>
    </>
  );
}

function SecaoSolucao({ active }) {
  return (
    <SectionIntro active={active} title="A solução" logo="lime" after={
      <>
        <Eyebrow style={{ color: "var(--brand-ink)" }}>A mudança na rotina</Eyebrow>
        <h2 className="title" style={{ fontSize: "var(--type-title)", lineHeight: 1.12, maxWidth: "16ch" }}>Marina agora começa pela <span className="mark mark--bloco" style={{ padding: "0 12px" }}>revisão</span></h2>
        <p style={{ margin: 0, fontSize: "var(--type-lead)", lineHeight: 1.5, maxWidth: "46ch" }}>
          As respostas recorrentes já vêm com a fonte ao lado. Ela chama especialistas para o que exige decisão e volta a ter tempo para conversar com o cliente.
        </p>
      </>
    } />
  );
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
            A empresa sobe os seus documentos e a Tendra.ai responde a partir deles.
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

// Passos 01 a 04 do site ("O produto em ação"), com o texto lateral de cada um. O 00 está no slide 06.
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

// Slide 11: o benchmark global de volume e capacidade.
const VOLUME = [
  { valor: 166, sufixo: "", d: "propostas enviadas por ano, em média" },
  { valor: 55, sufixo: "%", d: "das solicitações recebidas são respondidas" },
  { valor: 39, sufixo: "%", d: "de taxa média de vitória" }
];

function Volume({ active }) {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Benchmark global · 1.533 profissionais</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: "var(--gap-title)" }}>O volume subiu. A capacidade virou gargalo.</Heading>
      <div className="cols cols--3" style={{ flex: "none" }}>
        {VOLUME.map((v, i) => (
          <DeckCard key={v.d} className={`stack rise-${i + 1}`} style={{ padding: 44, gap: 16 }}>
            <div className="title" style={{ fontSize: 120, lineHeight: 1, letterSpacing: "-0.04em" }}><Contagem active={active} valor={v.valor} />{v.sufixo}</div>
            <div style={{ fontSize: 28, lineHeight: 1.4, color: "var(--text-body)", maxWidth: "18ch" }}>{v.d}</div>
          </DeckCard>
        ))}
      </div>
      <div className="destaque rise-4">
        <span className="destaque-numero">50%</span>
        apontam capacidade de equipe como um dos principais desafios.
      </div>
      <Nota style={{ marginTop: "auto" }}>Loopio e APMP 2026 · pesquisa global</Nota>
    </>
  );
}

// Slide 12: o mercado inicial no Brasil (estimativa interna).
function Oportunidade() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Oportunidade no Brasil</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: "var(--gap-title)" }}>Começamos por tecnologia B2B</Heading>
      <div className="mercado">
        <div className="mercado-linha rise-1">
          <div className="title mercado-numero">1.500–3.000</div>
          <div className="mercado-texto">empresas no mercado inicial estimado</div>
        </div>
        <div className="mercado-linha rise-2">
          <div className="title mercado-numero mercado-numero--sm">R$ 70–240 mi/ano</div>
          <div className="mercado-texto">potencial de receita desse mercado no cenário-base da equipe</div>
        </div>
      </div>
      <Nota style={{ marginTop: "auto" }}>Estimativa interna · Pesquisa de Mercado e Próximos Passos</Nota>
    </>
  );
}

// Slide 13: as metas do piloto; os números contam a cada entrada no slide.
const METAS = [
  { valor: 30, formato: (n) => `−${n}%`, t: "tempo de ciclo", d: "Da importação à exportação, em propostas de complexidade similar." },
  { valor: 70, formato: (n) => `${n}%`, t: "aceitação do texto sugerido", d: "Quanto da sugestão permanece no texto aprovado." }
];

function Piloto({ active }) {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Piloto · metas a validar</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: "var(--gap-title)" }}>Como vamos provar que funciona</Heading>
      <div className="cols cols--2" style={{ flex: "none" }}>
        {METAS.map((m, i) => (
          <DeckCard key={m.t} className={`stack rise-${i + 1}`} style={{ padding: 44, gap: 14 }}>
            <div className="title meta-numero"><Contagem active={active} valor={m.valor} formato={m.formato} /></div>
            <div className="card-title" style={{ fontSize: 36, lineHeight: 1.2 }}>{m.t}</div>
            <div className="body-small" style={{ maxWidth: "34ch" }}>{m.d}</div>
          </DeckCard>
        ))}
      </div>
      <div className="destaque rise-3">Também medimos horas de trabalho, cobertura de fontes e alertas tratados.</div>
      <Nota>Meta de aceitação no One Pager · redução de ciclo proposta</Nota>
    </>
  );
}

// Slide 14: simulação do retorno para o cliente; os números contam a cada entrada no slide.
const reais = (n) => "R$ " + n.toLocaleString("pt-BR");

function Retorno({ active }) {
  return (
    <>
      <Eyebrow tone="accent" style={{ marginBottom: 26 }}>Retorno para o cliente · simulação</Eyebrow>
      <Heading maxWidth="24ch" style={{ marginBottom: "var(--gap-title)" }}>Quanto vale o tempo recuperado?</Heading>
      <div className="retorno">
        <div className="retorno-item">
          <div className="title retorno-numero"><Contagem active={active} valor={99} /> h/mês</div>
          <div className="retorno-texto">de capacidade recuperada</div>
        </div>
        <div className="retorno-item">
          <div className="title retorno-numero"><Contagem active={active} valor={17820} formato={reais} /></div>
          <div className="retorno-texto">em capacidade por mês</div>
        </div>
      </div>
      <div className="retorno-conta">10 propostas/mês × 33 h × 30% de redução de esforço × R$ 180/h</div>
      <p style={{ margin: "28px 0 0", fontSize: 30, lineHeight: 1.45, color: "var(--ink-200)", maxWidth: "56ch" }}>
        Com mensalidade hipotética de R$ 5 mil, o valor da capacidade cobre a assinatura a partir de 28 horas recuperadas por mês.
      </p>
      <Nota tone="ink">Premissas do cenário · benchmark de esforço Loopio/APMP</Nota>
    </>
  );
}

// Slide 15: quem compra e como cobramos.
function ModeloNegocio() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Modelo de negócio</Eyebrow>
      <Heading maxWidth="28ch" style={{ marginBottom: "var(--gap-title)" }}>Assinatura para equipes que respondem propostas todo mês</Heading>
      <div className="cols cols--2" style={{ flex: "none" }}>
        <FeatureCard title="Quem compra" titleSize={40} padding={44} gap={18} className="rise-1">
          A liderança comercial ou de operações de empresas B2B com demandas recorrentes.
        </FeatureCard>
        <FeatureCard title="Como cobramos" titleSize={40} padding={44} gap={18} className="rise-2">
          Assinatura por assento com um pacote mensal de propostas processadas.
        </FeatureCard>
      </div>
      <div className="destaque rise-3">
        <span className="destaque-numero">R$ 45–80 mil</span>
        hipótese de contrato anual por empresa
      </div>
      <Nota>Modelo original do pitch e faixa estimada em pesquisa interna</Nota>
    </>
  );
}

// Slide 16: o estágio do projeto e quem está nele.
const EQUIPE = ["Rafael Braga", "Matheus Alcântara", "Mariana Fugimoto", "Renata Lima da Silva", "Everton Santos", "Roberta Vitalina"];

function TimeExecucao() {
  return (
    <>
      <Eyebrow style={{ marginBottom: 26 }}>Time e execução</Eyebrow>
      <Heading maxWidth="26ch" style={{ marginBottom: "var(--gap-title)" }}>Já temos um protótipo para testar com o mercado</Heading>
      <div className="cols cols--2" style={{ flex: "none" }}>
        <FeatureCard title="O que já existe" titleSize={40} padding={44} gap={18} className="rise-1">
          Protótipo navegável do fluxo de importação, revisão com fontes e aprovação.
        </FeatureCard>
        <FeatureCard title="O que falta provar" titleSize={40} padding={44} gap={18} className="rise-2">
          Quanto tempo o cliente recupera, quais respostas aceita e quanto pagaria.
        </FeatureCard>
      </div>
      <ul className="equipe rise-3" aria-label="Equipe">
        {EQUIPE.map((nome) => <li key={nome}>{nome}</li>)}
      </ul>
      <Nota>Equipe e estágio do projeto · One Pager AIPL</Nota>
    </>
  );
}

// Slide 17: como no 05, o logo se desenha no centro e, completo, vai para o canto (o mesmo lugar e
// tamanho do logo da capa); então a frase é digitada como o título da capa. Fora do slide (e no PDF
// ou sem movimento), tudo fica no estado final.
const FECHO_TITULO = [{ t: "Não deixe seu negócio parar por uma planilha" }];
const FECHO_TEXTO = FECHO_TITULO.map((p) => p.t).join("");
const FECHO_DIGITA_MS = 700; // espera o texto entrar (o slide 05 usa 450 ms de atraso + 700 ms de entrada)

function FechamentoTexto({ ligado }) {
  const total = FECHO_TEXTO.length;
  const [typed, setTyped] = React.useState(total);
  const [cursor, setCursor] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!ligado || REDUCED) { setTyped(total); setCursor(false); return undefined; }
    setTyped(0);
    setCursor(true);
    const timers = [];
    let t = FECHO_DIGITA_MS;
    for (let k = 1; k <= total; k++) timers.push(setTimeout(() => setTyped(k), (t += DIGITA_LETRA_MS)));
    timers.push(setTimeout(() => setCursor(false), t + CAPA_CURSOR_MS));
    return () => timers.forEach(clearTimeout);
  }, [ligado, total]);
  return (
    <>
      <h1 className="title" aria-label={FECHO_TEXTO} style={{ fontSize: 100, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "auto 0 48px", maxWidth: "17ch" }}>
        <span aria-hidden="true"><TituloDigitado partes={FECHO_TITULO} typed={typed} cursor={cursor} /></span>
      </h1>
      <div className="footer-rule" style={{ borderTop: "2px solid var(--brand-ink)" }}>
        <div style={{ fontSize: "var(--type-lead)", lineHeight: 1.5, fontWeight: 600 }}>contato@tendra.ai · tendra.ai</div>
        <Eyebrow style={{ color: "inherit" }}>Perguntas da banca</Eyebrow>
      </div>
    </>
  );
}

function Fechamento({ active }) {
  return <SectionIntro active={active} logo="lime" className="intro--fechamento" after={(ligado) => <FechamentoTexto ligado={ligado} />} />;
}

// tone: campo do slide (paper | ink | lime). notes: notas do apresentador (tecla N).
export const SLIDES = [
  { label: "Capa", tone: "ink", Component: Capa, notes: "Abertura: apresentar o Tendra.ai e a promessa central. O logo se desenha de novo a cada 5 s. Em seguida, acompanhamos uma pessoa que faz esse trabalho." },
  { label: "A história", tone: "paper", Component: Persona, notes: "Marina pergunta às 09:41 e, sem resposta, cobra o time às 11:11. Marina é uma personagem fictícia que representa o perfil descrito no One Pager e na mentoria. A fala e o prazo de sexta são cenas ilustrativas, sem atribuição a entrevistados. Quando for útil, explique RFP como solicitação formal de proposta e RFI como solicitação de informações." },
  { label: "A caça à resposta certa", tone: "paper", Component: Caca, notes: "Volte à pergunta sobre segurança: a resposta está na proposta antiga, mas ninguém sabe se a política mudou. Marina segura o envio enquanto espera a confirmação. Cada área perde tempo procurando a mesma informação, e o comercial fica sem previsão." },
  { label: "O custo do problema", tone: "ink", Component: CustoProblema, notes: "As 33 horas são de esforço médio de resposta, não prazo corrido. O tamanho médio de oito pessoas descreve a equipe de propostas: não implica que oito pessoas trabalhem em cada proposta nem que cada uma gaste 33 horas. O relatório aponta 33 h no mid-market e 39 h em enterprise." },
  { label: "Seção: A solução", tone: "aurora-lime", Component: SecaoSolucao, notes: "\"A solução\" é escrita e dá lugar ao logo animado; com o logo completo, entra a mudança na rotina. Retome a pergunta inicial: Marina abre a fonte e valida se a política é a que vale hoje. Se faltar evidência, ela sabe exatamente o que escalar. O ganho comercial é recuperar tempo para tratar objeções e avançar a venda. Essa é a experiência que o piloto vai validar." },
  { label: "Introduzindo Tendra.ai", tone: "paper", Component: Produto, notes: "Apresentar o produto como cérebro comercial e técnico da empresa. A janela mostra o passo 00: documentos entrando na base." },
  { label: "Como funciona", tone: "paper", Component: ComoFunciona, notes: "Carrossel com os passos 01 a 04 (importar, gerar com fonte, revisar e aprovar, exportar). Avance com as setas laterais do slide." },
  { label: "Plataforma AI native", tone: "paper", Component: PlataformaIA, notes: "A IA classifica perguntas e documentos por área, entende o edital, redige com fonte e sinaliza contradição; guardrails em código determinístico conferem tudo, e a pessoa aprova." },
  { label: "Arquitetura técnica", tone: "paper", Component: Arquitetura, notes: "A stack: Claude pela API da Anthropic, GitHub, Supabase, Render e Vercel, e o papel de cada um no produto." },
  { label: "Seção: O negócio", tone: "aurora-ink", Component: SecaoNegocio, notes: "Transição para mercado, piloto, retorno para o cliente e modelo de negócio: \"O negócio\" é escrito e dá lugar ao logo animado." },
  { label: "Volume e capacidade", tone: "paper", Component: Volume, notes: "O volume médio subiu de 153 para 166 e a parcela respondida caiu de 63% para 55%. O estudo não atribui todo o volume que fica sem resposta à capacidade. A taxa média de vitória de 39% é da edição de 2026; 45% é a média histórica de 2019 a 2026. Nenhum desses percentuais foi medido especificamente no Brasil." },
  { label: "Oportunidade no Brasil", tone: "paper", Component: Oportunidade, notes: "O recorte inicial são empresas brasileiras de software, nuvem, infraestrutura e integração que vendem para grandes clientes e respondem com frequência a propostas e questionários de segurança. Contagem e receita são estimativas internas de mercado atendível (SAM), sem censo nem validação primária. A faixa combina 1.500 a 3.000 empresas com R$ 45 a 80 mil de contrato anual hipotético." },
  { label: "Piloto: metas a validar", tone: "paper", Component: Piloto, notes: "A meta de 30% é proposta para o piloto e não foi observada em cliente. Compare a mediana do ciclo da importação à exportação com casos comparáveis do processo atual, separando tempo corrido de horas ativas. A meta de 70% vem do One Pager e mede a similaridade por palavras entre o texto sugerido e o aprovado. Medimos também cobertura de fontes, tratamento de alertas e retrabalho. A taxa de vitória é acompanhada depois, sem atribuir causalidade ao produto, porque preço e concorrência também mudam o desfecho." },
  { label: "Retorno para o cliente", tone: "ink", Component: Retorno, notes: "Cenário ilustrativo, sem resultado em cliente e sem representar redução de folha. 10 propostas por mês × 33 h = 330 h; uma redução hipotética de 30% no esforço ativo dá 99 h. A R$ 180/h, são R$ 17.820 em capacidade, que pode ir para negociação e novas propostas. A assinatura simulada de R$ 5.000 por mês equivale a R$ 60 mil por ano, dentro da faixa interna: benefício/custo de 3,56× e retorno líquido de 256,4%, antes de implantação, tributos e treinamento. O ponto de equilíbrio é 27,78 h, arredondado para 28 h. A redução de esforço usada aqui deve ser cronometrada separadamente da meta de ciclo." },
  { label: "Modelo de negócio", tone: "paper", Component: ModeloNegocio, notes: "A entrada é por empresas de tecnologia que já têm orçamento ligado ao processo, volume recorrente e exigência de evidência. A cobrança por assento e volume vem do pitch original. A faixa de R$ 45 a 80 mil por ano é hipótese, a validar com compradores e uso real. Nenhuma receita, cliente ou contrato é afirmado." },
  { label: "Time e execução", tone: "aurora-paper", Component: TimeExecucao, notes: "A equipe já pode mostrar a experiência. O próximo passo é provar o impacto operacional com compradores reais. O teste interno de qualidade em base sintética não substitui a validação com cliente." },
  { label: "Fechamento", tone: "aurora-lime", Component: Fechamento, notes: "Como na abertura da solução: o logo se desenha no centro, vai para o canto e a frase é digitada. Encerrar com a mensagem central, \"Não deixe seu negócio parar por uma planilha\", e abrir para perguntas da banca." }
];
