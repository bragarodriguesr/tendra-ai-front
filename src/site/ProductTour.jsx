import React from "react";
import { Icon, MonoLabel } from "../ds/index.js";
import { Player } from "./demo/motor.js";
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

// No celular, a linha de ativação fica esta distância, em px, abaixo do pé da janela.
const FOLGA = 80;

/**
 * "O produto em ação": os passos rolam à esquerda e a janela do produto, fixa ao lado, toca a cena
 * do passo ativo. Todos os passos, inclusive o 00, sobem esmaecidos a partir do terço inferior da
 * janela e ficam ativos ao cruzar a linha a 1/3 do topo dela (2/3 da altura, contando de baixo);
 * o último para nessa linha. As medidas vêm de `--tour-h`, a altura da janela. No celular a janela
 * fica presa no topo e os passos passam por baixo.
 */
export function ProductTour() {
  const raiz = React.useRef(null);
  const win = React.useRef(null);
  const lista = React.useRef(null);
  const [ativo, setAtivo] = React.useState(-1);

  React.useEffect(() => {
    if (!win.current) return undefined;
    const player = Player(win.current, { scenes: CENAS, side, advance: false, compactBelow: 760, compactSize: [600, 494] });
    const passos = [...lista.current.querySelectorAll("[data-i]")];
    const celular = window.matchMedia("(max-width: 900px)");
    let quadro = 0, atual = -1;
    const medir = () => {
      quadro = 0;
      const r = win.current.getBoundingClientRect();
      raiz.current.style.setProperty("--tour-h", Math.round(r.height) + "px");
      const linha = celular.matches ? r.bottom + FOLGA : r.top + r.height / 3 + 2;
      // No desktop nenhum passo começa ativo: o 00 também sobe até a linha.
      let i = celular.matches ? 0 : -1;
      passos.forEach((el, k) => { if (el.getBoundingClientRect().top <= linha) i = k; });
      if (i !== atual) { atual = i; setAtivo(i); if (i >= 0) player.play(i); }
    };
    const pedir = () => { if (!quadro) quadro = requestAnimationFrame(medir); };
    const ro = new ResizeObserver(pedir); ro.observe(win.current);
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    medir();
    return () => { cancelAnimationFrame(quadro); ro.disconnect(); window.removeEventListener("scroll", pedir); window.removeEventListener("resize", pedir); player.destroy(); };
  }, []);

  return (
    <div ref={raiz} className="tdr-site-tour">
      <div className="tdr-site-tour-sticky">
        <div ref={win} className="tdr-demo" role="img" aria-label="Demonstração animada do produto, com dados fictícios.">
          <div className="win-view" />
        </div>
      </div>
      <ol ref={lista} className="tdr-site-tour-steps">
        {PASSOS.map((p, i) => (
          <li key={p.n} data-i={i} className={"tdr-site-tour-step" + (i === ativo ? " is-on" : "")}>
            <MonoLabel>{p.n} · {p.tela}</MonoLabel>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h3-size)", letterSpacing: "-0.02em", color: "var(--text-strong)" }}>{p.t}</h3>
            <p style={{ margin: 0, fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" }}>{p.d}</p>
            <ul>
              {p.itens.map((x) => (
                <li key={x}><span className="tdr-site-tour-check" aria-hidden="true"><Icon name="check" size={12} /></span>{x}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
