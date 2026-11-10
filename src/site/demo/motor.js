// Motor das demonstrações animadas do site: esperas canceláveis, texto escrito aos poucos e o
// tocador de cenas. Só mexe no DOM dentro do elemento que recebe; quem monta é o React.
import { ICON_PATHS } from "../../ds/components/core/icon-paths.js";

export const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const CANCEL = Symbol("cancel");
export const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[n]}</svg>`;

/* Contexto de animação cancelável: toda espera rejeita quando a cena é trocada. */
export function makeCtx(tk) {
  const wait = (ms) => new Promise((res, rej) => {
    if (tk.off) return rej(CANCEL);
    if (REDUCED) return res();
    setTimeout(() => (tk.off ? rej(CANCEL) : res()), ms);
  });
  return { tk, wait };
}
export const run = (p) => p.catch((e) => { if (e !== CANCEL) throw e; });

/* Escreve o texto palavra a palavra; "[1]" vira selo de citação e dispara onCite. */
export async function stream(el, text, c, { per = 55, onCite } = {}) {
  for (const p of text.split(/(\s+|\[\d\])/).filter(Boolean)) {
    const m = /^\[(\d)\]$/.exec(p);
    if (m) {
      await c.wait(180);
      el.insertAdjacentHTML("beforeend", `<span class="s-cite">${m[1]}</span>`);
      if (onCite) onCite(+m[1]);
      await c.wait(420);
    } else if (/^\s+$/.test(p)) el.append(" ");
    else { const s = document.createElement("span"); s.className = "w"; s.textContent = p; el.append(s); await c.wait(per); }
  }
}
export async function count(el, to, ms, c, fmt = (n) => n) {
  const steps = REDUCED ? 1 : Math.max(1, Math.round(ms / 40));
  for (let i = 1; i <= steps; i++) { el.textContent = fmt(Math.round((to * i) / steps)); await c.wait(ms / steps); }
}
/* Acende os filhos .vi um a um, segura e recomeça. Devolve a função que desliga. */
export function cycle(el, { step = 650, hold = 2200, sel = ".vi" } = {}) {
  const items = [...el.querySelectorAll(sel)];
  if (REDUCED || !items.length) return () => {};
  let tk = { off: true };
  const loop = async () => {
    const c = makeCtx(tk);
    for (;;) {
      items.forEach((x) => x.classList.remove("on"));
      await c.wait(500);
      for (const x of items) { x.classList.add("on"); await c.wait(step); }
      await c.wait(hold);
    }
  };
  const parar = onView(el, (v) => { tk.off = true; if (v) { tk = { off: false }; run(loop()); } else items.forEach((x) => x.classList.add("on")); });
  return () => { tk.off = true; parar(); };
}
/* Avisa quando o elemento entra e sai da tela. Devolve a função que desliga. */
export function onView(el, cb, opts = { threshold: 0.2 }) {
  if (typeof IntersectionObserver === "undefined") { cb(true); return () => {}; }
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), opts);
  io.observe(el);
  return () => io.disconnect();
}

/* Toca as cenas dentro de uma .tdr-demo: palco em tamanho fixo, escalado como um vídeo.
   O cursor é o glifo mouse-pointer-2 do Lucide, preenchido. */
export function Player(root, opts = {}) {
  const view = root.querySelector(".win-view"), url = root.querySelector(".win-url");
  const stage = document.createElement("div"); stage.className = "stage"; stage.setAttribute("aria-hidden", "true"); view.append(stage);
  const LIST = opts.scenes;
  let tk = { off: true }, idx = opts.start || 0, visible = false, scale = 1;
  const fit = () => {
    const w = view.clientWidth; if (!w) return;
    const compact = w < (opts.compactBelow || 560), W = compact ? 520 : 920, H = compact ? 500 : 520;
    scale = w / W; stage.classList.toggle("compact", compact);
    stage.style.width = W + "px"; stage.style.height = H + "px"; stage.style.transform = `scale(${scale})`; view.style.height = H * scale + "px";
  };
  const ro = new ResizeObserver(fit); ro.observe(view); fit();
  const play = (i) => {
    tk.off = true; tk = { off: false }; idx = (i + LIST.length) % LIST.length;
    const sc = LIST[idx], c = makeCtx(tk), t0 = performance.now();
    stage.innerHTML = opts.side(sc.nav) + `<div class="s-main">${sc.html()}</div><div class="s-cursor" style="opacity:0"><svg width="20" height="20" viewBox="0 0 24 24" fill="#12140F" stroke="#F5F6F1" stroke-width="1.5" stroke-linejoin="round"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg></div>`;
    if (url) url.textContent = sc.url;
    const cur = stage.querySelector(".s-cursor");
    cur.style.transform = `translate(${stage.offsetWidth * 0.6}px, ${stage.offsetHeight * 0.75}px)`;
    Object.assign(c, {
      main: stage.querySelector(".s-main"), $: (s) => stage.querySelector(s), $$: (s) => [...stage.querySelectorAll(s)],
      show: (s) => { const e = stage.querySelector(s); e.hidden = false; e.classList.add("s-pop"); },
      move: async (s) => {
        const e = typeof s === "string" ? stage.querySelector(s) : s, a = e.getBoundingClientRect(), b = stage.getBoundingClientRect();
        cur.style.opacity = 1; cur.style.transform = `translate(${(a.left - b.left + a.width * 0.6) / scale}px, ${(a.top - b.top + a.height * 0.55) / scale}px)`;
        await c.wait(820);
      },
      click: async (s) => { const e = stage.querySelector(s); await c.move(e); cur.classList.add("click"); e.classList.add("press"); await c.wait(300); cur.classList.remove("click"); e.classList.remove("press"); },
      type: async (s, text, per = 60) => { const e = typeof s === "string" ? stage.querySelector(s) : s; e.classList.add("s-caret"); for (const ch of text) { e.append(ch); await c.wait(per); } }
    });
    if (opts.onScene) opts.onScene(idx, sc);
    run((async () => {
      await sc.run(c);
      await c.wait(Math.max(1200, sc.dur - (performance.now() - t0)));
      if (!REDUCED) play(opts.advance === false ? idx : idx + 1);
    })());
  };
  const parar = onView(root, (v) => { visible = v; if (v) play(idx); else tk.off = true; }, { threshold: 0.15 });
  return { destroy: () => { tk.off = true; parar(); ro.disconnect(); stage.remove(); }, play: (i) => { if (i !== idx || tk.off) { idx = i; if (visible) play(i); } }, get index() { return idx; } };
}

