import React from "react";
import { Card } from "../components/core/Card.jsx";
import { Badge } from "../components/core/Badge.jsx";
import { Button } from "../components/core/Button.jsx";
import { Icon } from "../components/core/Icon.jsx";
import { MonoLabel } from "../components/core/MonoLabel.jsx";
import { Divider } from "../components/core/Divider.jsx";
import { ProgressBar } from "../components/core/ProgressBar.jsx";
import { SourceTrail } from "../components/feedback/SourceTrail.jsx";

const Section = ({ children, tone, style }) => (
  <section style={{ background: tone === "ink" ? "var(--surface-inverse)" : tone === "sunken" ? "var(--surface-sunken)" : "transparent", ...style }}>
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--gutter-section) var(--page-pad)" }}>{children}</div>
  </section>
);

export function HomePage({ onPage }) {
  return (
    <>
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", gap: "var(--space-12)", alignItems: "center" }}>
          <div style={{ display: "grid", gap: "var(--space-6)" }}>
            <MonoLabel tone="sage">RFP &amp; LICITAÇÕES</MonoLabel>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-d1-size)", lineHeight: "var(--text-d1-lh)", letterSpacing: "var(--text-d1-ls)", color: "var(--text-strong)", maxWidth: "20ch", textWrap: "pretty" }}>
              Responda a um RFP em <span style={{ background: "var(--brand-lime)", padding: "0 8px" }}>horas</span>, não semanas.
            </h1>
            <p style={{ margin: 0, fontSize: "var(--text-lead-size)", lineHeight: "var(--text-lead-lh)", color: "var(--text-body)", maxWidth: "var(--measure-lead)", textWrap: "pretty" }}>
              A Tendra.ai lê o edital, cruza com a sua base aprovada e devolve respostas completas — com a fonte de cada afirmação rastreável até o documento de origem.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Button size="lg" icon="calendar">Agendar demo</Button>
              <Button size="lg" variant="secondary" iconEnd="arrow-up-right" onClick={() => onPage("precos")}>Ver planos e preços</Button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", flexWrap: "wrap", paddingTop: "var(--space-2)" }}>
              {["SOC 2 TIPO II", "ISO 27001", "LGPD"].map((c) => (
                <MonoLabel key={c} tone="sage">{c}</MonoLabel>
              ))}
            </div>
          </div>

          <Card tone="ink" radius="3xl" padding="lg">
            <div style={{ display: "grid", gap: "var(--space-5)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
                <MonoLabel tone="inverse">REQ-084/210 · Banco Aurora</MonoLabel>
                <Badge tone="approved-inverse" icon="check">Conformidade OK</Badge>
              </div>
              <Card tone="ink-panel" radius="lg" padding="sm">
                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div style={{ fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--ink-200)" }}>
                    “Descreva os controles de criptografia de dados em repouso e em trânsito.”
                  </div>
                  <Divider tone="inverse" />
                  <div style={{ fontSize: "var(--text-ui-size)", lineHeight: 1.62, color: "var(--n-075)", textWrap: "pretty" }}>
                    Dados em repouso cifrados com AES-256, chaves em HSM FIPS 140-2 nível 3 com rotação a cada 90 dias; tráfego em TLS 1.3 com <span style={{ color: "var(--brand-lime)" }}>perfect forward secrecy</span>.
                  </div>
                  <SourceTrail tone="ink" sources={[{ file: "Security_Whitepaper_v4.pdf", page: 12 }]} />
                </div>
              </Card>
              <ProgressBar tone="ink" label="Preenchimento automático" value={92} />
            </div>
          </Card>
        </div>
      </Section>

      <Section tone="sunken">
        <div style={{ display: "grid", gap: "var(--space-10)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <MonoLabel>Como funciona</MonoLabel>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--text-strong)", maxWidth: "24ch", textWrap: "pretty" }}>
              Três passos, nenhuma resposta sem fonte
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--gutter-grid)" }}>
            {[
              { n: "01", icon: "upload", t: "Importe o edital", d: "PDF, planilha ou portal do cliente. A Tendra.ai separa os requisitos item por item." },
              { n: "02", icon: "sparkles", t: "Gere com rastreabilidade", d: "Cada resposta sai citando o documento e a página que a sustenta." },
              { n: "03", icon: "check-check", t: "Revise e aprove", d: "O time responsável aprova nominalmente; a trilha de auditoria registra tudo." }
            ].map((s) => (
              <Card key={s.n} padding="lg" radius="2xl">
                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: "var(--surface-sunken)", color: "var(--brand-sage)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={s.icon} size="lg" />
                    </span>
                    <MonoLabel>{s.n}</MonoLabel>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", letterSpacing: "-0.02em", color: "var(--text-strong)" }}>{s.t}</div>
                  <div style={{ fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" }}>{s.d}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--gutter-grid)" }}>
          {[
            { v: "4h 12m", k: "por edital de 200 itens" },
            { v: "83%", k: "de reaproveitamento da base" },
            { v: "3,2×", k: "mais RFPs respondidos por trimestre" },
            { v: "100%", k: "das respostas com fonte citada" }
          ].map((s) => (
            <div key={s.k} style={{ display: "grid", gap: "var(--space-2)", borderTop: "var(--border-width-accent) solid var(--brand-sage)", paddingTop: "var(--space-4)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: 40, letterSpacing: "-0.03em", color: "var(--text-strong)" }}>{s.v}</div>
              <div style={{ fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-body)", textWrap: "pretty" }}>{s.k}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "var(--space-12)", alignItems: "center" }}>
          <div style={{ display: "grid", gap: "var(--space-5)" }}>
            <MonoLabel tone="accent">POR QUE CONFIAM</MonoLabel>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-d2-size)", lineHeight: "var(--text-d2-lh)", letterSpacing: "var(--text-d2-ls)", color: "var(--text-on-inverse)", maxWidth: "22ch", textWrap: "pretty" }}>
              Nenhuma resposta sai sem revisão humana
            </h2>
            <p style={{ margin: 0, fontSize: "var(--text-body-size)", lineHeight: 1.65, color: "var(--ink-200)", maxWidth: "var(--measure-lead)", textWrap: "pretty" }}>
              A trilha de auditoria registra quem aprovou cada item, com qual fonte e em que versão do documento. É o que o seu time de segurança pede quando questiona conteúdo gerado.
            </p>
            <div>
              <Button variant="inverse-secondary" iconEnd="arrow-right" onClick={() => onPage("precos")}>Ver planos e preços</Button>
            </div>
          </div>
          <div style={{ display: "grid", gap: "var(--gutter-grid)" }}>
            {[
              { icon: "shield-check", t: "Isolamento por tenant", d: "Seus documentos nunca treinam modelo compartilhado." },
              { icon: "history", t: "Auditoria imutável", d: "Registro append-only de cada aprovação e edição." },
              { icon: "users", t: "Aprovação nominal", d: "Cada item tem um revisor responsável identificado." }
            ].map((r) => (
              <Card key={r.t} tone="ink-panel" radius="lg" padding="sm">
                <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--brand-lime)", marginTop: 2 }}><Icon name={r.icon} size="lg" /></span>
                  <span style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: 17, color: "var(--text-on-inverse)" }}>{r.t}</span>
                    <span style={{ fontSize: "var(--text-sm-size)", lineHeight: 1.55, color: "var(--ink-200)", textWrap: "pretty" }}>{r.d}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <Card tone="accent" radius="3xl" padding="lg">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-8)", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <MonoLabel style={{ color: "var(--brand-ink)" }}>Webinar · 14 de outubro</MonoLabel>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--brand-ink)", maxWidth: "26ch", textWrap: "pretty" }}>
                Segurança em respostas geradas por IA
              </div>
            </div>
            <Button icon="play">Inscrever</Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
