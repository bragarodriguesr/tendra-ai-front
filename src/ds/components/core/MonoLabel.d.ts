import * as React from "react";

export type MonoLabelTone = "default" | "strong" | "sage" | "state" | "inverse" | "accent";

/**
 * Rótulo técnico em IBM Plex Mono: eyebrow de seção, ID de requisito, metadado de fonte.
 */
export interface MonoLabelProps extends React.HTMLAttributes<HTMLElement> {
  tone?: MonoLabelTone;
  /** label 11px/+10% (eyebrow) · mono 12px/+4% (metadado corrido) */
  size?: "label" | "mono";
  uppercase?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export declare function MonoLabel(props: MonoLabelProps): JSX.Element;
