/**
 * <tendra-logo> — Tendra.ai animated logo ("Horas, não semanas").
 *
 * A timer sweeps the outline of the box while the diamond spins into place;
 * when the sweep completes the centre dot locks, a ripple pulses out and the
 * "Tendra.ai" wordmark slides in. 6 s per cycle.
 *
 * In React, prefer <AnimatedLogo> (AnimatedLogo.jsx), which wraps this element.
 *
 * Usage (plain HTML, no build step):
 *   <script type="module" src="tendra-logo-element.js"></script>
 *   <tendra-logo variant="ink"></tendra-logo>      <!-- tinta (default) -->
 *   <tendra-logo variant="paper"></tendra-logo>    <!-- papel -->
 *   <tendra-logo variant="lime"></tendra-logo>     <!-- limão -->
 *
 * Attributes:
 *   variant  "ink" | "paper" | "lime"   colour scheme (default "ink")
 *   once     play a single time and hold the finished logo (default: loop)
 *   paused   do not autoplay
 *   bare     no background / 16:9 stage — just the logo, sized to the element width
 *
 * JS API: play(), pause(), replay(), currentTime (seconds, get/set), duration.
 * Honours prefers-reduced-motion by showing the finished logo statically.
 */

const K = { ink: '#12140F', paper: '#F5F6F1', lime: '#C8F73D', sage: '#6E7268', stateInk: '#4B5046' };

const PALETTES = {
  ink:   { bg: K.ink,   box: K.paper, acc: K.lime, word: K.paper, ai: K.lime },
  paper: { bg: K.paper, box: K.sage,  acc: K.ink,  word: K.ink,   ai: K.sage },
  lime:  { bg: K.lime,  box: K.ink,   acc: K.ink,  word: K.ink,   ai: K.stateInk },
};

const DURATION = 6;
const HOLD_TIME = 5; // fully drawn frame, used for `once` and reduced motion

