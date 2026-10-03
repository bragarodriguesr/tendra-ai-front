import * as React from "react";

export type LogoVariant = "paper" | "ink" | "mono-ink" | "mono-paper";
export type LogoLockup = "horizontal" | "symbol" | "appicon";

/**
 * Marca Tendra.ai — as quatro variações oficiais, nenhuma além delas.
 * @startingPoint section="Marca" subtitle="Lockups oficiais do logotipo" viewport="700x150"
 */
export interface LogoProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** paper: fundos claros · ink: fundos tinta · mono-*: uma cor */
  variant?: LogoVariant;
  /** Lado do símbolo em px; o wordmark escala a partir dele */
  size?: number;
  lockup?: LogoLockup;
  title?: string;
}

export declare function Logo(props: LogoProps): JSX.Element;
