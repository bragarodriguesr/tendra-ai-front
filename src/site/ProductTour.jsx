import React from "react";
import { Icon, IconButton, MonoLabel } from "../ds/index.js";
import { Player, REDUCED } from "./demo/motor.js";
import { CENAS, side } from "./demo/cenas.js";
import "./demo/demo.css";

// Passos 00 a 04, na ordem das cenas de `CENAS`.
const PASSOS = [
  { n: "00", tela: "Base de conhecimento", t: "Conecte suas fontes", d: "Drives, intranet, documentações, certificações e propostas/RFPs anteriores. A Tendra.ai organiza o que está espalhado.", itens: ["Políticas, certificações, documentação técnica e RFPs passadas", "Cada documento com versão e validade", "Aviso quando a fonte passa de 120 dias sem atualização"] },
  { n: "01", tela: "Tarefas", t: "Importe o questionário", d: "Suba a planilha do cliente. A Tendra.ai separa as perguntas item por item e classifica cada uma por área.", itens: ["Planilha .xlsx ou .csv, na estrutura do cliente", "Perguntas separadas item por item", "Classificação por área responsável"] },
  { n: "02", tela: "IA em ação", t: "Gere com rastreabilidade", d: "O modelo cruza cada pergunta com a base aprovada e escreve a resposta citando o documento e a página que a sustenta.", itens: ["Resposta redigida só com a base aprovada", "Documento e página em cada parágrafo", "Citação que não existe no documento é descartada"] },
  { n: "03", tela: "Revisão", t: "Revise e aprove", d: "Alertas apontam o que exige atenção. O revisor edita, aprova nominalmente e a trilha de auditoria registra tudo.", itens: ["Alertas de fonte antiga, sem fonte e baixa confiança", "Edição com a sugestão original sempre visível", "Aprovação nominal registrada na trilha"] },
  { n: "04", tela: "Exportação", t: "Exporte a planilha aprovada", d: "O arquivo sai na ordem original do edital, com a resposta aprovada, as edições do revisor e as fontes usadas.", itens: ["Planilha na ordem original do edital", "Resposta aprovada, edições e fontes no arquivo", "Respostas aprovadas voltam para a base"] }
];

// Depois de quantas execuções completas da cena as setas ganham destaque.
const VOLTAS_PARA_DESTACAR = 2;
// Deslize mínimo, em px, para trocar de passo no toque.
const DESLIZE = 48;

/**
 * "O produto em ação" em carrossel: um passo por vez, com o texto à esquerda e a janela do produto
 * tocando a cena do passo à direita. As setas laterais trocam o passo (também pelas setas do
 * teclado e pelo deslize no celular). Quando a cena do passo termina duas vezes, as setas pulsam
 * para indicar que há mais passos; o destaque recomeça a cada passo. Os tamanhos saem da altura da
 * tela, para o passo inteiro caber sem rolar.
 */
export function ProductTour() {
  const win = React.useRef(null);
  const player = React.useRef(null);
  const toque = React.useRef(null);
  const [ativo, setAtivo] = React.useState(0);
  const [destaque, setDestaque] = React.useState(false);
  const total = PASSOS.length;

  // Voltas completas da cena do passo atual; zera quando o passo muda.
  const voltas = React.useRef({ passo: 0, n: 0 });

  React.useEffect(() => {
    if (!win.current) return undefined;
    const p = Player(win.current, {
      scenes: CENAS, side, advance: false, compactBelow: 760, compactSize: [600, 494],
      onEnd: (i) => {
        if (voltas.current.passo !== i) voltas.current = { passo: i, n: 0 };
        voltas.current.n += 1;
        // Sem movimento a cena não se repete: destaca já na primeira volta.
        if (voltas.current.n >= (REDUCED ? 1 : VOLTAS_PARA_DESTACAR)) setDestaque(true);
      }
    });
    player.current = p;
    return () => { p.destroy(); player.current = null; };
  }, []);

  const ir = (i) => {
    const alvo = Math.max(0, Math.min(total - 1, i));
    if (alvo === ativo) return;
    voltas.current = { passo: alvo, n: 0 };
    setDestaque(false);
    setAtivo(alvo);
    if (player.current) player.current.play(alvo);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); ir(ativo + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); ir(ativo - 1); }
  };
  const onTouchStart = (e) => { const t = e.touches[0]; toque.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    if (!toque.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.current.x, dy = t.clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) < DESLIZE || Math.abs(dx) < Math.abs(dy)) return;
    ir(ativo + (dx < 0 ? 1 : -1));
  };

  const temAnterior = ativo > 0, temProximo = ativo < total - 1;
  const seta = (lado) => {
    const proximo = lado === "next";
    const habilitada = proximo ? temProximo : temAnterior;
    return (
      <IconButton
        icon={proximo ? "chevron-right" : "chevron-left"}
        label={proximo ? "Próximo passo" : "Passo anterior"}
        variant="outline"
        size="lg"
        disabled={!habilitada}
        onClick={() => ir(ativo + (proximo ? 1 : -1))}
        className={"tdr-site-tour-arrow is-" + lado + (destaque && habilitada ? " is-hint" : "")}
      />
    );
  };

  return (
    <div
      className="tdr-site-tour"
      role="region"
      aria-roledescription="carrossel"
      aria-label="O produto em ação, passo a passo"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="tdr-site-tour-side is-prev">{seta("prev")}</div>

      <div className="tdr-site-tour-body">
        {/* Todos os passos ocupam a mesma célula: a altura é a do maior, e nada pula ao trocar. */}
        <div className="tdr-site-tour-steps" aria-live="polite">
          {PASSOS.map((p, i) => (
            <div
              key={p.n}
              className={"tdr-site-tour-step" + (i === ativo ? " is-on" : "")}
              role="group"
              aria-roledescription="passo"
              aria-label={`${p.n} de ${PASSOS[total - 1].n}: ${p.t}`}
              aria-hidden={i !== ativo}
            >
              <MonoLabel>{p.n} · {p.tela}</MonoLabel>
              <h3 className="tdr-site-tour-title">{p.t}</h3>
              <p className="tdr-site-tour-text">{p.d}</p>
              <ul>
                {p.itens.map((x) => (
                  <li key={x}><span className="tdr-site-tour-check" aria-hidden="true"><Icon name="check" size={12} /></span>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tdr-site-tour-window">
          <div ref={win} className="tdr-demo" role="img" aria-label="Demonstração animada do produto, com dados fictícios.">
            <div className="win-view" />
          </div>
        </div>
      </div>

      <div className="tdr-site-tour-side is-next">{seta("next")}</div>

      <div className="tdr-site-tour-nav">
        <div className="tdr-site-tour-nav-arrow">{seta("prev")}</div>
        <ol className="tdr-site-tour-dots" aria-label="Passos">
          {PASSOS.map((p, i) => (
            <li key={p.n}>
              <button
                type="button"
                className={"tdr-site-tour-dot" + (i === ativo ? " is-on" : "")}
                aria-label={`Passo ${p.n}: ${p.t}`}
                aria-current={i === ativo ? "step" : undefined}
                onClick={() => ir(i)}
              >
                <span aria-hidden="true">{p.n}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="tdr-site-tour-nav-arrow">{seta("next")}</div>
      </div>
    </div>
  );
}
