import * as React from "react";

export type AuroraVariant = "lime" | "mist" | "ink";

/**
 * Campo de luz: gradiente esfumado feito só das quatro cores da marca. Fundo de hero, capa, banner e card de produto escuro.
 * @startingPoint section="Marca" subtitle="Campos de luz Aurora (lime, mist, ink)" viewport="700x260"
 */
export interface AuroraProps extends React.HTMLAttributes<HTMLElement> {
  /** lime: limão→papel→sálvia clara, texto tinta · mist: papel com sopro de limão, texto tinta · ink: tinta com brilho de limão e sálvia, texto papel */
  variant?: AuroraVariant;
  /** Deriva lenta das manchas (31–44s por ciclo); respeita prefers-reduced-motion */
  move?: boolean;
  /** Token de raio sem prefixo ("xl", "3xl") ou 0 para full-bleed */
  radius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "none" | 0;
  padding?: "none" | "sm" | "md" | "lg";
  as?: keyof JSX.IntrinsicElements;
}

export declare function Aurora(props: AuroraProps): JSX.Element;
