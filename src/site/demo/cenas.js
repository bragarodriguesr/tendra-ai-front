// Cenas da demonstração "O produto em ação": HTML de cada tela e o roteiro que a anima.
// Os dados são fictícios e seguem os exemplos já usados no site (Banco Aurora, REQ-084).
import { count, ic, stream } from "./motor.js";

const NAV = [["Início"], ["dashboard", "layout-dashboard", "Dashboard"], ["Trabalho"], ["tarefas", "layout-grid", "Tarefas"], ["revisao", "eye", "Revisão"], ["exportacao", "download", "Exportação"], ["historico", "history", "Histórico"], ["Base"], ["base", "database", "Base de conhecimento"]];
export const side = (on) => `<div class="s-side">${NAV.map((n) => (n.length === 1 ? `<div class="mono">${n[0]}</div>` : `<div class="s-nav${n[0] === on ? " on" : ""}">${ic(n[1], 15)}${n[2]}</div>`)).join("")}</div>`;
const ANSWER = "Dados em repouso são cifrados com AES-256, com chaves em HSM FIPS 140-2 nível 3. [1] O tráfego usa TLS 1.3 com perfect forward secrecy. [2]";
const ANSWER_HTML = 'Dados em repouso são cifrados com AES-256, com chaves em HSM FIPS 140-2 nível 3. <span class="s-cite">1</span> O tráfego usa TLS 1.3 com perfect forward secrecy. <span class="s-cite">2</span>';
const ITEMS = [["REQ-082", "Onde ficam armazenados os backups?", "Aprovada"], ["REQ-083", "A plataforma possui certificação ISO 27001?", "Aprovada"], ["REQ-084", "Descreva os controles de criptografia de dados em repouso e em trânsito.", ""], ["REQ-085", "Como é feita a segregação de dados entre clientes?", "Na fila"]];
const bdg = (t) => `<span class="badge${t === "Aprovada" ? " ok" : ""}">${t === "Aprovada" ? ic("check", 11) : ""}${t}</span>`;
function review(mode) {
  const gen = mode === "gerar";
  return `<div class="s-row"><div><div class="mono">Revisão · RFP Banco Aurora — 2026</div><div class="s-h">Segurança da informação</div></div><span class="s-id"><b id="apv">${gen ? 82 : 83}</b>/210 aprovadas</span></div>
  <div class="s-review"><div class="s-list">${ITEMS.map((i) => `<div class="s-li${i[0] === "REQ-084" ? " sel" : ""}" data-id="${i[0]}"><div class="s-row"><span class="s-id">${i[0]}</span>${bdg(i[0] === "REQ-084" ? (gen ? "Gerando" : "Sugerida") : !gen && i[0] === "REQ-085" ? "Sugerida" : i[2])}</div>${i[1]}</div>`).join("")}</div>
  <div class="s-detail">
    <div class="s-row"><span class="s-id">REQ-084/210 · CRIPTOGRAFIA</span><span id="st">${bdg(gen ? "Gerando" : "Sugerida")}</span></div>
    <div class="s-q">“${ITEMS[2][1]}”</div>
    <div class="s-card"><div class="s-ans" id="ans">${gen ? "" : ANSWER_HTML}</div></div>
    ${gen ? "" : `<div class="s-alert" id="alert"><span>${ic("clock", 14)}<span id="alert-t">Fonte com mais de 120 dias · Politica_Criptografia.pdf</span></span><span class="s-btn sec" id="ack" style="height:28px">Reconhecer alerta</span></div>`}
    <div style="display:grid;gap:6px"><div class="mono">Fontes por parágrafo</div><div class="s-srcs">
      <div class="s-src" id="src1"><span class="s-id">1 · Security_Whitepaper_v4.pdf · p. 12</span><p>…dados em repouso <span>cifrados com AES-256</span>, chaves em HSM FIPS 140-2 nível 3…</p></div>
      <div class="s-src" id="src2"><span class="s-id">2 · Politica_Criptografia.pdf · p. 4</span><p>…conexões externas exigem <span>TLS 1.3 com perfect forward secrecy</span>…</p></div></div></div>
    <div class="s-row" style="align-items:flex-end"><div class="s-fill"><div class="s-row"><span class="s-id">Preenchimento automático</span><span class="s-id" id="pct">${gen ? "0" : "92"}%</span></div><div class="s-bar"><i id="bar" style="--v:${gen ? 0 : 92}%"></i></div></div>
      <div id="acts" style="display:flex;gap:8px"><span class="s-btn sec" id="edit" ${gen ? "data-off" : ""}>${ic("pencil", 13)}<span>Editar resposta</span></span><span class="s-btn" id="ok" ${gen ? "data-off" : ""}>${ic("check", 13)}Aprovar resposta</span></div></div>
  </div></div>`;
}
const ETAPAS = [
  { id: "importar", nav: "tarefas", url: "app.tendra.ai/tarefas/nova", dur: 14500,
    html: () => `<div class="s-row"><div><div class="mono">Nova tarefa</div><div class="s-h">Nova RFP/Questionário</div></div><span class="badge">Rascunho</span></div>
      <div id="f1" style="display:grid;gap:14px"><div style="display:grid;gap:6px"><span class="s-id">EMPRESA</span><div class="s-input" id="emp"></div></div>
        <div class="s-drop" id="drop">${ic("upload", 20)}<span>Arraste a planilha de perguntas ou escolha o arquivo</span><span class="s-id">.XLSX · .CSV</span></div>
        <div class="s-row"><span class="s-id">O texto original de cada item continua visível na revisão.</span><span class="s-btn" id="go" data-off>Importar perguntas</span></div></div>
      <div id="f2" class="s-card" hidden style="display:grid;gap:12px"><div class="mono">Processando RFP_Banco_Aurora_2026.xlsx</div>
        ${["Lendo a planilha", "Separando as perguntas item por item", "Classificando cada pergunta por área"].map((t) => `<div class="s-step"><span class="si">${ic("loader-circle", 15)}</span>${t}</div>`).join("")}
        <div class="s-bar"><i id="pb" style="transition-duration:700ms"></i></div></div>
      <div id="f3" hidden style="display:grid;gap:12px"><div class="s-row"><span style="color:var(--brand-ink);font-weight:600;font-size:15px">Identificamos <span id="n">0</span> perguntas.</span><span class="badge ok">${ic("check", 11)}Processamento concluído</span></div>
        <div class="s-card" style="padding:4px 0">${[["REQ-001", "Descreva a arquitetura de alta disponibilidade.", "Infraestrutura"], ["REQ-002", "A plataforma possui certificação ISO 27001?", "Segurança"], ["REQ-003", "Qual é o prazo de retenção dos dados?", "Jurídico"], ["REQ-004", "Como funciona o suporte em horário comercial?", "Operações"]].map((r) => `<div class="s-req" hidden><span class="s-id">${r[0]}</span><span>${r[1]}</span><span class="tag">${r[2]}</span></div>`).join("")}</div>
        <div class="s-row"><span class="s-id">+ 206 PERGUNTAS</span><span class="s-btn" id="open">Abrir revisão${ic("arrow-right", 13)}</span></div></div>`,
    run: async (c) => {
      await c.wait(700); c.$("#emp").classList.add("focus"); await c.type("#emp", "Banco Aurora"); await c.wait(300); c.$("#emp").classList.remove("focus", "s-caret");
      await c.move("#drop"); c.$("#drop").classList.add("over"); await c.wait(450);
      c.$("#drop").innerHTML = `<span class="s-file s-pop">${ic("file-text", 15)}RFP_Banco_Aurora_2026.xlsx · 210 linhas</span>`; c.$("#drop").classList.remove("over");
      c.$("#go").removeAttribute("data-off"); await c.wait(500); await c.click("#go");
      c.$("#f1").style.display = "none"; c.show("#f2");
      const steps = c.$$("#f2 .s-step");
      for (let i = 0; i < steps.length; i++) { steps[i].querySelector(".ic").classList.add("spin"); await c.wait(950); steps[i].classList.add("done"); steps[i].querySelector(".si").innerHTML = ic("check", 15); c.$("#pb").style.setProperty("--v", ((i + 1) / 3) * 100 + "%"); }
      await c.wait(600); c.$("#f2").hidden = true; c.show("#f3"); await count(c.$("#n"), 210, 800, c);
      for (const r of c.$$("#f3 .s-req")) { r.hidden = false; r.classList.add("s-pop"); await c.wait(260); }
      await c.wait(700); await c.click("#open");
    } },
  { id: "gerar", nav: "revisao", url: "app.tendra.ai/revisao/req-084", dur: 13000,
    html: () => review("gerar"),
    run: async (c) => {
      c.$("#st .badge").insertAdjacentHTML("afterbegin", `<span class="spin" style="display:inline-flex">${ic("loader-circle", 11)}</span>`);
      await c.wait(900);
      await stream(c.$("#ans"), ANSWER, c, { per: 70, onCite: (n) => { c.$$(".s-src").forEach((s) => s.classList.remove("hot")); c.$("#src" + n).classList.add("hot"); } });
      await c.wait(500); c.$("#st").innerHTML = bdg("Sugerida"); c.$('[data-id="REQ-084"] .badge').outerHTML = bdg("Sugerida");
      c.$("#edit").removeAttribute("data-off"); c.$("#ok").removeAttribute("data-off");
      c.$("#bar").style.setProperty("--v", "92%"); await count(c.$("#pct"), 92, 1400, c, (n) => n + "%");
      await c.wait(500); c.$('[data-id="REQ-085"] .badge').outerHTML = bdg("Gerando"); await c.wait(1100); c.$('[data-id="REQ-085"] .badge').outerHTML = bdg("Sugerida");
    } },
  { id: "revisar", nav: "revisao", url: "app.tendra.ai/revisao/req-084", dur: 14500,
    html: () => review("revisar"),
    run: async (c) => {
      c.$("#src2").classList.add("hot"); await c.wait(900); await c.click("#ack");
      c.$("#alert").classList.add("ack"); c.$("#alert-t").textContent = "Alerta reconhecido por Marcelo Vieira · 14:31"; c.$("#ack").hidden = true; c.$("#src2").classList.remove("hot");
      await c.wait(600); await c.click("#edit"); c.$("#edit span").textContent = "Concluir edição";
      const ins = document.createElement("span"); ins.className = "s-ins s-caret"; c.$("#ans").append(" ", ins);
      await c.type(ins, "As chaves são rotacionadas a cada 90 dias.", 38); await c.wait(500); ins.classList.remove("s-caret");
      await c.click("#edit"); c.$("#edit span").textContent = "Editar resposta"; await c.wait(400); await c.click("#ok");
      c.$("#st").innerHTML = bdg("Aprovada"); c.$('[data-id="REQ-084"] .badge').outerHTML = bdg("Aprovada"); c.$("#apv").textContent = "84";
      c.$("#acts").innerHTML = `<span class="s-id s-pop">APROVADA POR MARCELO VIEIRA · 14:32</span>`;
      c.main.insertAdjacentHTML("beforeend", `<div class="s-toast">${ic("check-check", 15)}Resposta aprovada. Trilha de auditoria atualizada.</div>`);
    } },
  { id: "exportar", nav: "exportacao", url: "app.tendra.ai/exportacao", dur: 10500,
    html: () => `<div class="s-row"><div><div class="mono">Exportação</div><div class="s-h">RFP Banco Aurora — 2026</div></div><span id="est">${bdg("Pronta")}</span></div>
      <div class="s-card" style="display:grid;gap:8px"><div class="s-row"><span>Respostas aprovadas</span><span class="s-id"><b id="ap" style="color:var(--brand-ink)">0</b>/210</span></div><div class="s-bar"><i id="eb"></i></div></div>
      <div class="s-table"><div class="s-tr h"><span>Pergunta</span><span>ID</span><span>Resposta aprovada</span><span>Fontes</span></div>
        ${[["Onde ficam armazenados os backups?", "REQ-082", "Backups ficam em região distinta da produção, criptografados com AES-256…", "Politica_Backup_DR.pdf · p. 7"], ["A plataforma possui certificação ISO 27001?", "REQ-083", "Sim. A certificação ISO/IEC 27001 está vigente…", "Certificado_ISO27001.pdf · p. 1"], ["Descreva os controles de criptografia…", "REQ-084", "Dados em repouso são cifrados com AES-256…", "Security_Whitepaper_v4.pdf · p. 12"]].map((r) => `<div class="s-tr" hidden><span style="color:var(--brand-ink)">${r[0]}</span><span class="s-id">${r[1]}</span><span>${r[2]}</span><span class="s-id">${r[3]}</span></div>`).join("")}</div>
      <div class="s-row"><span class="s-id">FORMATO: PLANILHA (.XLSX), NA ORDEM ORIGINAL</span><span class="s-btn" id="dl">${ic("download", 13)}Baixar planilha</span></div>
      <div id="file" hidden style="display:grid;gap:10px;justify-items:start"><span class="s-file">${ic("file-text", 15)}RFP_Banco_Aurora_2026_respostas.xlsx${ic("check", 14)}</span><span style="display:flex;gap:8px;align-items:center">${ic("database", 14)}As respostas aprovadas passam a compor a base de conhecimento.</span></div>`,
    run: async (c) => {
      await c.wait(500); c.$("#eb").style.setProperty("--v", "100%"); await count(c.$("#ap"), 210, 1500, c);
      for (const r of c.$$(".s-tr[hidden]")) { r.hidden = false; r.classList.add("s-pop"); await c.wait(300); }
      await c.wait(600); await c.click("#dl"); c.show("#file"); c.$("#est").innerHTML = bdg("Exportada").replace('badge"', 'badge ok"');
    } }
];


