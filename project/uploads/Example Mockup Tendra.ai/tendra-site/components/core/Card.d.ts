import * as React from "react";

export type CardTone = "paper" | "sunken" | "ink" | "ink-panel" | "accent";

/**
 * Superfície de conteúdo: plana, 1px de borda, sem sombra.
 * @startingPoint section="Core" subtitle="Superfícies de card" viewport="700x220"
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  padding?: "none" | "sm" | "md" | "lg";
  /** Token de raio sem o prefixo, ex. "xl" → var(--radius-xl) */
  radius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Cor da faixa de 3px no topo, ex. "var(--state-ink)" para Faça / "var(--danger)" para Não faça */
  accentTop?: string;
  as?: keyof JSX.IntrinsicElements;
}

export declare function Card(props: CardProps): JSX.Element;