const Ease = {
  outCubic: (t) => (--t) * t * t + 1,
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
const rp = (t, a, b, e) => { const p = Math.min(1, Math.max(0, (t - a) / (b - a))); return e ? e(p) : p; };
const mix = (a, b, p) => a + (b - a) * p;

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
function ensureFont() {
  if (document.querySelector('link[data-tendra-font]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  link.dataset.tendraFont = '';
  document.head.appendChild(link);
}

const TEMPLATE = `
<style>
  :host { display: block; position: relative; background: var(--tendra-bg); aspect-ratio: 16 / 9; overflow: hidden; contain: content; }
  :host([bare]) { aspect-ratio: auto; overflow: visible; background: none; }
  .stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  :host([bare]) .stage { position: static; display: block; }
  svg { display: block; width: 67.7%; height: auto; overflow: visible; }
  :host([bare]) svg { width: 100%; }
</style>
<div class="stage" part="stage">
  <svg viewBox="-4 0 224 48" role="img" aria-label="Tendra.ai" part="logo">
    <defs><clipPath id="word-clip"><rect class="word-clip" x="58" y="0" width="0" height="48"/></clipPath></defs>
    <rect class="track" x="3" y="3" width="42" height="42" rx="6" fill="none" stroke-width="3.2"/>
    <rect class="sweep" x="3" y="3" width="42" height="42" rx="6" fill="none" stroke-width="3.2" pathLength="100"/>
    <g class="diamond"><rect x="13.5" y="13.5" width="21" height="21" fill="none" stroke-width="3.2"/></g>
    <rect class="ripple" fill="none" stroke-width="1"/>
    <rect class="dot"/>
    <g clip-path="url(#word-clip)">
      <text class="word" x="60" y="34" font-family="Space Grotesk, Helvetica, Arial, sans-serif" font-weight="700"
        font-size="32" letter-spacing="-1">Tendra<tspan class="ai">.ai</tspan></text>
    </g>
  </svg>
</div>`;

class TendraLogo extends HTMLElement {
  static observedAttributes = ['variant', 'paused', 'once'];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = TEMPLATE;
    const q = (s) => root.querySelector(s);
    this._el = {
      svg: q('svg'), track: q('.track'), sweep: q('.sweep'), diamond: q('.diamond'),
      diamondRect: q('.diamond rect'), ripple: q('.ripple'), dot: q('.dot'),
      clip: q('.word-clip'), word: q('.word'), ai: q('.ai'),
    };
    this._t = 0;
    this._playing = false;
    this._visible = true;
    this._raf = 0;
    this._last = 0;
    this._tick = this._tick.bind(this);
    this._reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._onMotionPref = () => this._syncPlayback();
  }

  get duration() { return DURATION; }
  get currentTime() { return this._t; }
  set currentTime(v) { this._t = Math.max(0, Math.min(DURATION, Number(v) || 0)); this._render(); }

  play() { this.removeAttribute('paused'); this._playing = true; this._syncPlayback(); }
  pause() { this._playing = false; this._syncPlayback(); }
  replay() { this._t = 0; this._render(); this.play(); }

  connectedCallback() {
    ensureFont();
    this._applyPalette();
    this._playing = !this.hasAttribute('paused');
    this._reduced.addEventListener('change', this._onMotionPref);
    this._io = new IntersectionObserver(([e]) => { this._visible = e.isIntersecting; this._syncPlayback(); });
    this._io.observe(this);
    this._render();
    this._syncPlayback();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._io?.disconnect();
    this._reduced.removeEventListener('change', this._onMotionPref);
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'variant') this._applyPalette();
    if (name === 'paused') this._playing = !this.hasAttribute('paused');
    this._syncPlayback();
  }

  _applyPalette() {
    const pal = PALETTES[this.getAttribute('variant')] || PALETTES.ink;
    this._pal = pal;
    const e = this._el;
    this.style.setProperty('--tendra-bg', pal.bg);
    e.track.setAttribute('stroke', pal.box);
    e.diamondRect.setAttribute('stroke', pal.acc);
    e.ripple.setAttribute('stroke', pal.acc);
    e.dot.setAttribute('fill', pal.acc);
    e.word.setAttribute('fill', pal.word);
    e.ai.setAttribute('fill', pal.ai);
    this._render();
  }

  _syncPlayback() {
    if (this._reduced.matches) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
      this._t = HOLD_TIME;
      this._render();
      return;
    }
    const run = this._playing && this._visible;
    if (run && !this._raf) {
      this._last = performance.now();
      this._raf = requestAnimationFrame(this._tick);
    } else if (!run && this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  _tick(now) {
    const dt = Math.min(0.1, (now - this._last) / 1000); // avoid jumps after tab switches
    this._last = now;
    let t = this._t + dt;
    if (this.hasAttribute('once') && t >= HOLD_TIME) {
      this._t = HOLD_TIME;
      this._playing = false;
      this._raf = 0;
      this._render();
      this.dispatchEvent(new Event('ended'));
      return;
    }
    this._t = t % DURATION;
    this._render();
    this._raf = requestAnimationFrame(this._tick);
  }

  _render() {
    const t = this._t, pal = this._pal, e = this._el;
    if (!pal) return;

    // Whole logo fades out at the end of the cycle
    e.svg.style.opacity = 1 - rp(t, 5.6, 6);

    // Faint track of the box outline
    e.track.setAttribute('opacity', 0.16 * rp(t, 0.1, 0.5));

    // Timer sweep around the box (accent), turning into the box colour when complete
    const p = rp(t, 0.4, 2.7, Ease.inOutQuart);
    const done = t >= 2.7;
    if (p > 0) {
      e.sweep.style.display = '';
      e.sweep.setAttribute('stroke', done ? pal.box : pal.acc);
      e.sweep.setAttribute('stroke-dasharray', p >= 1 ? 'none' : '100');
      e.sweep.setAttribute('stroke-dashoffset', p >= 1 ? 0 : 100 * (1 - p));
    } else {
      e.sweep.style.display = 'none';
    }

    // Diamond spins (-405° → 45°) and grows into place
    const dp = rp(t, 0.3, 2.7, Ease.inOutQuart);
    e.diamond.setAttribute('transform',
      `translate(24 24) rotate(${mix(-405, 45, dp)}) scale(${mix(0.4, 1, dp)}) translate(-24 -24)`);
    e.diamond.setAttribute('opacity', rp(dp, 0, 0.3));

    // Ripple when the timer completes
    const rpP = rp(t, 2.7, 3.4, Ease.outCubic), k = 6 * rpP;
    if (t > 2.7 && rpP < 1) {
      e.ripple.style.display = '';
      e.ripple.setAttribute('x', 3 - k);
      e.ripple.setAttribute('y', 3 - k);
      e.ripple.setAttribute('width', 42 + 2 * k);
      e.ripple.setAttribute('height', 42 + 2 * k);
      e.ripple.setAttribute('rx', 6 + k);
      e.ripple.setAttribute('opacity', 1 - rpP);
    } else {
      e.ripple.style.display = 'none';
    }

    // Centre dot locks: round → square, with overshoot
    const lock = rp(t, 2.7, 3.15, Ease.outBack);
    const w = 8 * lock;
    if (w > 0.01) {
      e.dot.style.display = '';
      e.dot.setAttribute('x', 24 - w / 2);
      e.dot.setAttribute('y', 24 - w / 2);
      e.dot.setAttribute('width', w);
      e.dot.setAttribute('height', w);
      e.dot.setAttribute('rx', Math.max(0, mix(4, 0, lock)));
    } else {
      e.dot.style.display = 'none';
    }

    // Wordmark slides in behind a left-to-right reveal
    const wp = rp(t, 3.4, 4.2, Ease.outCubic);
    e.clip.setAttribute('width', 158 * wp);
    e.word.setAttribute('x', 60 - 10 * (1 - wp));
    e.word.setAttribute('opacity', wp);
  }
}

if (!customElements.get('tendra-logo')) customElements.define('tendra-logo', TendraLogo);

export { TendraLogo, PALETTES, DURATION };
