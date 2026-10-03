import React from "react";
import { Badge, Button, Card, Divider, Icon, MonoLabel } from "../ds/index.js";

const PLANS = [
  { t: "Equipe", p: "R$ 4.900", per: "/mês", d: "Até 5 revisores e 20 editais por trimestre.", cta: "Começar", feats: ["Base de respostas", "Trilha de fonte", "Exportação em Word e Excel", "Suporte por e-mail"] },
  { t: "Enterprise", p: "Sob consulta", per: "", d: "Volume ilimitado, SSO e revisão nominal obrigatória.", cta: "Falar com vendas", featured: true, feats: ["Tudo do Equipe", "SSO SAML + SCIM", "Trilha de auditoria exportável", "Isolamento por tenant", "Gerente de conta dedicado"] },
  { t: "Setor público", p: "Sob consulta", per: "", d: "Licitações, pregões e dispensas com exigências formais.", cta: "Falar com vendas", feats: ["Tudo do Enterprise", "Modelos de edital público", "Residência de dados no Brasil"] }
];

export function PricingPage() {
  return (
    <section>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--gutter-section) var(--page-pad)", display: "grid", gap: "var(--space-12)" }}>
        <div style={{ display: "grid", gap: "var(--space-4)", justifyItems: "center", textAlign: "center" }}>
          <MonoLabel tone="sage">PREÇOS</MonoLabel>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-d1-size)", lineHeight: "var(--text-d1-lh)", letterSpacing: "var(--text-d1-ls)", color: "var(--text-strong)", maxWidth: "20ch", textWrap: "pretty" }}>
            Preço por revisor, não por resposta
          </h1>
          <p style={{ margin: 0, fontSize: "var(--text-lead-size)", lineHeight: 1.6, color: "var(--text-body)", maxWidth: "48ch", textWrap: "pretty" }}>
            Cobrar por resposta gerada premiaria o volume. Cobramos por quem revisa — porque é a revisão que garante a entrega.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--gutter-grid)", alignItems: "start" }}>
          {PLANS.map((pl) => (
            <Card key={pl.t} tone={pl.featured ? "ink" : "paper"} radius="2xl" padding="lg">
              <div style={{ display: "grid", gap: "var(--space-5)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", color: pl.featured ? "var(--text-on-inverse)" : "var(--text-strong)" }}>{pl.t}</span>
                  {pl.featured ? <Badge tone="approved-inverse">Mais escolhido</Badge> : null}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: 34, letterSpacing: "-0.03em", color: pl.featured ? "var(--text-on-inverse)" : "var(--text-strong)" }}>{pl.p}</span>
                  {pl.per ? <MonoLabel tone={pl.featured ? "inverse" : "default"}>{pl.per}</MonoLabel> : null}
                </div>
                <div style={{ fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: pl.featured ? "var(--ink-200)" : "var(--text-body)", textWrap: "pretty" }}>{pl.d}</div>
                <Button variant={pl.featured ? "accent" : "secondary"} fullWidth>{pl.cta}</Button>
                <Divider tone={pl.featured ? "inverse" : "subtle"} />
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  {pl.feats.map((ft) => (
                    <div key={ft} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                      <span style={{ color: pl.featured ? "var(--brand-lime)" : "var(--state-ink)", marginTop: 1 }}><Icon name="check" size="md" strokeWidth={2.4} /></span>
                      <span style={{ fontSize: "var(--text-sm-size)", lineHeight: 1.55, color: pl.featured ? "var(--ink-200)" : "var(--text-body)" }}>{ft}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
