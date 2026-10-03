import * as React from "react";

/**
 * Campo de texto de uma linha.
 * @startingPoint section="Formulários" subtitle="Campos, select e controles" viewport="700x260"
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "style"> {
  size?: "sm" | "md";
  /** Nome de glifo Lucide à esquerda, ex. "search" */
  icon?: string;
  invalid?: boolean;
  /** Usa IBM Plex Mono — para IDs, chaves e valores técnicos */
  mono?: boolean;
  style?: React.CSSProperties;
}

export declare function Input(props: InputProps): JSX.Element;
