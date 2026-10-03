window.TDR = window.TDR || {};
(function(){
// Lucide (ISC) — copiado de assets/icons/ em tempo de build do design system.
// Não edite à mão: regenere a partir dos SVGs em assets/icons/ (removendo <metadata>).
const ICON_PATHS = {
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>",
  "arrow-up-right": "<path d=\"M7 7h10v10\"></path> <path d=\"M7 17 17 7\"></path>",
  "bell": "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"></path> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"></path>",
  "book-open": "<path d=\"M12 7v14\"></path> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"></path>",
  "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"></path> <path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"></path> <path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"></path> <path d=\"M10 6h4\"></path> <path d=\"M10 10h4\"></path> <path d=\"M10 14h4\"></path> <path d=\"M10 18h4\"></path>",
  "calendar": "<path d=\"M8 2v4\"></path> <path d=\"M16 2v4\"></path> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"></rect> <path d=\"M3 10h18\"></path>",
  "check-check": "<path d=\"M18 6 7 17l-5-5\"></path> <path d=\"m22 10-7.5 7.5L13 16\"></path>",
  "check": "<path d=\"M20 6 9 17l-5-5\"></path>",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\"></path>",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\"></path>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"></path>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"></line> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"></line>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"m9 12 2 2 4-4\"></path>",
  "clock": "<path d=\"M12 6v6l4 2\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"></rect> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"></path>",
  "database": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"></ellipse> <path d=\"M3 5V19A9 3 0 0 0 21 19V5\"></path> <path d=\"M3 12A9 3 0 0 0 21 12\"></path>",
  "download": "<path d=\"M12 15V3\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path> <path d=\"m7 10 5 5 5-5\"></path>",
  "external-link": "<path d=\"M15 3h6v6\"></path> <path d=\"M10 14 21 3\"></path> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path>",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"></path> <circle cx=\"12\" cy=\"12\" r=\"3\"></circle>",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"></path> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\"></path> <path d=\"M10 9H8\"></path> <path d=\"M16 13H8\"></path> <path d=\"M16 17H8\"></path>",
  "filter": "<path d=\"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z\"></path>",
  "folder": "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"></path>",
  "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"></path> <path d=\"M3 3v5h5\"></path> <path d=\"M12 7v5l4 2\"></path>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 16v-4\"></path> <path d=\"M12 8h.01\"></path>",
  "key-round": "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\"></path> <circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"></circle>",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"></rect> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"></rect> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"></rect> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"></rect>",
  "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"></path> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"></path>",
  "list": "<path d=\"M3 5h.01\"></path> <path d=\"M3 12h.01\"></path> <path d=\"M3 19h.01\"></path> <path d=\"M8 5h13\"></path> <path d=\"M8 12h13\"></path> <path d=\"M8 19h13\"></path>",
  "loader-circle": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\"></path>",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"></rect> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\"></path>",
  "menu": "<path d=\"M4 5h16\"></path> <path d=\"M4 12h16\"></path> <path d=\"M4 19h16\"></path>",
  "message-square": "<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\"></path>",
  "minus": "<path d=\"M5 12h14\"></path>",
  "more-horizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\"></circle> <circle cx=\"19\" cy=\"12\" r=\"1\"></circle> <circle cx=\"5\" cy=\"12\" r=\"1\"></circle>",
  "panel-left": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"></rect> <path d=\"M9 3v18\"></path>",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path> <path d=\"m15 5 4 4\"></path>",
  "play": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"></path>",
  "plus": "<path d=\"M5 12h14\"></path> <path d=\"M12 5v14\"></path>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"></path> <path d=\"M21 3v5h-5\"></path> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"></path> <path d=\"M8 16H3v5\"></path>",
  "search": "<path d=\"m21 21-4.34-4.34\"></path> <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>",
  "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\"></path> <path d=\"m21.854 2.147-10.94 10.939\"></path>",
  "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"></path> <circle cx=\"12\" cy=\"12\" r=\"3\"></circle>",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"></path> <path d=\"m9 12 2 2 4-4\"></path>",
  "sparkles": "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"></path> <path d=\"M20 2v4\"></path> <path d=\"M22 4h-4\"></path> <circle cx=\"4\" cy=\"20\" r=\"2\"></circle>",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"></path>",
  "thumbs-up": "<path d=\"M7 10v12\"></path> <path d=\"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z\"></path>",
  "trash-2": "<path d=\"M10 11v6\"></path> <path d=\"M14 11v6\"></path> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path> <path d=\"M3 6h18\"></path> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"></path> <path d=\"M12 9v4\"></path> <path d=\"M12 17h.01\"></path>",
  "upload": "<path d=\"M12 3v12\"></path> <path d=\"m17 8-5-5-5 5\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"></path> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"></path> <circle cx=\"9\" cy=\"7\" r=\"4\"></circle>",
  "x": "<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>"
};

const ICON_NAMES = Object.keys(ICON_PATHS);

Object.assign(window.TDR, {ICON_PATHS,ICON_NAMES});
})();
(function(){
const {ICON_PATHS} = window.TDR;



const SIZES = { sm: 14, md: 16, lg: 20, xl: 24 };

function Icon({ name, size = "md", color = "currentColor", strokeWidth = 2, style, ...rest }) {
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const inner = ICON_PATHS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none", display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
      {...rest}
    />
  );
}

Object.assign(window.TDR, {Icon});
})();
(function(){


const PALETTES = {
  paper: { frame: "var(--brand-sage)", diamond: "var(--brand-ink)", core: "var(--brand-ink)", word: "var(--brand-ink)", accent: "var(--brand-sage)" },
  ink: { frame: "var(--brand-paper)", diamond: "var(--brand-lime)", core: "var(--brand-lime)", word: "var(--brand-paper)", accent: "var(--brand-lime)" },
  "mono-ink": { frame: "var(--brand-ink)", diamond: "var(--brand-ink)", core: "var(--brand-ink)", word: "var(--brand-ink)", accent: "var(--brand-ink)" },
  "mono-paper": { frame: "var(--brand-paper)", diamond: "var(--brand-paper)", core: "var(--brand-paper)", word: "var(--brand-paper)", accent: "var(--brand-paper)" }
};

function BrandSymbol({ size, p }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" style={{ flex: "none", display: "block" }} aria-hidden="true">
      <rect x="3" y="3" width="42" height="42" rx="6" stroke={p.frame} strokeWidth="3.2" />
      <rect x="13.5" y="13.5" width="21" height="21" transform="rotate(45 24 24)" stroke={p.diamond} strokeWidth="3.2" />
      <rect x="20" y="20" width="8" height="8" fill={p.core} />
    </svg>
  );
}

function Logo({ variant = "paper", size = 32, lockup = "horizontal", title = "Tendra.ai", style, ...rest }) {
  const p = PALETTES[variant] || PALETTES.paper;

  if (lockup === "appicon") {
    const field = variant === "ink" ? "var(--brand-ink)" : variant === "mono-paper" ? "var(--brand-paper)" : "var(--brand-ink)";
    const stroke = variant === "mono-paper" ? "var(--brand-sage)" : "var(--brand-lime)";
    const core = variant === "mono-paper" ? "var(--brand-ink)" : "var(--brand-paper)";
    return (
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" role="img" aria-label={title} style={{ flex: "none", display: "block", ...style }} {...rest}>
        <rect width="48" height="48" rx="12" fill={field} />
        <rect x="14" y="14" width="20" height="20" transform="rotate(45 24 24)" stroke={stroke} strokeWidth="3.5" />
        <rect x="21" y="21" width="6" height="6" fill={core} />
      </svg>
    );
  }

  if (lockup === "symbol") {
    return (
      <span role="img" aria-label={title} style={{ display: "inline-flex", ...style }} {...rest}>
        <BrandSymbol size={size} p={p} />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={title}
      style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.3), ...style }}
      {...rest}
    >
      <BrandSymbol size={size} p={p} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--weight-bold)",
          fontSize: Math.round(size * 0.66),
          letterSpacing: "-0.025em",
          color: p.word,
          whiteSpace: "nowrap"
        }}
      >
        Tendra<span style={{ color: p.accent }}>.ai</span>
      </span>
    </span>
  );
}

