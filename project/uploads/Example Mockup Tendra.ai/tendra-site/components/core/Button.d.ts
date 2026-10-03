import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "inverse-secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Ação. Primária em Tinta Profunda; accent em Limão só para a chamada comercial.
 * @startingPoint section="Core" subtitle="Variações e tamanhos de botão" viewport="700x180"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Nome de glifo Lucide antes do rótulo */
  icon?: string;
  /** Nome de glifo Lucide depois do rótulo */
  iconEnd?: string;
  loading?: boolean;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
