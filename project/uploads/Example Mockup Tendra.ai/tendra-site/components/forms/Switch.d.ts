import * as React from "react";

/** Alternância de efeito imediato (não use em formulário que precisa de Salvar). */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "style"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Switch(props: SwitchProps): JSX.Element;