Object.assign(window.TDR, {Logo});
})();
(function(){


const TONES = {
  default: "var(--text-meta)",
  strong: "var(--text-body)",
  sage: "var(--brand-sage)",
  state: "var(--text-state)",
  inverse: "var(--text-on-inverse-meta)",
  accent: "var(--brand-lime)"
};

function MonoLabel({ children, tone = "default", uppercase = true, size = "label", as = "span", style, ...rest }) {
  const Tag = as;
  const isLabel = size === "label";
  return (
    <Tag
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: isLabel ? "var(--text-label-size)" : "var(--text-mono-size)",
        lineHeight: isLabel ? "var(--text-label-lh)" : "var(--text-mono-lh)",
        letterSpacing: isLabel ? "var(--text-label-ls)" : "var(--text-mono-ls)",
        textTransform: uppercase ? "uppercase" : "none",
        color: TONES[tone] || TONES.default,
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Object.assign(window.TDR, {MonoLabel});
})();
(function(){
const {Icon} = window.TDR;



const SIZES = {
  sm: { fontSize: "var(--text-sm-size)", padding: "8px 14px", minHeight: 36, gap: 6, icon: 14 },
  md: { fontSize: "var(--text-ui-size)", padding: "12px 18px", minHeight: "var(--hit-min)", gap: 8, icon: 16 },
  lg: { fontSize: "var(--text-body-size)", padding: "15px 24px", minHeight: 52, gap: 10, icon: 20 }
};

const VARIANTS = {
  primary: {
    rest: { background: "var(--action-primary-bg)", color: "var(--action-primary-fg)", border: "1px solid var(--action-primary-bg)" },
    hover: { background: "var(--action-primary-bg-hover)", borderColor: "var(--action-primary-bg-hover)" }
  },
  secondary: {
    rest: { background: "transparent", color: "var(--action-secondary-fg)", border: "1px solid var(--action-secondary-border)" },
    hover: { borderColor: "var(--brand-ink)" }
  },
  accent: {
    rest: { background: "var(--action-accent-bg)", color: "var(--action-accent-fg)", border: "1px solid var(--action-accent-bg)" },
    hover: { background: "#B6E22C", borderColor: "#B6E22C" }
  },
  ghost: {
    rest: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
    hover: { background: "var(--surface-sunken)", color: "var(--text-strong)" }
  },
  "inverse-secondary": {
    rest: { background: "transparent", color: "var(--text-on-inverse-body)", border: "1px solid var(--border-inverse-strong)" },
    hover: { borderColor: "var(--n-400)", color: "var(--text-on-inverse)" }
  },
  danger: {
    rest: { background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)" },
    hover: { background: "var(--danger)", color: "var(--n-000)" }
  }
};

function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;

  return (
    <button
      type={type}
      disabled={off}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-semibold)",
        fontSize: s.fontSize,
        lineHeight: 1.2,
        padding: s.padding,
        minHeight: s.minHeight,
        borderRadius: "var(--radius-md)",
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        cursor: off ? "not-allowed" : "pointer",
        opacity: off ? 0.42 : 1,
        transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
        ...v.rest,
        ...(hover && !off ? v.hover : null),
        ...style
      }}
      {...rest}
    >
      {loading ? (
        <Icon name="loader-circle" size={s.icon} style={{ animation: "tdr-spin 900ms linear infinite" }} />
      ) : icon ? (
        <Icon name={icon} size={s.icon} />
      ) : null}
      {children}
      {iconEnd && !loading ? <Icon name={iconEnd} size={s.icon} /> : null}
    </button>
  );
}

