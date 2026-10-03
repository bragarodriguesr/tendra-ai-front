import * as React from "react";

export type IconSize = "sm" | "md" | "lg" | "xl";

/**
 * Glifo do conjunto Lucide, traço 2px, herdando a cor do texto.
 * Nunca desenhe um ícone à mão: se o nome não existir, adicione o SVG em assets/icons/.
 */
export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "name" | "color"> {
  /** Nome do glifo Lucide, ex. "shield-check" */
  name: string;
  /** sm 14 · md 16 · lg 20 · xl 24 — ou um número em px */
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
}

export declare function Icon(props: IconProps): JSX.Element | null;
