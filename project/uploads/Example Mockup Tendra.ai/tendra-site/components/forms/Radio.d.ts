import * as React from "react";

/** Escolha exclusiva dentro de um `name`. Marcado = anel de tinta de 6px. */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "style"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Radio(props: RadioProps): JSX.Element;
