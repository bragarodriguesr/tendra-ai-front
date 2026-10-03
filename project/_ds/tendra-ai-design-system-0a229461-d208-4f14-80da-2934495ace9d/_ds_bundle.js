/* @ds-bundle: {"format":4,"namespace":"TendraAiDesignSystem_0a2294","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"MonoLabel","sourcePath":"components/core/MonoLabel.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"ICON_PATHS","sourcePath":"components/core/icon-paths.js"},{"name":"ICON_NAMES","sourcePath":"components/core/icon-paths.js"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"SourceTrail","sourcePath":"components/feedback/SourceTrail.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"HomePage","sourcePath":"ui_kits/website/HomePage.jsx"},{"name":"PricingPage","sourcePath":"ui_kits/website/PricingPage.jsx"},{"name":"SecurityPage","sourcePath":"ui_kits/website/SecurityPage.jsx"},{"name":"SiteFooter","sourcePath":"ui_kits/website/SiteFooter.jsx"},{"name":"SiteHeader","sourcePath":"ui_kits/website/SiteHeader.jsx"},{"name":"WebsiteApp","sourcePath":"ui_kits/website/WebsiteApp.jsx"},{"name":"KnowledgeScreen","sourcePath":"ui_kits/workspace/KnowledgeScreen.jsx"},{"name":"RequirementScreen","sourcePath":"ui_kits/workspace/RequirementScreen.jsx"},{"name":"RfpListScreen","sourcePath":"ui_kits/workspace/RfpListScreen.jsx"},{"name":"SettingsScreen","sourcePath":"ui_kits/workspace/SettingsScreen.jsx"},{"name":"Shell","sourcePath":"ui_kits/workspace/Shell.jsx"},{"name":"WorkspaceApp","sourcePath":"ui_kits/workspace/WorkspaceApp.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"23b9a81cb9d0","components/core/Button.jsx":"c7a88767409b","components/core/Card.jsx":"fd29f46b65d0","components/core/Divider.jsx":"033b000cdc7a","components/core/Icon.jsx":"1d385e1c42c1","components/core/IconButton.jsx":"d70beb534463","components/core/Logo.jsx":"8675eb0774ea","components/core/MonoLabel.jsx":"c2834c7f7e70","components/core/ProgressBar.jsx":"ea57bcdba9fc","components/core/Tag.jsx":"92d015b7151a","components/core/icon-paths.js":"975df65bcabe","components/feedback/Dialog.jsx":"f00a5ad0bbef","components/feedback/EmptyState.jsx":"dd1e4836aecf","components/feedback/SourceTrail.jsx":"ac857c3f4589","components/feedback/Toast.jsx":"676ccc4b3fd3","components/feedback/Tooltip.jsx":"4f01c13bc9c1","components/forms/Checkbox.jsx":"0516ef94c83c","components/forms/Field.jsx":"35dd26fd177f","components/forms/Input.jsx":"1d074db18da6","components/forms/Radio.jsx":"c22e56d013cc","components/forms/Select.jsx":"206b8ac232a9","components/forms/Switch.jsx":"44c68435856a","components/forms/Textarea.jsx":"6ad80c403a24","components/navigation/Breadcrumb.jsx":"46f1f1407c26","components/navigation/SidebarNav.jsx":"5841e2fcdca6","components/navigation/Tabs.jsx":"de268d48fabd","components/navigation/TopBar.jsx":"c94bc9b15e78","ui_kits/website/HomePage.jsx":"086a5634774f","ui_kits/website/PricingPage.jsx":"cfb645dea31f","ui_kits/website/SecurityPage.jsx":"bcb3473ac343","ui_kits/website/SiteFooter.jsx":"8798935e97b3","ui_kits/website/SiteHeader.jsx":"12dc228522be","ui_kits/website/WebsiteApp.jsx":"9c59731d6465","ui_kits/workspace/KnowledgeScreen.jsx":"53c5e1529222","ui_kits/workspace/RequirementScreen.jsx":"7a97c1d5d84c","ui_kits/workspace/RfpListScreen.jsx":"54e1972e2071","ui_kits/workspace/SettingsScreen.jsx":"c2c5a93a27f1","ui_kits/workspace/Shell.jsx":"8984ec775cac","ui_kits/workspace/WorkspaceApp.jsx":"deea23375ff8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TendraAiDesignSystem_0a2294 = window.TendraAiDesignSystem_0a2294 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  paper: {
    background: "var(--surface-card)",
    border: "1px solid var(--border-default)",
    color: "var(--text-body)"
  },
  sunken: {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-default)",
    color: "var(--text-body)"
  },
  ink: {
    background: "var(--surface-inverse)",
    border: "1px solid var(--surface-inverse)",
    color: "var(--text-on-inverse-body)"
  },
  "ink-panel": {
    background: "var(--surface-inverse-card)",
    border: "1px solid var(--border-inverse)",
    color: "var(--text-on-inverse-body)"
  },
  accent: {
    background: "var(--brand-lime)",
    border: "1px solid var(--brand-lime)",
    color: "var(--brand-ink)"
  }
};
const PADS = {
  none: 0,
  sm: "var(--space-5)",
  md: "var(--gutter-card)",
  lg: "var(--gutter-card-lg)"
};
function Card({
  children,
  tone = "paper",
  padding = "md",
  radius = "xl",
  accentTop,
  as = "div",
  style,
  ...rest
}) {
  const Tag = as;
  const t = TONES[tone] || TONES.paper;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      borderRadius: `var(--radius-${radius})`,
      padding: PADS[padding] !== undefined ? PADS[padding] : PADS.md,
      ...t,
      ...(accentTop ? {
        borderTop: `var(--border-width-accent) solid ${accentTop}`
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Divider({
  orientation = "horizontal",
  tone = "default",
  style,
  ...rest
}) {
  const color = tone === "inverse" ? "var(--border-inverse)" : tone === "subtle" ? "var(--border-subtle)" : "var(--border-default)";
  const vertical = orientation === "vertical";
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "separator",
    "aria-orientation": orientation,
    style: {
      background: color,
      width: vertical ? 1 : "100%",
      height: vertical ? "100%" : 1,
      flex: "none",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PALETTES = {
  paper: {
    frame: "var(--brand-sage)",
    diamond: "var(--brand-ink)",
    core: "var(--brand-ink)",
    word: "var(--brand-ink)",
    accent: "var(--brand-sage)"
  },
  ink: {
    frame: "var(--brand-paper)",
    diamond: "var(--brand-lime)",
    core: "var(--brand-lime)",
    word: "var(--brand-paper)",
    accent: "var(--brand-lime)"
  },
  "mono-ink": {
    frame: "var(--brand-ink)",
    diamond: "var(--brand-ink)",
    core: "var(--brand-ink)",
    word: "var(--brand-ink)",
    accent: "var(--brand-ink)"
  },
  "mono-paper": {
    frame: "var(--brand-paper)",
    diamond: "var(--brand-paper)",
    core: "var(--brand-paper)",
    word: "var(--brand-paper)",
    accent: "var(--brand-paper)"
  }
};
function BrandSymbol({
  size,
  p
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 48 48",
    width: size,
    height: size,
    fill: "none",
    style: {
      flex: "none",
      display: "block"
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "42",
    height: "42",
    rx: "6",
    stroke: p.frame,
    strokeWidth: "3.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13.5",
    y: "13.5",
    width: "21",
    height: "21",
    transform: "rotate(45 24 24)",
    stroke: p.diamond,
    strokeWidth: "3.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "20",
    y: "20",
    width: "8",
    height: "8",
    fill: p.core
  }));
}
function Logo({
  variant = "paper",
  size = 32,
  lockup = "horizontal",
  title = "Tendra.ai",
  style,
  ...rest
}) {
  const p = PALETTES[variant] || PALETTES.paper;
  if (lockup === "appicon") {
    const field = variant === "ink" ? "var(--brand-ink)" : variant === "mono-paper" ? "var(--brand-paper)" : "var(--brand-ink)";
    const stroke = variant === "mono-paper" ? "var(--brand-sage)" : "var(--brand-lime)";
    const core = variant === "mono-paper" ? "var(--brand-ink)" : "var(--brand-paper)";
    return /*#__PURE__*/React.createElement("svg", _extends({
      viewBox: "0 0 48 48",
      width: size,
      height: size,
      fill: "none",
      role: "img",
      "aria-label": title,
      style: {
        flex: "none",
        display: "block",
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("rect", {
      width: "48",
      height: "48",
      rx: "12",
      fill: field
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "14",
      width: "20",
      height: "20",
      transform: "rotate(45 24 24)",
      stroke: stroke,
      strokeWidth: "3.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "21",
      y: "21",
      width: "6",
      height: "6",
      fill: core
    }));
  }
  if (lockup === "symbol") {
    return /*#__PURE__*/React.createElement("span", _extends({
      role: "img",
      "aria-label": title,
      style: {
        display: "inline-flex",
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement(BrandSymbol, {
      size: size,
      p: p
    }));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": title,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: Math.round(size * 0.3),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(BrandSymbol, {
    size: size,
    p: p
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: Math.round(size * 0.66),
      letterSpacing: "-0.025em",
      color: p.word,
      whiteSpace: "nowrap"
    }
  }, "Tendra", /*#__PURE__*/React.createElement("span", {
    style: {
      color: p.accent
    }
  }, ".ai")));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/MonoLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  default: "var(--text-meta)",
  strong: "var(--text-body)",
  sage: "var(--brand-sage)",
  state: "var(--text-state)",
  inverse: "var(--text-on-inverse-meta)",
  accent: "var(--brand-lime)"
};
function MonoLabel({
  children,
  tone = "default",
  uppercase = true,
  size = "label",
  as = "span",
  style,
  ...rest
}) {
  const Tag = as;
  const isLabel = size === "label";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: isLabel ? "var(--text-label-size)" : "var(--text-mono-size)",
      lineHeight: isLabel ? "var(--text-label-lh)" : "var(--text-mono-lh)",
      letterSpacing: isLabel ? "var(--text-label-ls)" : "var(--text-mono-ls)",
      textTransform: uppercase ? "uppercase" : "none",
      color: TONES[tone] || TONES.default,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { MonoLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/MonoLabel.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  label,
  showValue = true,
  tone = "paper",
  animate = true,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: inverse ? "inverse" : "default"
  }, label), showValue ? /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: inverse ? "accent" : "state"
  }, pct, "%") : null), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": pct,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": typeof label === "string" ? label : undefined,
    style: {
      height: 6,
      borderRadius: "var(--radius-pill)",
      background: inverse ? "var(--ink-600)" : "var(--border-default)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: pct + "%",
      borderRadius: "var(--radius-pill)",
      background: inverse ? "var(--brand-lime)" : "var(--brand-sage)",
      animation: animate ? "tdr-fill var(--duration-fill) var(--ease-out) both" : undefined
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/icon-paths.js
try { (() => {
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
Object.assign(__ds_scope, { ICON_PATHS, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/icon-paths.js", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24
};
function Icon({
  name,
  size = "md",
  color = "currentColor",
  strokeWidth = 2,
  style,
  ...rest
}) {
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const inner = __ds_scope.ICON_PATHS[name];
  if (!inner) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: px,
    height: px,
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      flex: "none",
      display: "block",
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: inner
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-strong)",
    color: "var(--text-body)"
  },
  approved: {
    background: "var(--lime-wash)",
    border: "1px solid var(--brand-lime)",
    color: "var(--text-state)"
  },
  "approved-inverse": {
    background: "var(--lime-wash)",
    border: "1px solid var(--brand-lime)",
    color: "var(--brand-lime)"
  },
  accent: {
    background: "var(--brand-lime)",
    border: "1px solid var(--brand-lime)",
    color: "var(--brand-ink)"
  },
  ink: {
    background: "var(--brand-ink)",
    border: "1px solid var(--brand-ink)",
    color: "var(--brand-paper)"
  },
  inverse: {
    background: "var(--paper-wash)",
    border: "1px solid var(--ink-300)",
    color: "var(--text-on-inverse-body)"
  },
  danger: {
    background: "transparent",
    border: "1px solid var(--danger)",
    color: "var(--danger)"
  }
};
function Badge({
  children,
  tone = "neutral",
  icon,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    fontSize: "var(--text-sm-size)",
    padding: "8px 14px",
    minHeight: 36,
    gap: 6,
    icon: 14
  },
  md: {
    fontSize: "var(--text-ui-size)",
    padding: "12px 18px",
    minHeight: "var(--hit-min)",
    gap: 8,
    icon: 16
  },
  lg: {
    fontSize: "var(--text-body-size)",
    padding: "15px 24px",
    minHeight: 52,
    gap: 10,
    icon: 20
  }
};
const VARIANTS = {
  primary: {
    rest: {
      background: "var(--action-primary-bg)",
      color: "var(--action-primary-fg)",
      border: "1px solid var(--action-primary-bg)"
    },
    hover: {
      background: "var(--action-primary-bg-hover)",
      borderColor: "var(--action-primary-bg-hover)"
    }
  },
  secondary: {
    rest: {
      background: "transparent",
      color: "var(--action-secondary-fg)",
      border: "1px solid var(--action-secondary-border)"
    },
    hover: {
      borderColor: "var(--brand-ink)"
    }
  },
  accent: {
    rest: {
      background: "var(--action-accent-bg)",
      color: "var(--action-accent-fg)",
      border: "1px solid var(--action-accent-bg)"
    },
    hover: {
      background: "#B6E22C",
      borderColor: "#B6E22C"
    }
  },
  ghost: {
    rest: {
      background: "transparent",
      color: "var(--text-body)",
      border: "1px solid transparent"
    },
    hover: {
      background: "var(--surface-sunken)",
      color: "var(--text-strong)"
    }
  },
  "inverse-secondary": {
    rest: {
      background: "transparent",
      color: "var(--text-on-inverse-body)",
      border: "1px solid var(--border-inverse-strong)"
    },
    hover: {
      borderColor: "var(--n-400)",
      color: "var(--text-on-inverse)"
    }
  },
  danger: {
    rest: {
      background: "transparent",
      color: "var(--danger)",
      border: "1px solid var(--danger)"
    },
    hover: {
      background: "var(--danger)",
      color: "var(--n-000)"
    }
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
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader-circle",
    size: s.icon,
    style: {
      animation: "tdr-spin 900ms linear infinite"
    }
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconEnd && !loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    box: 32,
    icon: 14
  },
  md: {
    box: 40,
    icon: 16
  },
  lg: {
    box: 44,
    icon: 20
  }
};
const VARIANTS = {
  ghost: {
    rest: {
      background: "transparent",
      border: "1px solid transparent",
      color: "var(--text-body)"
    },
    hover: {
      background: "var(--surface-sunken)",
      color: "var(--text-strong)"
    }
  },
  outline: {
    rest: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      color: "var(--text-body)"
    },
    hover: {
      borderColor: "var(--border-strong)",
      color: "var(--text-strong)"
    }
  },
  solid: {
    rest: {
      background: "var(--action-primary-bg)",
      border: "1px solid var(--action-primary-bg)",
      color: "var(--action-primary-fg)"
    },
    hover: {
      background: "var(--action-primary-bg-hover)"
    }
  },
  inverse: {
    rest: {
      background: "transparent",
      border: "1px solid transparent",
      color: "var(--text-on-inverse-body)"
    },
    hover: {
      background: "var(--paper-wash)",
      color: "var(--text-on-inverse)"
    }
  }
};
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  onRemove,
  removeLabel = "Remover",
  tone = "default",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const inverse = tone === "inverse";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
    }
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": removeLabel,
    onClick: onRemove,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      border: 0,
      padding: 0,
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      background: hover ? inverse ? "var(--ink-500)" : "var(--border-default)" : "transparent",
      color: "inherit",
      transition: "background var(--duration-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 12
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  width = 520,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6)",
      animation: "tdr-fade var(--duration-base) var(--ease-out) both",
      zIndex: 40
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === "string" ? title : undefined,
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: width,
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-overlay)",
      animation: "tdr-rise var(--duration-base) var(--ease-out) both",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-4)",
      padding: "var(--gutter-card) var(--gutter-card) var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      flex: 1,
      minWidth: 0
    }
  }, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h2-size)",
      lineHeight: "var(--text-h2-lh)",
      letterSpacing: "var(--text-h2-ls)",
      color: "var(--text-strong)"
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: "var(--text-body)",
      textWrap: "pretty"
    }
  }, description) : null), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Fechar",
    onClick: onClose
  }) : null), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 var(--gutter-card) var(--space-5)"
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--space-3)",
      padding: "var(--space-5) var(--gutter-card)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EmptyState({
  icon = "file-text",
  title,
  description,
  action,
  tone = "paper",
  style,
  ...rest
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "grid",
      gap: "var(--space-4)",
      justifyItems: "center",
      textAlign: "center",
      padding: "var(--space-12) var(--space-6)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-lg)",
      border: inverse ? "1px solid var(--border-inverse-strong)" : "1px solid var(--border-default)",
      color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "xl"
  })), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h3-size)",
      letterSpacing: "-0.02em",
      color: inverse ? "var(--text-on-inverse)" : "var(--text-strong)"
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: inverse ? "var(--text-on-inverse-body)" : "var(--text-body)",
      maxWidth: "42ch",
      textWrap: "pretty"
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)"
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SourceTrail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SourceTrail({
  sources = [],
  tone = "paper",
  label = "Fonte",
  style,
  ...rest
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "var(--space-2)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-size)",
      lineHeight: "var(--text-mono-lh)",
      color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      color: inverse ? "var(--ink-300)" : "var(--brand-sage)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "link",
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, label), sources.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      opacity: 0.6
    }
  }, "\xB7") : null, s.href ? /*#__PURE__*/React.createElement("a", {
    href: s.href,
    style: {
      color: inverse ? "var(--text-on-inverse-body)" : "var(--text-state)",
      textDecoration: "underline",
      textUnderlineOffset: 2
    }
  }, s.file, s.page ? ` · p.${s.page}` : "") : /*#__PURE__*/React.createElement("span", {
    style: {
      color: inverse ? "var(--text-on-inverse-body)" : "var(--text-state)"
    }
  }, s.file, s.page ? ` · p.${s.page}` : ""))));
}
Object.assign(__ds_scope, { SourceTrail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/SourceTrail.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    icon: "info",
    accent: "var(--ink-200)"
  },
  success: {
    icon: "circle-check",
    accent: "var(--brand-lime)"
  },
  warning: {
    icon: "triangle-alert",
    accent: "var(--brand-lime)"
  },
  danger: {
    icon: "circle-alert",
    accent: "#F0836F"
  }
};
function Toast({
  title,
  description,
  tone = "neutral",
  action,
  onClose,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-3)",
      maxWidth: 420,
      padding: "var(--space-4) var(--space-4) var(--space-4) var(--space-5)",
      background: "var(--surface-inverse)",
      border: "1px solid var(--border-inverse)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-overlay)",
      animation: "tdr-rise var(--duration-base) var(--ease-out) both",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      marginTop: 2,
      color: t.accent
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: "md"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 3,
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-on-inverse)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-on-inverse-body)",
      textWrap: "pretty"
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action) : null), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Dispensar",
    variant: "inverse",
    size: "sm",
    onClick: onClose
  }) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  content,
  children,
  placement = "top",
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === "bottom" ? {
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  } : placement === "left" ? {
    right: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  } : placement === "right" ? {
    left: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  } : {
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, rest), children, open ? /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      ...pos,
      zIndex: 30,
      whiteSpace: "nowrap",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.4,
      color: "var(--text-on-inverse)",
      background: "var(--surface-inverse)",
      border: "1px solid var(--border-inverse)",
      borderRadius: "var(--radius-sm)",
      padding: "7px 10px",
      boxShadow: "var(--shadow-popover)",
      animation: "tdr-fade var(--duration-fast) var(--ease-out) both",
      pointerEvents: "none"
    }
  }, content) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  description,
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  style,
  ...rest
}) {
  const on = checked || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: description ? "flex-start" : "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      minHeight: "var(--hit-min)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: onChange
  }, rest, {
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
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
    }
  }, indeterminate ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 14
  }) : checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    strokeWidth: 2.6
  }) : null), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 2
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      color: "var(--text-strong)"
    }
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-meta)"
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, rest), label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-strong)"
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--brand-sage)",
      marginLeft: 4
    }
  }, "*") : null) : null, children, error ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      color: "var(--danger)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-alert",
    size: "sm"
  }), error) : hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-meta)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    padding: "8px 12px",
    minHeight: 36,
    fontSize: "var(--text-sm-size)"
  },
  md: {
    padding: "11px 14px",
    minHeight: "var(--hit-min)",
    fontSize: "var(--text-ui-size)"
  }
};
function Input({
  size = "md",
  icon,
  invalid = false,
  disabled = false,
  mono = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 13,
      display: "flex",
      color: "var(--text-meta)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "md"
  })) : null, /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
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
    }
  })));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  label,
  description,
  checked,
  disabled = false,
  onChange,
  name,
  value,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: description ? "flex-start" : "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      minHeight: "var(--hit-min)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    name: name,
    value: value,
    checked: !!checked,
    disabled: disabled,
    onChange: onChange
  }, rest, {
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 20,
      height: 20,
      flex: "none",
      marginTop: description ? 2 : 0,
      borderRadius: "var(--radius-pill)",
      border: checked ? "6px solid var(--brand-ink)" : "1px solid var(--border-strong)",
      background: "var(--surface-card)",
      transition: "border var(--duration-fast) var(--ease-out)"
    }
  }), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 2
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      color: "var(--text-strong)"
    }
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-meta)"
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  options = [],
  size = "md",
  invalid = false,
  disabled = false,
  placeholder,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
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
    }
  }), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder) : null, options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const label = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, label);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 13,
      display: "flex",
      color: "var(--text-meta)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: "md"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  description,
  checked = false,
  disabled = false,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: description ? "flex-start" : "center",
      gap: "var(--space-4)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      minHeight: "var(--hit-min)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: onChange
  }, rest, {
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 44,
      height: 26,
      flex: "none",
      marginTop: description ? 2 : 0,
      borderRadius: "var(--radius-pill)",
      background: checked ? "var(--brand-ink)" : "var(--border-strong)",
      padding: 3,
      display: "flex",
      justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background var(--duration-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "var(--radius-pill)",
      background: checked ? "var(--brand-lime)" : "var(--surface-card)",
      transition: "background var(--duration-base) var(--ease-out)"
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 2
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      color: "var(--text-strong)"
    }
  }, label) : null, description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-meta)"
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  rows = 4,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const border = invalid ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      width: "100%",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: "var(--text-strong)",
      background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
      padding: "12px 14px",
      border: `1px solid ${border}`,
      borderRadius: "var(--radius-sm)",
      outline: "none",
      resize: "vertical",
      boxShadow: focus && !invalid ? "0 0 0 3px rgba(110,114,104,0.18)" : "none",
      transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Breadcrumb({
  items = [],
  tone = "paper",
  style,
  ...rest
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Trilha",
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      flexWrap: "wrap",
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        color: inverse ? "var(--ink-300)" : "var(--border-strong)"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: "sm"
    })) : null, last || !it.href ? /*#__PURE__*/React.createElement("span", {
      "aria-current": last ? "page" : undefined,
      style: {
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm-size)",
        fontWeight: last ? "var(--weight-semibold)" : "var(--weight-regular)",
        color: last ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)" : inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)"
      }
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href,
      style: {
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm-size)",
        color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
        textDecoration: "none"
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Item({
  item,
  active,
  inverse
}) {
  const [hover, setHover] = React.useState(false);
  const on = active;
  return /*#__PURE__*/React.createElement("a", {
    href: item.href || "#",
    onClick: item.onClick,
    "aria-current": on ? "page" : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      padding: "10px 12px",
      minHeight: "var(--hit-min)",
      borderRadius: "var(--radius-sm)",
      textDecoration: "none",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-ui-size)",
      fontWeight: on ? "var(--weight-semibold)" : "var(--weight-regular)",
      background: on ? inverse ? "var(--paper-wash)" : "var(--surface-sunken)" : hover ? inverse ? "rgba(255,255,255,0.04)" : "var(--n-075)" : "transparent",
      color: on ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)" : inverse ? "var(--text-on-inverse-body)" : "var(--text-body)",
      boxShadow: on ? `inset 2px 0 0 ${inverse ? "var(--brand-lime)" : "var(--brand-ink)"}` : "none",
      transition: "background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)"
    }
  }, item.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon,
    size: "lg"
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, item.label), item.count != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label-size)",
      color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)"
    }
  }, item.count) : null);
}
function SidebarNav({
  groups = [],
  value,
  tone = "paper",
  header,
  footer,
  width = 248,
  style,
  ...rest
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      width,
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)",
      padding: "var(--space-5)",
      background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
      borderRight: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
      ...style
    }
  }, rest), header, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-6)",
      flex: 1,
      alignContent: "start"
    }
  }, groups.map((g, gi) => /*#__PURE__*/React.createElement("div", {
    key: gi,
    style: {
      display: "grid",
      gap: "var(--space-1)"
    }
  }, g.label ? /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: inverse ? "inverse" : "default",
    style: {
      padding: "0 12px 6px"
    }
  }, g.label) : null, (g.items || []).map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.value || it.label,
    item: it,
    active: it.value === value,
    inverse: inverse
  }))))), footer);
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  onChange,
  tone = "paper",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  const inverse = tone === "ink";
  const active = value != null ? value : items[0] && items[0].value;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: "flex",
      gap: "var(--space-6)",
      borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === active;
    const hot = hover === it.value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      type: "button",
      "aria-selected": on,
      onClick: () => onChange && onChange(it.value),
      onMouseEnter: () => setHover(it.value),
      onMouseLeave: () => setHover(null),
      style: {
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
        color: on ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)" : hot ? inverse ? "var(--text-on-inverse)" : "var(--text-strong)" : inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)",
        borderBottom: on ? `2px solid ${inverse ? "var(--brand-lime)" : "var(--brand-ink)"}` : "2px solid transparent",
        transition: "color var(--duration-fast) var(--ease-out)"
      }
    }, it.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: "md"
    }) : null, it.label, it.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label-size)",
        color: inverse ? "var(--text-on-inverse-meta)" : "var(--text-meta)"
      }
    }, it.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TopBar({
  start,
  center,
  end,
  tone = "paper",
  style,
  ...rest
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-6)",
      padding: "var(--space-3) var(--space-6)",
      minHeight: 64,
      background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
      borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      minWidth: 0
    }
  }, start), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      justifyContent: "center"
    }
  }, center), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)"
    }
  }, end));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomePage.jsx
