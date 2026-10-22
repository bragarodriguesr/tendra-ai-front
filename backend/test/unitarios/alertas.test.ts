import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import type { ItemDaRevisao } from "../../src/rastreabilidade/montarItem.ts";
import { aplicarAlertasDeterministicos, termosCriticosNaPergunta } from "../../src/regras/alertas.ts";

/** Alertas determinísticos (etapa A7). */
const GABARITO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica/rfps/gabarito-rfps-pulse.json");
const termos = await carregarTermosCriticos();

const fonte = (age: number) => ({ doc: "a.md", loc: "1. Seção · linha 9", type: "Documento" as const, age, ex: "texto" });
const item = (q: string, ages: number[], alerts: ItemDaRevisao["alerts"] = []): ItemDaRevisao => ({
  id: "r1",
  q,
  paras: ages.length ? [{ t: "Resposta.", s: ages.map((_, posicao) => posicao + 1) }] : [],
  srcs: ages.map(fonte),
  alerts,
  st: ages.length ? "sugerida" : "sem-rascunho",
  orig: ages.length ? "Resposta." : "",
});

describe("Cenário 20 · fonte desatualizada", () => {
  it("marca old só acima de 120 dias", () => {
    expect(aplicarAlertasDeterministicos(item("Qual o SLA?", [120]), termos).alerts).toEqual([]);
    expect(aplicarAlertasDeterministicos(item("Qual o SLA?", [10, 121]), termos).alerts).toEqual([{ t: "old" }]);
  });
});

describe("Cenário 21 · pergunta com termo crítico", () => {
  it.each([
    ["Existe MULTA por rescisão antecipada?", ["multa", "rescisão"]],
    ["Há multas contratuais?", ["multa"]],
    ["Como são tratadas as indenizações?", ["indenização"]],
    ["Qual a clausula penal?", ["cláusula penal"]],
    ["Existe limitação de responsabilidade?", ["limitação de responsabilidade"]],
    ["Como é a segurança dos dados?", []],
    ["Qual o seguro-garantia exigido?", ["garantia", "seguro"]],
    ["Há fórum de usuários?", []],
  ])("%s", (pergunta, esperados) => {
    expect(termosCriticosNaPergunta(pergunta, termos).sort()).toEqual([...esperados].sort());
  });

  it("marca critical também em item sem rascunho e mantém a ordem dos alertas", () => {
    expect(aplicarAlertasDeterministicos(item("A Pulse aceita multa por descumprimento?", [], [{ t: "nocontext" }]), termos).alerts).toEqual([
      { t: "critical" },
      { t: "nocontext" },
    ]);
    expect(aplicarAlertasDeterministicos(item("Qual o foro?", [200], [{ t: "lowconf" }]), termos).alerts).toEqual([
      { t: "critical" },
      { t: "lowconf" },
      { t: "old" },
    ]);
  });

  it("confere com o gabarito das três RFPs sintéticas: as 19 perguntas críticas e nenhuma outra", () => {
    const gabarito = JSON.parse(readFileSync(GABARITO, "utf8")) as {
      rfps: { perguntas: { ref: string; pergunta: string; alertas_esperados_base: string[] }[] }[];
    };
    const divergentes = gabarito.rfps
      .flatMap((rfp) => rfp.perguntas)
      .filter((pergunta) => termosCriticosNaPergunta(pergunta.pergunta, termos).length > 0 !== pergunta.alertas_esperados_base.includes("critical"))
      .map((pergunta) => `${pergunta.ref}: ${pergunta.pergunta}`);
    expect(divergentes).toEqual([]);
  });
});
