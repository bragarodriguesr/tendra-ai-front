import React from "react";
import { Aurora, Button, Card, Icon, MonoLabel, Tag } from "../ds/index.js";
import { LiveCard } from "./LiveCard.jsx";
import { ProductTour } from "./ProductTour.jsx";
import { Features } from "./Features.jsx";

const Section = ({ children, tone, style, id }) => (
  <section id={id} style={{ background: tone === "ink" ? "var(--surface-inverse)" : tone === "sunken" ? "var(--surface-sunken)" : "transparent", ...style }}>
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--gutter-section) var(--page-pad)" }}>{children}</div>
  </section>
);

// Marca true quando o elemento entra na tela (uma vez); sem IntersectionObserver, já nasce visível.
function useRevealOnScroll() {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(typeof IntersectionObserver === "undefined");
  React.useEffect(() => {
    const el = ref.current;
    if (shown || !el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return [ref, shown];
}

export function HomePage({ onPage }) {
  const [aiRef, aiShown] = useRevealOnScroll();
  return (
    <>
      <Section>
        <div className="tdr-site-hero">
          <div style={{ display: "grid", gap: "var(--space-6)" }}>
            <MonoLabel tone="sage">RFP &amp; LICITAÇÕES</MonoLabel>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-d1-size)", lineHeight: "var(--text-d1-lh)", letterSpacing: "var(--text-d1-ls)", color: "var(--text-strong)", maxWidth: "20ch", textWrap: "pretty" }}>
              Responda a um RFP em <span style={{ background: "var(--brand-lime)", padding: "0 8px" }}>horas</span>, não semanas.
            </h1>
            <p style={{ margin: 0, fontSize: "var(--text-lead-size)", lineHeight: "var(--text-lead-lh)", color: "var(--text-body)", maxWidth: "var(--measure-lead)", textWrap: "pretty" }}>
              A Tendra.ai lê o edital, cruza com a sua base aprovada e devolve respostas completas — com a fonte de cada afirmação rastreável até o documento de origem.
            </p>
            <div className="tdr-site-cta" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Button size="lg" icon="calendar" onClick={() => onPage("contato")}>Agendar demo</Button>
            </div>
          </div>

          <LiveCard />
        </div>
      </Section>

      <Section tone="sunken" id="como-funciona">
        <div style={{ display: "grid", gap: "var(--space-10)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <MonoLabel>O produto em ação</MonoLabel>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--text-strong)", maxWidth: "24ch", textWrap: "pretty" }}>
              Da sua base à planilha aprovada, em cinco passos
            </h2>
          </div>
          <ProductTour />
        </div>
        <div className="tdr-site-teams">
          <span style={{ fontSize: "var(--text-ui-size)", color: "var(--text-strong)" }}>Feito para os times que respondem propostas</span>
          <ul aria-label="Times">
            {["Pré-vendas", "RevOps", "Segurança da informação", "Jurídico e compliance"].map((t) => (
              <li key={t}><MonoLabel tone="strong">{t}</MonoLabel></li>
            ))}
          </ul>
        </div>
      </Section>

      <Aurora variant="lime" move radius={0} as="section" id="ia-nativa" className="tdr-site-ai">
        <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--gutter-section) var(--page-pad)", display: "grid", gap: "var(--space-10)" }}>
          <div className="tdr-site-ai-head">
            <div style={{ display: "grid", gap: "var(--space-5)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--brand-ink)" }}>
                <span style={{ display: "inline-flex" }} aria-hidden="true"><Icon name="sparkles" size="lg" /></span>
                <MonoLabel style={{ color: "var(--brand-ink)" }}>Plataforma AI native</MonoLabel>
              </span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--brand-ink)", maxWidth: "20ch", textWrap: "pretty" }}>
                A IA não é um recurso extra. É como a Tendra.ai foi construída.
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-lead-size)", lineHeight: "var(--text-lead-lh)", color: "var(--brand-ink)", maxWidth: "var(--measure-lead)", textWrap: "pretty" }}>
              Cada etapa da resposta passa por um modelo de linguagem, sempre sob regras que garantem fonte, privacidade e revisão humana. A IA sugere; a sua equipe decide.
            </p>
          </div>

          <div ref={aiRef} className={"tdr-site-ai-steps" + (aiShown ? " is-in" : "")}>
            {[
              { t: "Entende o edital", d: "Lê a planilha e separa as perguntas item por item. Se a estrutura fugir do padrão, a IA localiza as perguntas e a sua equipe confirma a lista.", tag: "IA + regras" },
              { t: "Redige com a sua base", d: "O modelo cruza cada pergunta com a base aprovada e escreve a resposta citando o documento e o trecho. Citação que não existe no documento é descartada.", tag: "IA com citação" },
              { t: "Sinaliza o que exige atenção", d: "Alertas apontam respostas sem fonte, de baixa confiança ou com base vencida. A IA também revisa o texto sob demanda.", tag: "IA + regras" },
              { t: "A pessoa aprova", d: "Nada é aprovado nem exportado pela IA. O revisor responsável decide, e a trilha de auditoria registra.", tag: "Pessoa decide" }
            ].map((s, i) => (
              <Card key={s.t} padding="lg" radius="2xl" className="tdr-site-ai-card" style={{ "--i": i }}>
                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <span className="tdr-site-ai-chip" aria-hidden="true"><Icon name="sparkles" size="lg" /></span>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", letterSpacing: "-0.02em", color: "var(--text-strong)" }}>{s.t}</div>
                  <div style={{ fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" }}>{s.d}</div>
                  <div><Tag>{s.tag}</Tag></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Aurora>

      <Section id="funcionalidades">
        <div style={{ display: "grid", gap: "var(--space-10)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <MonoLabel>Funcionalidades</MonoLabel>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--text-strong)", maxWidth: "24ch", textWrap: "pretty" }}>
              O que a sua equipe passa a ter em cada proposta
            </h2>
          </div>
          <Features />
        </div>
      </Section>

      <Section id="seguranca">
        <div className="tdr-site-trust">
          <div style={{ display: "grid", gap: "var(--space-5)" }}>
            <MonoLabel>Segurança e confiança</MonoLabel>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--text-strong)", maxWidth: "22ch", textWrap: "pretty" }}>
              Nenhuma resposta sai sem revisão humana
            </h2>
            <p style={{ margin: 0, fontSize: "var(--text-body-size)", lineHeight: 1.65, color: "var(--text-body)", maxWidth: "var(--measure-lead)", textWrap: "pretty" }}>
              A trilha de auditoria registra quem aprovou cada item, com qual fonte e em que versão do documento. É o que o seu time de segurança pede quando questiona conteúdo gerado.
            </p>
          </div>
          <div style={{ display: "grid", gap: "var(--gutter-grid)" }}>
            {[
              { icon: "shield-check", t: "Isolamento por tenant", d: "Seus documentos nunca treinam modelo compartilhado." },
              { icon: "history", t: "Auditoria imutável", d: "Registro append-only de cada aprovação e edição." },
              { icon: "users", t: "Aprovação nominal", d: "Cada item tem um revisor responsável identificado." },
              { icon: "database", t: "Base curada e governada", d: "Cada resposta tem dono, versão e validade. A base fica melhor a cada proposta aprovada e avisa quando o conhecimento está vencido ou defasado." }
            ].map((r) => (
              <Card key={r.t} tone="paper" radius="lg" padding="sm">
                <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--brand-sage)", marginTop: 2 }}><Icon name={r.icon} size="lg" /></span>
                  <span style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: 17, color: "var(--text-strong)" }}>{r.t}</span>
                    <span style={{ fontSize: "var(--text-sm-size)", lineHeight: 1.55, color: "var(--text-body)", textWrap: "pretty" }}>{r.d}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