try { (() => {
const Section = ({
  children,
  tone,
  style
}) => /*#__PURE__*/React.createElement("section", {
  style: {
    background: tone === "ink" ? "var(--surface-inverse)" : tone === "sunken" ? "var(--surface-sunken)" : "transparent",
    ...style
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: "var(--page-max)",
    margin: "0 auto",
    padding: "var(--gutter-section) var(--page-pad)"
  }
}, children));
function HomePage({
  onPage
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
      gap: "var(--space-12)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "sage"
  }, "RFP & LICITA\xC7\xD5ES"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: "var(--text-d1-size)",
      lineHeight: "var(--text-d1-lh)",
      letterSpacing: "var(--text-d1-ls)",
      color: "var(--text-strong)",
      maxWidth: "20ch",
      textWrap: "pretty"
    }
  }, "Responda a um RFP em ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--brand-lime)",
      padding: "0 8px"
    }
  }, "horas"), ", n\xE3o semanas."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-lead-size)",
      lineHeight: "var(--text-lead-lh)",
      color: "var(--text-body)",
      maxWidth: "var(--measure-lead)",
      textWrap: "pretty"
    }
  }, "A Tendra.ai l\xEA o edital, cruza com a sua base aprovada e devolve respostas completas \u2014 com a fonte de cada afirma\xE7\xE3o rastre\xE1vel at\xE9 o documento de origem."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    icon: "calendar"
  }, "Agendar demo"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    variant: "secondary",
    iconEnd: "arrow-up-right",
    onClick: () => onPage("seguranca")
  }, "Ver postura de seguran\xE7a")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-6)",
      flexWrap: "wrap",
      paddingTop: "var(--space-2)"
    }
  }, ["SOC 2 TIPO II", "ISO 27001", "LGPD"].map(c => /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    key: c,
    tone: "sage"
  }, c)))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    tone: "ink",
    radius: "3xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "inverse"
  }, "REQ-084/210 \xB7 Banco Aurora"), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved-inverse",
    icon: "check"
  }, "Conformidade OK")), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    tone: "ink-panel",
    radius: "lg",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--ink-200)"
    }
  }, "\u201CDescreva os controles de criptografia de dados em repouso e em tr\xE2nsito.\u201D"), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "inverse"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.62,
      color: "var(--n-075)",
      textWrap: "pretty"
    }
  }, "Dados em repouso cifrados com AES-256, chaves em HSM FIPS 140-2 n\xEDvel 3 com rota\xE7\xE3o a cada 90 dias; tr\xE1fego em TLS 1.3 com ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--brand-lime)"
    }
  }, "perfect forward secrecy"), "."), /*#__PURE__*/React.createElement(__ds_scope.SourceTrail, {
    tone: "ink",
    sources: [{
      file: "Security_Whitepaper_v4.pdf",
      page: 12
    }]
  }))), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    tone: "ink",
    label: "Preenchimento autom\xE1tico",
    value: 92
  }))))), /*#__PURE__*/React.createElement(Section, {
    tone: "sunken"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Como funciona"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-d2-size)",
      lineHeight: "var(--text-d2-lh)",
      letterSpacing: "var(--text-d2-ls)",
      color: "var(--text-strong)",
      maxWidth: "24ch",
      textWrap: "pretty"
    }
  }, "Tr\xEAs passos, nenhuma resposta sem fonte")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "var(--gutter-grid)"
    }
  }, [{
    n: "01",
    icon: "upload",
    t: "Importe o edital",
    d: "PDF, planilha ou portal do cliente. A Tendra.ai separa os requisitos item por item."
  }, {
    n: "02",
    icon: "sparkles",
    t: "Gere com rastreabilidade",
    d: "Cada resposta sai citando o documento e a página que a sustenta."
  }, {
    n: "03",
    icon: "check-check",
    t: "Revise e aprove",
    d: "O time responsável aprova nominalmente; a trilha de auditoria registra tudo."
  }].map(s => /*#__PURE__*/React.createElement(__ds_scope.Card, {
    key: s.n,
    padding: "lg",
    radius: "2xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-sunken)",
      color: "var(--brand-sage)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: s.icon,
    size: "lg"
  })), /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, s.n)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h3-size)",
      letterSpacing: "-0.02em",
      color: "var(--text-strong)"
    }
  }, s.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: "var(--text-body)",
      textWrap: "pretty"
    }
  }, s.d))))))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "var(--gutter-grid)"
    }
  }, [{
    v: "4h 12m",
    k: "por edital de 200 itens"
  }, {
    v: "83%",
    k: "de reaproveitamento da base"
  }, {
    v: "3,2×",
    k: "mais RFPs respondidos por trimestre"
  }, {
    v: "100%",
    k: "das respostas com fonte citada"
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k,
    style: {
      display: "grid",
      gap: "var(--space-2)",
      borderTop: "var(--border-width-accent) solid var(--brand-sage)",
      paddingTop: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 40,
      letterSpacing: "-0.03em",
      color: "var(--text-strong)"
    }
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.5,
      color: "var(--text-body)",
      textWrap: "pretty"
    }
  }, s.k))))), /*#__PURE__*/React.createElement(Section, {
    tone: "ink"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
      gap: "var(--space-12)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "accent"
  }, "POR QUE CONFIAM"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-d2-size)",
      lineHeight: "var(--text-d2-lh)",
      letterSpacing: "var(--text-d2-ls)",
      color: "var(--text-on-inverse)",
      maxWidth: "22ch",
      textWrap: "pretty"
    }
  }, "Nenhuma resposta sai sem revis\xE3o humana"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-body-size)",
      lineHeight: 1.65,
      color: "var(--ink-200)",
      maxWidth: "var(--measure-lead)",
      textWrap: "pretty"
    }
  }, "A trilha de auditoria registra quem aprovou cada item, com qual fonte e em que vers\xE3o do documento. \xC9 o que o seu time de seguran\xE7a pede quando questiona conte\xFAdo gerado."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "inverse-secondary",
    iconEnd: "arrow-right",
    onClick: () => onPage("seguranca")
  }, "Como tratamos os seus dados"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--gutter-grid)"
    }
  }, [{
    icon: "shield-check",
    t: "Isolamento por tenant",
    d: "Seus documentos nunca treinam modelo compartilhado."
  }, {
    icon: "history",
    t: "Auditoria imutável",
    d: "Registro append-only de cada aprovação e edição."
  }, {
    icon: "users",
    t: "Aprovação nominal",
    d: "Cada item tem um revisor responsável identificado."
  }].map(r => /*#__PURE__*/React.createElement(__ds_scope.Card, {
    key: r.t,
    tone: "ink-panel",
    radius: "lg",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-4)",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--brand-lime)",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: r.icon,
    size: "lg"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 17,
      color: "var(--text-on-inverse)"
    }
  }, r.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.55,
      color: "var(--ink-200)",
      textWrap: "pretty"
    }
  }, r.d)))))))), /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(__ds_scope.Card, {
    tone: "accent",
    radius: "3xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-8)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    style: {
      color: "var(--brand-ink)"
    }
  }, "Webinar \xB7 14 de outubro"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 30,
      lineHeight: 1.15,
      letterSpacing: "-0.03em",
      color: "var(--brand-ink)",
      maxWidth: "26ch",
      textWrap: "pretty"
    }
  }, "Seguran\xE7a em respostas geradas por IA")), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    icon: "play"
  }, "Inscrever")))));
}
Object.assign(__ds_scope, { HomePage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PricingPage.jsx
try { (() => {
const PLANS = [{
  t: "Equipe",
  p: "R$ 4.900",
  per: "/mês",
  d: "Até 5 revisores e 20 editais por trimestre.",
  cta: "Começar",
  feats: ["Base de respostas", "Trilha de fonte", "Exportação em Word e Excel", "Suporte por e-mail"]
}, {
  t: "Enterprise",
  p: "Sob consulta",
  per: "",
  d: "Volume ilimitado, SSO e revisão nominal obrigatória.",
  cta: "Falar com vendas",
  featured: true,
  feats: ["Tudo do Equipe", "SSO SAML + SCIM", "Trilha de auditoria exportável", "Isolamento por tenant", "Gerente de conta dedicado"]
}, {
  t: "Setor público",
  p: "Sob consulta",
  per: "",
  d: "Licitações, pregões e dispensas com exigências formais.",
  cta: "Falar com vendas",
  feats: ["Tudo do Enterprise", "Modelos de edital público", "Residência de dados no Brasil"]
}];
function PricingPage() {
  return /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "var(--gutter-section) var(--page-pad)",
      display: "grid",
      gap: "var(--space-12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)",
      justifyItems: "center",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "sage"
  }, "PRE\xC7OS"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: "var(--text-d1-size)",
      lineHeight: "var(--text-d1-lh)",
      letterSpacing: "var(--text-d1-ls)",
      color: "var(--text-strong)",
      maxWidth: "20ch",
      textWrap: "pretty"
    }
  }, "Pre\xE7o por revisor, n\xE3o por resposta"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-lead-size)",
      lineHeight: 1.6,
      color: "var(--text-body)",
      maxWidth: "48ch",
      textWrap: "pretty"
    }
  }, "Cobrar por resposta gerada premiaria o volume. Cobramos por quem revisa \u2014 porque \xE9 a revis\xE3o que garante a entrega.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "var(--gutter-grid)",
      alignItems: "start"
    }
  }, PLANS.map(pl => /*#__PURE__*/React.createElement(__ds_scope.Card, {
    key: pl.t,
    tone: pl.featured ? "ink" : "paper",
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h3-size)",
      color: pl.featured ? "var(--text-on-inverse)" : "var(--text-strong)"
    }
  }, pl.t), pl.featured ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved-inverse"
  }, "Mais escolhido") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 34,
      letterSpacing: "-0.03em",
      color: pl.featured ? "var(--text-on-inverse)" : "var(--text-strong)"
    }
  }, pl.p), pl.per ? /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: pl.featured ? "inverse" : "default"
  }, pl.per) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: pl.featured ? "var(--ink-200)" : "var(--text-body)",
      textWrap: "pretty"
    }
  }, pl.d), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: pl.featured ? "accent" : "secondary",
    fullWidth: true
  }, pl.cta), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: pl.featured ? "inverse" : "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, pl.feats.map(ft => /*#__PURE__*/React.createElement("div", {
    key: ft,
    style: {
      display: "flex",
      gap: "var(--space-3)",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: pl.featured ? "var(--brand-lime)" : "var(--state-ink)",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: "md",
    strokeWidth: 2.4
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.55,
      color: pl.featured ? "var(--ink-200)" : "var(--text-body)"
    }
  }, ft))))))))));
}
Object.assign(__ds_scope, { PricingPage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PricingPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SecurityPage.jsx
try { (() => {
const PANELS = {
  dados: [{
    t: "Criptografia",
    d: "AES-256 em repouso; TLS 1.3 com perfect forward secrecy em trânsito; mTLS entre serviços."
  }, {
    t: "Chaves",
    d: "HSM certificado FIPS 140-2 nível 3, rotação a cada 90 dias, custódia dividida."
  }, {
    t: "Isolamento",
    d: "Um tenant por schema. Documentos do cliente não treinam modelo compartilhado."
  }],
  acesso: [{
    t: "SSO e SCIM",
    d: "SAML 2.0 e provisionamento automático via SCIM 2.0."
  }, {
    t: "Papéis",
    d: "Autor, revisor e administrador; aprovação exige papel de revisor."
  }, {
    t: "Registro",
    d: "Trilha append-only de leitura, edição e aprovação, exportável."
  }],
  conformidade: [{
    t: "SOC 2 Tipo II",
    d: "Relatório anual disponível sob NDA."
  }, {
    t: "ISO 27001",
    d: "Certificação do escopo de plataforma e operação."
  }, {
    t: "LGPD",
    d: "DPA modelo, sub-processadores publicados e DPO nomeado."
  }]
};
function SecurityPage() {
  const [tab, setTab] = React.useState("dados");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-inverse)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "var(--gutter-section) var(--page-pad)",
      display: "grid",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "accent"
  }, "POSTURA DE SEGURAN\xC7A"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: "var(--text-d1-size)",
      lineHeight: "var(--text-d1-lh)",
      letterSpacing: "var(--text-d1-ls)",
      color: "var(--text-on-inverse)",
      maxWidth: "22ch",
      textWrap: "pretty"
    }
  }, "Seus documentos s\xE3o o ativo. Tratamos como tal."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-lead-size)",
      lineHeight: 1.6,
      color: "var(--ink-200)",
      maxWidth: "var(--measure-lead)",
      textWrap: "pretty"
    }
  }, "Esta p\xE1gina \xE9 a fonte que o seu time de seguran\xE7a pode citar em um question\xE1rio de fornecedor."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      flexWrap: "wrap",
      paddingTop: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "accent",
    icon: "download"
  }, "Baixar whitepaper"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "inverse-secondary",
    icon: "file-text"
  }, "DPA modelo")))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "var(--gutter-section) var(--page-pad)",
      display: "grid",
      gap: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "var(--gutter-grid)"
    }
  }, [{
    icon: "shield-check",
    t: "SOC 2 Tipo II",
    m: "Auditoria anual"
  }, {
    icon: "lock",
    t: "ISO 27001",
    m: "Escopo de plataforma"
  }, {
    icon: "key-round",
    t: "LGPD",
    m: "DPO nomeado"
  }].map(c => /*#__PURE__*/React.createElement(__ds_scope.Card, {
    key: c.t,
    padding: "lg",
    radius: "2xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      flex: "none",
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-sunken)",
      color: "var(--brand-sage)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: c.icon,
    size: "lg"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 18,
      color: "var(--text-strong)"
    }
  }, c.t), /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, c.m)))))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "none",
    radius: "2xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--gutter-card-lg) var(--gutter-card-lg) 0"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "dados",
      label: "Dados"
    }, {
      value: "acesso",
      label: "Acesso"
    }, {
      value: "conformidade",
      label: "Conformidade"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--gutter-card-lg)",
      display: "grid",
      gap: "var(--space-5)"
    }
  }, PANELS[tab].map((p, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: p.t
  }, i > 0 ? /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)",
      gap: "var(--space-8)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h3-size)",
      color: "var(--text-strong)"
    }
  }, p.t)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-body-size)",
      lineHeight: 1.65,
      color: "var(--text-body)",
      maxWidth: "var(--measure-body)",
      textWrap: "pretty"
    }
  }, p.d), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved",
    icon: "check"
  }, "Verificado"), /*#__PURE__*/React.createElement(__ds_scope.SourceTrail, {
    sources: [{
      file: "Security_Whitepaper_v4.pdf",
      page: 12
    }]
  })))))))))));
}
Object.assign(__ds_scope, { SecurityPage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SecurityPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteFooter.jsx
try { (() => {
const COLS = [{
  t: "Produto",
  items: ["Automação de RFP", "Base de respostas", "Trilha de auditoria", "Integrações"]
}, {
  t: "Confiança",
  items: ["Segurança", "SOC 2 Tipo II", "LGPD", "Status"]
}, {
  t: "Empresa",
  items: ["Sobre", "Clientes", "Carreiras", "Contato"]
}];
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--surface-inverse)",
      color: "var(--text-on-inverse-body)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "var(--space-16) var(--page-pad) var(--space-8)",
      display: "grid",
      gap: "var(--space-12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))",
      gap: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    variant: "ink",
    size: 30
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.6,
      color: "var(--text-on-inverse-meta)",
      maxWidth: "34ch",
      textWrap: "pretty"
    }
  }, "O c\xE9rebro comercial e t\xE9cnico da sua opera\xE7\xE3o de licita\xE7\xF5es e RFPs.")), COLS.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.t,
    style: {
      display: "grid",
      gap: "var(--space-3)",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "inverse"
  }, c.t), c.items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    style: {
      fontSize: "var(--text-sm-size)",
      color: "var(--text-on-inverse-body)",
      textDecoration: "none"
    }
  }, i))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-inverse)",
      paddingTop: "var(--space-5)",
      display: "flex",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "inverse"
  }, "\xA9 2026 Tendra.ai \xB7 S\xE3o Paulo"), /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "inverse"
  }, "brand@tendra.ai"))));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteHeader.jsx