Object.assign(window.TDR, {Button});
})();
(function(){
const {Icon} = window.TDR;



const SIZES = { sm: { box: 32, icon: 14 }, md: { box: 40, icon: 16 }, lg: { box: 44, icon: 20 } };

const VARIANTS = {
  ghost: { rest: { background: "transparent", border: "1px solid transparent", color: "var(--text-body)" }, hover: { background: "var(--surface-sunken)", color: "var(--text-strong)" } },
  outline: { rest: { background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-body)" }, hover: { borderColor: "var(--border-strong)", color: "var(--text-strong)" } },
  solid: { rest: { background: "var(--action-primary-bg)", border: "1px solid var(--action-primary-bg)", color: "var(--action-primary-fg)" }, hover: { background: "var(--action-primary-bg-hover)" } },
  inverse: { rest: { background: "transparent", border: "1px solid transparent", color: "var(--text-on-inverse-body)" }, hover: { background: "var(--paper-wash)", color: "var(--text-on-inverse)" } }
};

function IconButton({ icon, label, variant = "ghost", size = "md", disabled = false, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.ghost;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: s.box,
        height: s.box,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.42 : 1,
        transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
        ...v.rest,
        ...(hover && !disabled ? v.hover : null),
        ...style
      }}
      {...rest}
    >
      <Icon name={icon} size={s.icon} />
    </button>
  );
}

Object.assign(window.TDR, {IconButton});
})();
(function(){
const {Icon} = window.TDR;



const TONES = {
  neutral: { background: "var(--surface-sunken)", border: "1px solid var(--border-strong)", color: "var(--text-body)" },
  approved: { background: "var(--lime-wash)", border: "1px solid var(--brand-lime)", color: "var(--text-state)" },
  "approved-inverse": { background: "var(--lime-wash)", border: "1px solid var(--brand-lime)", color: "var(--brand-lime)" },
  accent: { background: "var(--brand-lime)", border: "1px solid var(--brand-lime)", color: "var(--brand-ink)" },
  ink: { background: "var(--brand-ink)", border: "1px solid var(--brand-ink)", color: "var(--brand-paper)" },
  inverse: { background: "var(--paper-wash)", border: "1px solid var(--ink-300)", color: "var(--text-on-inverse-body)" },
  danger: { background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)" }
};

function Badge({ children, tone = "neutral", icon, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label-size)",
        lineHeight: 1.3,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        padding: "5px 9px",
        borderRadius: "var(--radius-xs)",
        whiteSpace: "nowrap",
        ...t,
        ...style
      }}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

Object.assign(window.TDR, {Badge});
})();
(function(){
const {Icon} = window.TDR;



function Tag({ children, onRemove, removeLabel = "Remover", tone = "default", style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const inverse = tone === "inverse";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm-size)",
        fontWeight: "var(--weight-medium)",
        lineHeight: 1.3,
        padding: onRemove ? "6px 8px 6px 12px" : "6px 12px",
        borderRadius: "var(--radius-pill)",
        background: inverse ? "var(--paper-wash)" : "var(--surface-sunken)",
        border: inverse ? "1px solid var(--border-inverse-strong)" : "1px solid var(--border-default)",
        color: inverse ? "var(--text-on-inverse-body)" : "var(--text-body)",
        ...style
      }}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            border: 0,
            padding: 0,
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
            background: hover ? (inverse ? "var(--ink-500)" : "var(--border-default)") : "transparent",
            color: "inherit",
            transition: "background var(--duration-fast) var(--ease-out)"
          }}
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </span>
  );
}

