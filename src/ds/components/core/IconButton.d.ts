import * as React from "react";

export type IconButtonVariant = "ghost" | "outline" | "solid" | "inverse";
export type IconButtonSize = "sm" | "md" | "lg";

/** Botão só de ícone. `label` é obrigatório — vira aria-label e title. */
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  /** Nome de glifo Lucide */
  icon: string;
  /** Texto acessível, ex. "Fechar" */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: React.CSSProperties;
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
