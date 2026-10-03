import * as React from "react";

/** Caixa de seleção. Marcada = campo tinta com o check em limão. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "style"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
  style?: React.CSSProperties;
}

export declare function Checkbox(props: CheckboxProps): JSX.Element;