Object.assign(window.TDR, {Tag});
})();
(function(){


const TONES = {
  paper: { background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-body)" },
  sunken: { background: "var(--surface-sunken)", border: "1px solid var(--border-default)", color: "var(--text-body)" },
  ink: { background: "var(--surface-inverse)", border: "1px solid var(--surface-inverse)", color: "var(--text-on-inverse-body)" },
  "ink-panel": { background: "var(--surface-inverse-card)", border: "1px solid var(--border-inverse)", color: "var(--text-on-inverse-body)" },
  accent: { background: "var(--brand-lime)", border: "1px solid var(--brand-lime)", color: "var(--brand-ink)" }
};

const PADS = { none: 0, sm: "var(--space-5)", md: "var(--gutter-card)", lg: "var(--gutter-card-lg)" };

function Card({ children, tone = "paper", padding = "md", radius = "xl", accentTop, as = "div", style, ...rest }) {
  const Tag = as;
  const t = TONES[tone] || TONES.paper;
  return (
    <Tag
      style={{
        borderRadius: `var(--radius-${radius})`,
        padding: PADS[padding] !== undefined ? PADS[padding] : PADS.md,
        ...t,
        ...(accentTop ? { borderTop: `var(--border-width-accent) solid ${accentTop}` } : null),
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Object.assign(window.TDR, {Card});
})();
(function(){


function Divider({ orientation = "horizontal", tone = "default", style, ...rest }) {
  const color = tone === "inverse" ? "var(--border-inverse)" : tone === "subtle" ? "var(--border-subtle)" : "var(--border-default)";
  const vertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      style={{
        background: color,
        width: vertical ? 1 : "100%",
        height: vertical ? "100%" : 1,
        flex: "none",
        ...style
      }}
      {...rest}
    />
  );
}

Object.assign(window.TDR, {Divider});
})();
(function(){
const {MonoLabel} = window.TDR;



function ProgressBar({ value = 0, label, showValue = true, tone = "paper", animate = true, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, value));
  const inverse = tone === "ink";
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", ...style }} {...rest}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)" }}>
          <MonoLabel tone={inverse ? "inverse" : "default"}>{label}</MonoLabel>
          {showValue ? (
            <MonoLabel tone={inverse ? "accent" : "state"}>{pct}%</MonoLabel>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : undefined}
        style={{
          height: 6,
          borderRadius: "var(--radius-pill)",
          background: inverse ? "var(--ink-600)" : "var(--border-default)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            width: pct + "%",
            borderRadius: "var(--radius-pill)",
            background: inverse ? "var(--brand-lime)" : "var(--brand-sage)",
            animation: animate ? "tdr-fill var(--duration-fill) var(--ease-out) both" : undefined
          }}
        />
      </div>
    </div>
  );
}

Object.assign(window.TDR, {ProgressBar});
})();
(function(){
const {Icon} = window.TDR;



function Field({ label, hint, error, required = false, htmlFor, children, style, ...rest }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2)", ...style }} {...rest}>
      {label ? (
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm-size)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-strong)"
          }}
        >
          {label}
          {required ? <span style={{ color: "var(--brand-sage)", marginLeft: 4 }}>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", color: "var(--danger)" }}>
          <Icon name="circle-alert" size="sm" />
          {error}
        </div>
      ) : hint ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-meta)" }}>{hint}</div>
      ) : null}
    </div>
  );
}