/* Passo 00: documentos entrando na base de conhecimento. */
const DOCS = [["Security_Whitepaper_v4.pdf", "Documento", "4.0", "Vigente", "ok"], ["Politica_Backup_DR.pdf", "Documento", "2.3", "Mais de 120 dias", "warn"], ["RFP_Aurora_2025.xlsx", "RFP passada", "1.0", "Vigente", "ok"]];
const row = (d, hid) => `<div class="s-tr base"${hid ? " hidden" : ""}><span style="color:var(--brand-ink)">${d[0]}</span><span>${d[1]}</span><span class="s-id">${d[2]}</span><span class="badge ${d[4]}">${ic(d[4] === "ok" ? "check" : "clock", 11)}${d[3]}</span></div>`;
const BASE = { id: "base", nav: "base", url: "app.tendra.ai/base", dur: 12500,
  html: () => `<div class="s-row"><div><div class="mono">Base</div><div class="s-h">Base de conhecimento</div></div><span class="s-btn" id="up">${ic("upload", 13)}Subir documentos</span></div>
    <div class="s-row"><span class="s-id">PRAZO DE AGING EM VIGOR: 120 DIAS SEM ATUALIZAÇÃO</span><span class="s-id"><b id="nd" style="color:var(--brand-ink)">2</b> DOCUMENTOS ATIVOS</span></div>
    <div id="res" class="s-card" hidden style="display:grid;gap:10px"><div class="mono">Resultado do envio</div><div class="s-up">${DOCS.map((d) => `<span class="s-file" hidden><span class="si spin" style="display:inline-flex">${ic("loader-circle", 14)}</span>${d[0]}</span>`).join("")}</div></div>
    <div class="s-table"><div class="s-tr base h"><span>Documento</span><span>Tipo</span><span>Versão</span><span>Situação</span></div>
      ${row(["Politica_Acesso.docx", "Documento", "2.1", "Vigente", "ok"])}${row(["Certificado_ISO27001.pdf", "Documento", "2026", "Vigente", "ok"])}${DOCS.map((d) => row(d, true)).join("")}</div>`,
  run: async (c) => {
    await c.wait(900); await c.click("#up"); c.show("#res");
    const files = c.$$("#res .s-file"), rows = c.$$(".s-tr.base[hidden]");
    for (const f of files) { f.hidden = false; f.classList.add("s-pop"); await c.wait(350); }
    await c.wait(700);
    for (let i = 0; i < files.length; i++) { const si = files[i].querySelector(".si"); si.classList.remove("spin"); si.innerHTML = ic("check", 14); rows[i].hidden = false; rows[i].classList.add("s-pop"); c.$("#nd").textContent = 3 + i; await c.wait(800); }
  } };


/** As cinco telas, na ordem dos passos 00 a 04. */
export const CENAS = [BASE, ...ETAPAS];
