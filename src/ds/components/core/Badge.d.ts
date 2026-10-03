import * as React from "react";

export type BadgeTone = "neutral" | "approved" | "approved-inverse" | "accent" | "ink" | "inverse" | "danger";

/**
 * Selo de estado em mono caixa alta: conformidade, rastreabilidade, revisão.
 * @startingPoint section="Core" subtitle="Selos de estado e conformidade" viewport="700x150"
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Nome de glifo Lucide, 12px */
  icon?: string;
}

export declare function Badge(props: BadgeProps): JSX.Element;
