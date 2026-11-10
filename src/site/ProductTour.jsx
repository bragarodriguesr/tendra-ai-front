import React from "react";
import { Icon, MonoLabel } from "../ds/index.js";
import { Player } from "./demo/motor.js";
import { CENAS, side } from "./demo/cenas.js";
import "./demo/demo.css";

// Passos 00 a 04, na ordem das cenas de `CENAS`.
const PASSOS = [
  { n: "00", tela: "Base de conhecimento", t: "Conecte suas fontes", d: "Drives, intranet, documentações, certificações e propostas/RFPs anteriores. A Tendra.ai organiza o que está espalhado.", itens: ["Políticas, certificações, documentação técnica e RFPs passadas", "Cada documento com versão e validade", "Aviso quando a fonte passa de 120 dias sem atualização"] },
  { n: "01", tela: "Tarefas", t: "Importe o edital", d: "Suba a planilha do cliente. A Tendra.ai separa as perguntas item por item e classifica cada uma por área.", itens: ["Planilha .xlsx ou .csv, na estrutura do cliente", "Perguntas separadas item por item", "Classificação por área responsável"] },
  { n: "02", tela: "Revisão", t: "Gere com rastreabilidade", d: "O modelo cruza cada pergunta com a base aprovada e escreve a resposta citando o documento e a página que a sustenta.", itens: ["Resposta redigida só com a base aprovada", "Documento e página em cada parágrafo", "Citação que não existe no documento é descartada"] },
  { n: "03", tela: "Revisão", t: "Revise e aprove", d: "Alertas apontam o que exige atenção. O revisor edita, aprova nominalmente e a trilha de auditoria registra tudo.", itens: ["Alertas de fonte antiga, sem fonte e baixa confiança", "Edição com a sugestão original sempre visível", "Aprovação nominal registrada na trilha"] },
  { n: "04", tela: "Exportação", t: "Exporte a planilha aprovada", d: "O arquivo sai na ordem original do edital, com a resposta aprovada, as edições do revisor e as fontes usadas.", itens: ["Planilha na ordem original do edital", "Resposta aprovada, edições e fontes no arquivo", "Respostas aprovadas voltam para a base"] }
];

/**
 * "O produto em ação": os passos rolam à esquerda e a janela do produto, fixa ao lado, toca a cena
 * do passo que está no meio da tela. No celular a janela fica presa no topo e os passos passam por baixo.
 */
export function ProductTour() {
  const win = React.useRef(null);
  const lista = React.useRef(null);
  const [ativo, setAtivo] = React.useState(0);

  React.useEffect(() => {
    if (!win.current || typeof IntersectionObserver === "undefined") return undefined;
    const player = Player(win.current, { scenes: CENAS, side, advance: false, compactBelow: 760 });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = Number(e.target.dataset.i);
      setAtivo(i); player.play(i);
    }), { rootMargin: "-48% 0px -48% 0px" });
    lista.current.querySelectorAll("[data-i]").forEach((el) => io.observe(el));
    return () => { io.disconnect(); player.destroy(); };
  }, []);

  return (
    <div className="tdr-site-tour">
      <div className="tdr-site-tour-sticky">
        <div ref={win} className="tdr-demo" role="img" aria-label="Demonstração animada do produto, com dados fictícios.">
          <div className="win-bar" aria-hidden="true">
            <span className="win-url" />
            <span className="badge live"><span className="dot" />Demonstração</span>
          </div>
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