Object.assign(window.TDR, {Field});
})();
(function(){
const {Icon} = window.TDR;



const SIZES = { sm: { padding: "8px 12px", minHeight: 36, fontSize: "var(--text-sm-size)" }, md: { padding: "11px 14px", minHeight: "var(--hit-min)", fontSize: "var(--text-ui-size)" } };

function Input({ size = "md", icon, invalid = false, disabled = false, mono = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      {icon ? (
        <span style={{ position: "absolute", left: 13, display: "flex", color: "var(--text-meta)", pointerEvents: "none" }}>
          <Icon name={icon} size="md" />
        </span>
      ) : null}
      <input
        disabled={disabled}
        onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
        {...rest}
        style={{
          width: "100%",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: s.fontSize,
          lineHeight: 1.4,
          color: "var(--text-strong)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          padding: icon ? `${s.padding.split(" ")[0]} 14px ${s.padding.split(" ")[0]} 40px` : s.padding,
          minHeight: s.minHeight,
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
          transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
          cursor: disabled ? "not-allowed" : "text"
        }}
      />
    </div>
  );
}

Object.assign(window.TDR, {Input});
})();
(function(){
const {Icon} = window.TDR;



function Select({ options = [], size = "md", invalid = false, disabled = false, placeholder, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      <select
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        {...rest}
        style={{
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
          fontFamily: "var(--font-sans)",
          fontSize: size === "sm" ? "var(--text-sm-size)" : "var(--text-ui-size)",
          lineHeight: 1.4,
          color: "var(--text-strong)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          padding: size === "sm" ? "8px 36px 8px 12px" : "11px 40px 11px 14px",
          minHeight: size === "sm" ? 36 : "var(--hit-min)",
          border: `1px solid ${border}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
          transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)"
        }}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: 13, display: "flex", color: "var(--text-meta)", pointerEvents: "none" }}>
        <Icon name="chevron-down" size="md" />
      </span>
    </div>
  );
}

Object.assign(window.TDR, {Select});
})();
(function(){
const {Icon} = window.TDR;



function Checkbox({ label, description, checked, indeterminate = false, disabled = false, onChange, style, ...rest }) {
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: description ? "flex-start" : "center",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        minHeight: "var(--hit-min)",
        ...style
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={onChange}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, margin: 0 }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          flex: "none",
          marginTop: description ? 2 : 0,
          borderRadius: "var(--radius-xs)",
          border: on ? "1px solid var(--brand-ink)" : "1px solid var(--border-strong)",
          background: on ? "var(--brand-ink)" : "var(--surface-card)",
          color: "var(--brand-lime)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)"
        }}
      >
        {indeterminate ? <Icon name="minus" size={14} /> : checked ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}
      </span>
      {(label || description) && (
        <span style={{ display: "grid", gap: 2 }}>
          {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", color: "var(--text-strong)" }}>{label}</span> : null}
          {description ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm-size)", lineHeight: 1.5, color: "var(--text-meta)" }}>{description}</span> : null}
        </span>
      )}
    </label>
  );
}

Object.assign(window.TDR, {Checkbox});
})();
(function(){
const {Icon} = window.TDR;



function Tabs({ items = [], value, onChange, tone = "paper", style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  const inverse = tone === "ink";
  const active = value != null ? value : items[0] && items[0].value;
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-6)",
        borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
        ...style
      }}
      {...rest}
    >
      {items.map((it) => {
        const on = it.value === active;
        const hot = hover === it.value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange && onChange(it.value)}
            onMouseEnter={() => setHover(it.value)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: 0,
              padding: "0 0 12px",
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-ui-size)",
              fontWeight: on ? "var(--weight-semibold)" : "var(--weight-medium)",
              color: on
                ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
                : hot ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
                : inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
              borderBottom: on
                ? `2px solid ${inverse ? "var(--brand-lime)" : "var(--brand-ink)"}`
                : "2px solid transparent",
              transition: "color var(--duration-fast) var(--ease-out)"
            }}
          >
            {it.icon ? <Icon name={it.icon} size="md" /> : null}
            {it.label}
            {it.count != null ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-size)", color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)" }}>
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window.TDR, {Tabs});
})();
(function(){
const {Logo,Button} = window.TDR;




const LINKS = ["Produto", "Preços"];

function SiteHeader({ page, onPage, tone = "paper" }) {
  const inverse = tone === "ink";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
        borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)"
      }}
    >
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-4) var(--page-pad)", display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onPage("home"); }} style={{ display: "flex", textDecoration: "none" }}>
          <Logo variant={inverse ? "ink" : "paper"} size={30} />
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", marginLeft: "auto" }}>
          {LINKS.map((l) => {
            const key = l === "Segurança" ? "seguranca" : l === "Preços" ? "precos" : "home";
            const on = page === key && key !== "home";
            return (
              <a
                key={l}
                href="#"
                onClick={(e) => { e.preventDefault(); onPage(key); }}
                style={{
                  fontSize: "var(--text-ui-size)",
                  fontWeight: on ? "var(--weight-semibold)" : "var(--weight-regular)",
                  color: inverse ? "var(--text-on-inverse-body)" : on ? "var(--text-strong)" : "var(--text-body)",
                  textDecoration: "none"
                }}
              >
                {l}
              </a>
            );
          })}
          <Button size="sm" variant={inverse ? "accent" : "primary"}>Falar com vendas</Button>
        </nav>
      </div>
    </header>
  );
}

Object.assign(window.TDR, {SiteHeader});
})();
(function(){
const {Logo,MonoLabel} = window.TDR;




const COLS = [
  { t: "Produto", items: ["Automação de RFP", "Base de respostas", "Trilha de auditoria", "Integrações"] },
  { t: "Confiança", items: ["Segurança", "SOC 2 Tipo II", "LGPD", "Status"] },
  { t: "Empresa", items: ["Sobre", "Clientes", "Carreiras", "Contato"] }
];

function SiteFooter() {
  return (
    <footer style={{ background: "var(--surface-inverse)", color: "var(--text-on-inverse-body)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--space-16) var(--page-pad) var(--space-8)", display: "grid", gap: "var(--space-12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", gap: "var(--space-10)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)", alignContent: "start" }}>
            <Logo variant="ink" size={30} />
            <p style={{ margin: 0, fontSize: "var(--text-sm-size)", lineHeight: 1.6, color: "var(--text-on-inverse-meta)", maxWidth: "34ch", textWrap: "pretty" }}>
              O cérebro comercial e técnico da sua operação de licitações e RFPs.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.t} style={{ display: "grid", gap: "var(--space-3)", alignContent: "start" }}>
              <MonoLabel tone="inverse">{c.t}</MonoLabel>
              {c.items.map((i) => (
                <a key={i} href="#" style={{ fontSize: "var(--text-sm-size)", color: "var(--text-on-inverse-body)", textDecoration: "none" }}>{i}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border-inverse)", paddingTop: "var(--space-5)", display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <MonoLabel tone="inverse">© 2026 Tendra.ai · São Paulo</MonoLabel>
          <MonoLabel tone="inverse">brand@tendra.ai</MonoLabel>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window.TDR, {SiteFooter});
})();
(function(){
const {Card,Badge,Button,Icon,MonoLabel,Divider,ProgressBar,SourceTrail} = window.TDR;










const Section = ({ children, tone, style }) => (
  <section style={{ background: tone === "ink" ? "var(--surface-inverse)" : tone === "sunken" ? "var(--surface-sunken)" : "transparent", ...style }}>
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "var(--gutter-section) var(--page-pad)" }}>{children}</div>
  </section>
);

function HomePage({ onPage }) {
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

Object.assign(window.TDR, {HomePage});
})();
(function(){
const {Card,Badge,Button,Icon,MonoLabel,Divider} = window.TDR;








const PLANS = [
  { t: "Equipe", p: "R$ 4.900", per: "/mês", d: "Até 5 revisores e 20 editais por trimestre.", cta: "Começar", feats: ["Base de respostas", "Trilha de fonte", "Exportação em Word e Excel", "Suporte por e-mail"] },
  { t: "Enterprise", p: "Sob consulta", per: "", d: "Volume ilimitado, SSO e revisão nominal obrigatória.", cta: "Falar com vendas", featured: true, feats: ["Tudo do Equipe", "SSO SAML + SCIM", "Trilha de auditoria exportável", "Isolamento por tenant", "Gerente de conta dedicado"] },
  { t: "Setor público", p: "Sob consulta", per: "", d: "Licitações, pregões e dispensas com exigências formais.", cta: "Falar com vendas", feats: ["Tudo do Enterprise", "Modelos de edital público", "Residência de dados no Brasil"] }
];

function PricingPage() {
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

Object.assign(window.TDR, {PricingPage});
})();
(function(){
const {SiteHeader,SiteFooter,HomePage,PricingPage} = window.TDR;






function WebsiteApp() {
  const [page, setPage] = React.useState("home");
  React.useEffect(() => { window.scrollTo(0, 0); }, [page]);
  return (
    <div style={{ background: "var(--surface-page)", minHeight: "100%" }}>
      <SiteHeader page={page} onPage={setPage} />
      {page === "home" ? <HomePage onPage={setPage} /> : null}
      {page === "precos" ? <PricingPage /> : null}
      <SiteFooter />
    </div>
  );
}

Object.assign(window.TDR, {WebsiteApp});
})();
window.TendraSite = window.TDR.WebsiteApp;
