import React from "react";
import { IconButton, MonoLabel } from "./ds/index.js";

const W = 1920;
const H = 1080;
const IDLE_MS = 2500;

const pad = (n) => String(n).padStart(2, "0");

function indexFromHash(total) {
  const m = window.location.hash.match(/^#(\d+)$/);
  if (!m) return 0;
  return Math.min(total - 1, Math.max(0, Number(m[1]) - 1));
}

function useScale() {
  const fit = () => Math.min(window.innerWidth / W, window.innerHeight / H);
  const [scale, setScale] = React.useState(fit);
  React.useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}

// Palco do deck: escala o slide 1920×1080 para caber na janela e cuida da navegação.
export function Deck({ slides }) {
  const total = slides.length;
  const [index, setIndex] = React.useState(() => indexFromHash(total));
  const [idle, setIdle] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);
  const scale = useScale();
  const touch = React.useRef(null);

  const go = React.useCallback((to) => setIndex((i) => Math.min(total - 1, Math.max(0, typeof to === "function" ? to(i) : to))), [total]);
  const next = React.useCallback(() => go((i) => i + 1), [go]);
  const prev = React.useCallback(() => go((i) => i - 1), [go]);

  const toggleFullscreen = React.useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // O número do slide vive no hash (#3), para compartilhar o link de um slide.
  React.useEffect(() => {
    const hash = "#" + (index + 1);
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
  }, [index]);
  React.useEffect(() => {
    const onHash = () => setIndex(indexFromHash(total));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [total]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = e.target instanceof HTMLElement && e.target.closest("button");
      switch (e.key) {
        case "ArrowRight": case "ArrowDown": case "PageDown": next(); break;
        case " ": case "Enter": if (onButton) return; next(); break;
        case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace": prev(); break;
        case "Home": go(0); break;
        case "End": go(total - 1); break;
        case "f": case "F": toggleFullscreen(); break;
        case "n": case "N": setShowNotes((v) => !v); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, total, toggleFullscreen]);

  // Os controles somem depois de um tempo sem movimento.
  React.useEffect(() => {
    let timer;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next(); else prev();
  };

  const current = slides[index];

  return (
    <main className="deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="deck-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {slides.map((s, i) => {
          const Slide = s.Component;
          const active = i === index;
          return (
            <section key={s.label} className={`slide slide--${s.tone}`} aria-label={`${pad(i + 1)} — ${s.label}`} hidden={!active}>
              <Slide active={active} />
            </section>
          );
        })}
      </div>

      {showNotes ? (
        <aside className="deck-notes" aria-label="Notas do apresentador">
          <MonoLabel tone="inverse">Notas · {pad(index + 1)} {current.label}</MonoLabel>
          <span>{current.notes}</span>
        </aside>
      ) : null}

      <nav className="deck-controls" aria-label="Navegação do deck" data-idle={idle}>
        <IconButton icon="chevron-left" label="Slide anterior" variant="inverse" size="lg" disabled={index === 0} onClick={prev} />
        <MonoLabel tone="inverse" size="mono" className="deck-counter" style={{ color: "var(--text-on-inverse-body)" }}>
          {pad(index + 1)} / {pad(total)}
        </MonoLabel>
        <IconButton icon="chevron-right" label="Próximo slide" variant="inverse" size="lg" disabled={index === total - 1} onClick={next} />
        <IconButton icon="message-square" label="Mostrar notas do apresentador" variant="inverse" size="lg" aria-pressed={showNotes} onClick={() => setShowNotes((v) => !v)} />
        <IconButton icon="maximize" label="Alternar tela cheia" variant="inverse" size="lg" onClick={toggleFullscreen} />
      </nav>
      <div className="sr-only" aria-live="polite">Slide {index + 1} de {total}: {current.label}</div>
    </main>
  );
}
