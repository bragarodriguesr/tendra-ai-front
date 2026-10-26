import React from "react";
import { MonoLabel } from "./MonoLabel.jsx";

export function ProgressBar({ value = 0, label, showValue = true, tone = "paper", animate = true, fillClassName, style, ...rest }) {
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
          className={fillClassName}
          style={{
            height: "100%",
            width: pct + "%",
            borderRadius: "var(--radius-pill)",
            // Com fillClassName, cor e animação vêm da classe.
            background: fillClassName ? undefined : inverse ? "var(--brand-lime)" : "var(--brand-sage)",
            animation: fillClassName ? undefined : animate ? "tdr-fill var(--duration-fill) var(--ease-out) both" : undefined
          }}
        />
      </div>
    </div>
  );
}
