import React from "react";
import { IconButton } from "../core/IconButton.jsx";

export function Dialog({ open = true, title, description, children, footer, onClose, width = 520, style, ...rest }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--scrim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
        animation: "tdr-fade var(--duration-base) var(--ease-out) both",
        zIndex: 40
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-overlay)",
          animation: "tdr-rise var(--duration-base) var(--ease-out) both",
          ...style
        }}
        {...rest}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)", padding: "var(--gutter-card) var(--gutter-card) var(--space-4)" }}>
          <div style={{ display: "grid", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
            {title ? (
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--weight-semibold)", fontSize: "var(--text-h2-size)", lineHeight: "var(--text-h2-lh)", letterSpacing: "var(--text-h2-ls)", color: "var(--text-strong)" }}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--text-ui-size)", lineHeight: 1.6, color: "var(--text-body)", textWrap: "pretty" }}>
                {description}
              </p>
            ) : null}
          </div>
          {onClose ? <IconButton icon="x" label="Fechar" onClick={onClose} /> : null}
        </div>
        {children ? <div style={{ padding: "0 var(--gutter-card) var(--space-5)" }}>{children}</div> : null}
        {footer ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", padding: "var(--space-5) var(--gutter-card)", borderTop: "1px solid var(--border-subtle)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