try { (() => {
const LINKS = ["Produto", "Segurança", "Clientes", "Preços"];
function SiteHeader({
  page,
  onPage,
  tone = "paper"
}) {
  const inverse = tone === "ink";
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: inverse ? "var(--surface-inverse)" : "var(--surface-card)",
      borderBottom: inverse ? "1px solid var(--border-inverse)" : "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "var(--space-4) var(--page-pad)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onPage("home");
    },
    style: {
      display: "flex",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    variant: inverse ? "ink" : "paper",
    size: 30
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-6)",
      marginLeft: "auto"
    }
  }, LINKS.map(l => {
    const key = l === "Segurança" ? "seguranca" : l === "Preços" ? "precos" : "home";
    const on = page === key && key !== "home";
    return /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      onClick: e => {
        e.preventDefault();
        onPage(key);
      },
      style: {
        fontSize: "var(--text-ui-size)",
        fontWeight: on ? "var(--weight-semibold)" : "var(--weight-regular)",
        color: inverse ? "var(--text-on-inverse-body)" : on ? "var(--text-strong)" : "var(--text-body)",
        textDecoration: "none"
      }
    }, l);
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: inverse ? "accent" : "primary"
  }, "Falar com vendas"))));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/WebsiteApp.jsx
try { (() => {
function WebsiteApp() {
  const [page, setPage] = React.useState("home");
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-page)",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SiteHeader, {
    page: page,
    onPage: setPage,
    tone: page === "seguranca" ? "ink" : "paper"
  }), page === "home" ? /*#__PURE__*/React.createElement(__ds_scope.HomePage, {
    onPage: setPage
  }) : null, page === "seguranca" ? /*#__PURE__*/React.createElement(__ds_scope.SecurityPage, null) : null, page === "precos" ? /*#__PURE__*/React.createElement(__ds_scope.PricingPage, null) : null, /*#__PURE__*/React.createElement(__ds_scope.SiteFooter, null));
}
Object.assign(__ds_scope, { WebsiteApp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/WebsiteApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/KnowledgeScreen.jsx
try { (() => {
const DOCS = [{
  icon: "shield-check",
  name: "Security_Whitepaper_v4.pdf",
  meta: "38 páginas · atualizado há 3 dias",
  uses: 412,
  ok: true
}, {
  icon: "file-text",
  name: "ISO27001_Anexo_A10.docx",
  meta: "12 páginas · atualizado há 2 semanas",
  uses: 188,
  ok: true
}, {
  icon: "key-round",
  name: "DPA_Modelo_2026.pdf",
  meta: "9 páginas · atualizado há 1 mês",
  uses: 96,
  ok: true
}, {
  icon: "building-2",
  name: "Arquitetura_Multi_Tenant.md",
  meta: "atualizado há 4 meses",
  uses: 41,
  ok: false
}];
function KnowledgeScreen() {
  const [q, setQ] = React.useState("criptografia");
  const results = q.trim().length > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--space-10) var(--space-12)",
      display: "grid",
      gap: "var(--space-6)",
      maxWidth: 1180
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Base de respostas"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-d2-size)",
      lineHeight: "var(--text-d2-lh)",
      letterSpacing: "var(--text-d2-ls)",
      color: "var(--text-strong)"
    }
  }, "4.812 respostas aprovadas")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    icon: "search",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Buscar por requisito, controle ou palavra-chave",
    style: {
      flex: "1 1 320px",
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Select, {
    size: "md",
    options: ["Todos os domínios", "Segurança", "Jurídico", "Infraestrutura"]
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    icon: "upload"
  }, "Subir documento")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
      gap: "var(--gutter-grid)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-card)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, results ? "3 respostas para “" + q + "”" : "Respostas"), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "filter",
    label: "Filtrar"
  })), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), results ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid"
    }
  }, [{
    t: "Criptografia de dados em repouso",
    a: "AES-256 com chaves em HSM FIPS 140-2 nível 3 e rotação a cada 90 dias.",
    src: [{
      file: "Security_Whitepaper_v4.pdf",
      page: 12
    }],
    uses: 84
  }, {
    t: "Criptografia em trânsito",
    a: "TLS 1.3 com perfect forward secrecy; mTLS entre serviços internos.",
    src: [{
      file: "Security_Whitepaper_v4.pdf",
      page: 13
    }],
    uses: 61
  }, {
    t: "Gestão de chaves",
    a: "Custódia dividida, dupla autorização para exportação e registro imutável de acesso.",
    src: [{
      file: "ISO27001_Anexo_A10.docx",
      page: 3
    }],
    uses: 37
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.t,
    style: {
      padding: "var(--space-5) var(--gutter-card)",
      borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-h3-size)",
      fontWeight: "var(--weight-semibold)",
      lineHeight: 1.3,
      color: "var(--text-strong)",
      textWrap: "pretty"
    }
  }, r.t), /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    style: {
      flex: "none"
    }
  }, r.uses, " usos")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-ui-size)",
      lineHeight: 1.6,
      color: "var(--text-body)",
      maxWidth: "62ch",
      textWrap: "pretty"
    }
  }, r.a), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SourceTrail, {
    sources: r.src
  }), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved",
    icon: "check"
  }, "Aprovado"))))) : /*#__PURE__*/React.createElement(__ds_scope.EmptyState, {
    icon: "search",
    title: "Busque na base",
    description: "Digite um controle, um requisito ou uma palavra-chave para ver respostas j\xE1 aprovadas."
  })), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-card)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Documentos de origem")), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid"
    }
  }, DOCS.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      padding: "var(--space-4) var(--gutter-card)",
      borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: "none",
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-sunken)",
      color: "var(--brand-sage)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: d.icon,
    size: "lg"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      gap: 3,
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-size)",
      color: "var(--text-strong)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, d.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm-size)",
      color: "var(--text-meta)"
    }
  }, d.meta, " \xB7 ", d.uses, " usos")), d.ok ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved",
    icon: "check"
  }, "Vigente") : /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "danger"
  }, "Revisar")))))));
}
Object.assign(__ds_scope, { KnowledgeScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/KnowledgeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/RequirementScreen.jsx
try { (() => {
const QUEUE = [{
  id: "REQ-082",
  t: "Política de retenção de logs",
  ok: true
}, {
  id: "REQ-083",
  t: "Segregação de ambientes",
  ok: true
}, {
  id: "REQ-084",
  t: "Criptografia de dados em repouso e em trânsito",
  active: true
}, {
  id: "REQ-085",
  t: "Plano de resposta a incidentes",
  ok: false
}, {
  id: "REQ-086",
  t: "Sub-processadores e transferência internacional",
  ok: false
}];
function RequirementScreen() {
  const [confirm, setConfirm] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const [cite, setCite] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "300px minmax(0, 1fr)",
      minHeight: "100%",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: "1px solid var(--border-default)",
      background: "var(--surface-card)",
      minHeight: "100%",
      padding: "var(--space-5)",
      display: "grid",
      gap: "var(--space-4)",
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Banco Aurora \xB7 210 itens"), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: 92,
    label: "Preenchido"
  })), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 2
    }
  }, QUEUE.map(q => /*#__PURE__*/React.createElement("div", {
    key: q.id,
    style: {
      display: "grid",
      gap: 4,
      padding: "10px 12px",
      borderRadius: "var(--radius-sm)",
      background: q.active ? "var(--surface-sunken)" : "transparent",
      boxShadow: q.active ? "inset 2px 0 0 var(--brand-ink)" : "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: q.active ? "sage" : "default"
  }, q.id), q.ok === true ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved",
    icon: "check"
  }, "OK") : q.ok === false ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "neutral"
  }, "Pendente") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm-size)",
      lineHeight: 1.45,
      color: q.active ? "var(--text-strong)" : "var(--text-body)",
      fontWeight: q.active ? "var(--weight-semibold)" : "var(--weight-regular)",
      textWrap: "pretty"
    }
  }, q.t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--space-10) var(--space-12)",
      display: "grid",
      gap: "var(--space-6)",
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "var(--space-6)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    size: "mono",
    uppercase: false,
    tone: "sage"
  }, "REQ-084/210 \xB7 Seguran\xE7a da informa\xE7\xE3o"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-h1-size)",
      lineHeight: "var(--text-h1-lh)",
      letterSpacing: "var(--text-h1-ls)",
      color: "var(--text-strong)",
      maxWidth: "26ch",
      textWrap: "pretty"
    }
  }, "Descreva os controles de criptografia de dados em repouso e em tr\xE2nsito.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tooltip, {
    content: "Hist\xF3rico de revis\xF5es"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "history",
    label: "Hist\xF3rico"
  })), /*#__PURE__*/React.createElement(__ds_scope.Tooltip, {
    content: "Copiar resposta"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "copy",
    label: "Copiar"
  })), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "more-horizontal",
    label: "Mais a\xE7\xF5es"
  }))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    tone: "ink",
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    tone: "inverse"
  }, "Resposta gerada \xB7 revis\xE3o obrigat\xF3ria"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved-inverse",
    icon: "check"
  }, "Conformidade OK"), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "inverse"
  }, "Fonte rastre\xE1vel"))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    tone: "ink-panel",
    radius: "lg",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-body-size)",
      lineHeight: 1.62,
      color: "var(--n-075)",
      textWrap: "pretty"
    }
  }, "Todos os dados em repouso s\xE3o cifrados com AES-256 e as chaves s\xE3o geridas em HSM certificado FIPS 140-2 n\xEDvel 3, com rota\xE7\xE3o autom\xE1tica a cada 90 dias. O tr\xE1fego entre cliente e plataforma usa TLS 1.3 com ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--brand-lime)"
    }
  }, "perfect forward secrecy"), "; conex\xF5es internas entre servi\xE7os s\xE3o autenticadas por mTLS."), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "inverse"
  }), /*#__PURE__*/React.createElement(__ds_scope.SourceTrail, {
    tone: "ink",
    sources: [{
      file: "Security_Whitepaper_v4.pdf",
      page: 12,
      href: "#"
    }, {
      file: "ISO27001_Anexo_A10.docx",
      page: 3,
      href: "#"
    }]
  }))), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    tone: "ink",
    label: "Confian\xE7a do preenchimento",
    value: 92
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    icon: "check",
    onClick: () => setConfirm(true)
  }, "Aprovar resposta"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "inverse-secondary",
    icon: "pencil"
  }, "Editar"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "inverse-secondary",
    icon: "history"
  }, "Trilha de auditoria")))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Nota de revis\xE3o"), /*#__PURE__*/React.createElement(__ds_scope.Textarea, {
    rows: 3,
    placeholder: "Registre o que foi alterado e por qu\xEA \u2014 a nota entra na trilha de auditoria."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Switch, {
    label: "Citar fonte na resposta enviada",
    checked: cite,
    onChange: e => setCite(e.target.checked)
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    icon: "send",
    onClick: () => setToast(true)
  }, "Enviar para o cliente"))))), /*#__PURE__*/React.createElement(__ds_scope.Dialog, {
    open: confirm,
    title: "Aprovar esta resposta?",
    description: "A trilha de auditoria registra voc\xEA como revisor respons\xE1vel. As fontes citadas ficam anexadas \xE0 vers\xE3o aprovada.",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "secondary",
      onClick: () => setConfirm(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      icon: "check",
      onClick: () => {
        setConfirm(false);
        setToast(true);
      }
    }, "Aprovar"))
  }), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: "var(--space-8)",
      bottom: "var(--space-8)",
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Toast, {
    tone: "success",
    title: "Resposta aprovada",
    description: "REQ-084 registrado na trilha de auditoria.",
    onClose: () => setToast(false)
  })) : null);
}
Object.assign(__ds_scope, { RequirementScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/RequirementScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/RfpListScreen.jsx
try { (() => {
const ROWS = [{
  id: "AUR-2026-01",
  client: "Banco Aurora",
  req: 210,
  done: 193,
  due: "em 3 dias",
  owner: "HM",
  status: "revisao"
}, {
  id: "MED-2026-04",
  client: "Medra Saúde",
  req: 88,
  done: 88,
  due: "enviado",
  owner: "RN",
  status: "aprovado"
}, {
  id: "NOR-2026-11",
  client: "Nordeste Energia",
  req: 164,
  done: 71,
  due: "em 9 dias",
  owner: "HM",
  status: "rascunho"
}, {
  id: "VLT-2026-02",
  client: "Volta Logística",
  req: 120,
  done: 4,
  due: "em 14 dias",
  owner: "AC",
  status: "rascunho"
}];
const STATUS = {
  revisao: {
    tone: "neutral",
    label: "Em revisão"
  },
  aprovado: {
    tone: "approved",
    label: "Aprovado",
    icon: "check"
  },
  rascunho: {
    tone: "neutral",
    label: "Rascunho"
  }
};
function RfpListScreen({
  onOpen
}) {
  const [tab, setTab] = React.useState("ativos");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--space-10) var(--space-12)",
      display: "grid",
      gap: "var(--space-6)",
      maxWidth: 1240
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "var(--space-6)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Editais"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-d2-size)",
      lineHeight: "var(--text-d2-lh)",
      letterSpacing: "var(--text-d2-ls)",
      color: "var(--text-strong)"
    }
  }, "4 editais em andamento")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Select, {
    size: "sm",
    options: ["Todos os responsáveis", "Meus editais"]
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    icon: "upload"
  }, "Importar edital"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "var(--gutter-grid)"
    }
  }, [{
    k: "Requisitos abertos",
    v: "289",
    m: "de 582 no trimestre"
  }, {
    k: "Cobertura da base",
    v: "83%",
    m: "respostas reaproveitadas"
  }, {
    k: "Tempo médio",
    v: "4h 12m",
    m: "por edital de 200 itens"
  }, {
    k: "Sem fonte",
    v: "2",
    m: "exigem revisão manual"
  }].map(s => /*#__PURE__*/React.createElement(__ds_scope.Card, {
    key: s.k,
    padding: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, s.k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 30,
      letterSpacing: "-0.03em",
      color: "var(--text-strong)"
    }
  }, s.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm-size)",
      color: "var(--text-meta)"
    }
  }, s.m))))), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "none"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--gutter-card) 0"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "ativos",
      label: "Ativos",
      count: 4
    }, {
      value: "enviados",
      label: "Enviados",
      count: 27
    }, {
      value: "arquivo",
      label: "Arquivo"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      padding: "var(--space-4) var(--gutter-card)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    onRemove: () => {}
  }, "Trimestre atual"), /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    onRemove: () => {}
  }, "Prioridade alta"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "filter",
    label: "Filtrar"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "list",
    label: "Densidade"
  }))), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr 1.2fr 0.8fr 44px",
      gap: "var(--space-4)",
      padding: "var(--space-3) var(--gutter-card)",
      background: "var(--surface-sunken)"
    }
  }, ["Edital", "Status", "Cobertura", "Prazo", ""].map((h, i) => /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, {
    key: i
  }, h))), ROWS.map((r, i) => {
    const st = STATUS[r.status];
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      onClick: () => onOpen && onOpen(),
      style: {
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr 1.2fr 0.8fr 44px",
        gap: "var(--space-4)",
        alignItems: "center",
        padding: "var(--space-4) var(--gutter-card)",
        borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 3,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--text-ui-size)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--text-strong)"
      }
    }, r.client), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-size)",
        color: "var(--text-meta)"
      }
    }, r.id, " \xB7 ", r.req, " requisitos")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
      tone: st.tone,
      icon: st.icon
    }, st.label)), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
      value: Math.round(r.done / r.req * 100),
      label: `${r.done}/${r.req}`,
      animate: false
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-size)",
        color: r.due === "enviado" ? "var(--text-state)" : "var(--text-body)"
      }
    }, r.due), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      icon: "chevron-right",
      label: "Abrir edital"
    }));
  }))));
}
Object.assign(__ds_scope, { RfpListScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/RfpListScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/SettingsScreen.jsx
try { (() => {
function SettingsScreen() {
  const [tab, setTab] = React.useState("geracao");
  const [tom, setTom] = React.useState("tecnico");
  const [review, setReview] = React.useState(true);
  const [cite, setCite] = React.useState(true);
  const [notify, setNotify] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--space-10) var(--space-12)",
      display: "grid",
      gap: "var(--space-6)",
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Ajustes"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-d2-size)",
      lineHeight: "var(--text-d2-lh)",
      letterSpacing: "var(--text-d2-ls)",
      color: "var(--text-strong)"
    }
  }, "Gera\xE7\xE3o e governan\xE7a")), /*#__PURE__*/React.createElement(__ds_scope.Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "geracao",
      label: "Geração"
    }, {
      value: "equipe",
      label: "Equipe",
      count: 9
    }, {
      value: "seguranca",
      label: "Segurança",
      icon: "lock"
    }]
  }), /*#__PURE__*/React.createElement(__ds_scope.Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Tom das respostas"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-6)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Radio, {
    name: "tom",
    label: "Formal",
    description: "Jur\xEDdico e licita\xE7\xE3o p\xFAblica",
    checked: tom === "formal",
    onChange: () => setTom("formal")
  }), /*#__PURE__*/React.createElement(__ds_scope.Radio, {
    name: "tom",
    label: "T\xE9cnico",
    description: "Seguran\xE7a e infraestrutura",
    checked: tom === "tecnico",
    onChange: () => setTom("tecnico")
  }), /*#__PURE__*/React.createElement(__ds_scope.Radio, {
    name: "tom",
    label: "Comercial",
    description: "Diferenciais e proposta de valor",
    checked: tom === "comercial",
    onChange: () => setTom("comercial")
  }))), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Field, {
    label: "Idioma padr\xE3o",
    hint: "Aplica-se a novos editais; os existentes mant\xEAm o idioma atual.",
    htmlFor: "lang"
  }, /*#__PURE__*/React.createElement(__ds_scope.Select, {
    id: "lang",
    options: ["Português (BR)", "English (US)", "Español (LatAm)"]
  })), /*#__PURE__*/React.createElement(__ds_scope.Field, {
    label: "Limite de caracteres por resposta",
    hint: "Editais costumam impor limite por item.",
    htmlFor: "lim"
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    id: "lim",
    mono: true,
    defaultValue: "2400",
    style: {
      maxWidth: 200
    }
  }))), /*#__PURE__*/React.createElement(__ds_scope.Divider, {
    tone: "subtle"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MonoLabel, null, "Governan\xE7a"), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "approved",
    icon: "shield-check"
  }, "Exigido pela pol\xEDtica")), /*#__PURE__*/React.createElement(__ds_scope.Switch, {
    label: "Exigir revis\xE3o humana antes do envio",
    description: "Nenhuma resposta gerada sai da plataforma sem aprova\xE7\xE3o nominal.",
    checked: review,
    onChange: e => setReview(e.target.checked)
  }), /*#__PURE__*/React.createElement(__ds_scope.Switch, {
    label: "Citar fonte em cada resposta",
    description: "Anexa arquivo e p\xE1gina \xE0 vers\xE3o aprovada.",
    checked: cite,
    onChange: e => setCite(e.target.checked)
  }), /*#__PURE__*/React.createElement(__ds_scope.Switch, {
    label: "Notificar revisor por e-mail",
    checked: notify,
    onChange: e => setNotify(e.target.checked)
  }), /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    label: "Bloquear envio quando houver requisito sem fonte",
    checked: true,
    description: "Recomendado para editais de setor regulado."
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary"
  }, "Descartar"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    icon: "check"
  }, "Salvar ajustes")));
}
Object.assign(__ds_scope, { SettingsScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/Shell.jsx
try { (() => {
function Shell({
  view,
  onView,
  breadcrumb,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      minHeight: "100%",
      background: "var(--surface-page)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SidebarNav, {
    value: view,
    header: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "2px 8px 10px"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
      size: 26
    }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      icon: "panel-left",
      label: "Recolher",
      size: "sm"
    })),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 12px 4px",
        borderTop: "1px solid var(--border-subtle)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        flex: "none",
        borderRadius: "var(--radius-pill)",
        background: "var(--brand-sage)",
        color: "var(--brand-paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 12
      }
    }, "HM"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "grid",
        gap: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-strong)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, "Helena Marques"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.06em",
        color: "var(--text-meta)"
      }
    }, "REVOPS"))),
    groups: [{
      label: "Trabalho",
      items: [{
        value: "editais",
        label: "Editais",
        icon: "file-text",
        count: 12,
        onClick: e => {
          e.preventDefault();
          onView("editais");
        }
      }, {
        value: "requisito",
        label: "Revisão",
        icon: "check-check",
        count: 3,
        onClick: e => {
          e.preventDefault();
          onView("requisito");
        }
      }]
    }, {
      label: "Conhecimento",
      items: [{
        value: "base",
        label: "Base de respostas",
        icon: "database",
        count: 4812,
        onClick: e => {
          e.preventDefault();
          onView("base");
        }
      }, {
        value: "fontes",
        label: "Documentos",
        icon: "folder",
        onClick: e => {
          e.preventDefault();
          onView("base");
        }
      }]
    }, {
      label: "Conta",
      items: [{
        value: "ajustes",
        label: "Ajustes",
        icon: "settings",
        onClick: e => {
          e.preventDefault();
          onView("ajustes");
        }
      }]
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.TopBar, {
    start: /*#__PURE__*/React.createElement(__ds_scope.Breadcrumb, {
      items: breadcrumb
    }),
    center: /*#__PURE__*/React.createElement(__ds_scope.Input, {
      icon: "search",
      placeholder: "Buscar em 4.812 respostas aprovadas",
      style: {
        maxWidth: 380,
        width: "100%"
      }
    }),
    end: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
      tone: "approved",
      icon: "shield-check"
    }, "SOC 2"), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      icon: "bell",
      label: "Notifica\xE7\xF5es"
    }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      icon: "settings",
      label: "Ajustes"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "auto"
    }
  }, children)));
}
Object.assign(__ds_scope, { Shell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/WorkspaceApp.jsx
try { (() => {
const CRUMBS = {
  editais: [{
    label: "Tendra.ai",
    href: "#"
  }, {
    label: "Editais"
  }],
  requisito: [{
    label: "Editais",
    href: "#"
  }, {
    label: "Banco Aurora",
    href: "#"
  }, {
    label: "REQ-084"
  }],
  base: [{
    label: "Tendra.ai",
    href: "#"
  }, {
    label: "Base de respostas"
  }],
  ajustes: [{
    label: "Tendra.ai",
    href: "#"
  }, {
    label: "Ajustes"
  }]
};
function WorkspaceApp() {
  const [view, setView] = React.useState("editais");
  return /*#__PURE__*/React.createElement(__ds_scope.Shell, {
    view: view,
    onView: setView,
    breadcrumb: CRUMBS[view]
  }, view === "editais" ? /*#__PURE__*/React.createElement(__ds_scope.RfpListScreen, {
    onOpen: () => setView("requisito")
  }) : null, view === "requisito" ? /*#__PURE__*/React.createElement(__ds_scope.RequirementScreen, null) : null, view === "base" ? /*#__PURE__*/React.createElement(__ds_scope.KnowledgeScreen, null) : null, view === "ajustes" ? /*#__PURE__*/React.createElement(__ds_scope.SettingsScreen, null) : null);
}
Object.assign(__ds_scope, { WorkspaceApp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/WorkspaceApp.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.MonoLabel = __ds_scope.MonoLabel;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.ICON_PATHS = __ds_scope.ICON_PATHS;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.SourceTrail = __ds_scope.SourceTrail;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.HomePage = __ds_scope.HomePage;

__ds_ns.PricingPage = __ds_scope.PricingPage;

__ds_ns.SecurityPage = __ds_scope.SecurityPage;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

__ds_ns.WebsiteApp = __ds_scope.WebsiteApp;

__ds_ns.KnowledgeScreen = __ds_scope.KnowledgeScreen;

__ds_ns.RequirementScreen = __ds_scope.RequirementScreen;

__ds_ns.RfpListScreen = __ds_scope.RfpListScreen;

__ds_ns.SettingsScreen = __ds_scope.SettingsScreen;

__ds_ns.Shell = __ds_scope.Shell;

__ds_ns.WorkspaceApp = __ds_scope.WorkspaceApp;

})();
