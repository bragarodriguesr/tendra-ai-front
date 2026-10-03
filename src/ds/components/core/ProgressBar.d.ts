import * as React from "react";

/** Barra de preenchimento — cobertura de RFP, progresso de importação, score de conformidade. */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value?: number;
  label?: React.ReactNode;
  showValue?: boolean;
  /** paper: trilha cinza + barra sálvia · ink: trilha tinta + barra limão */
  tone?: "paper" | "ink";
  animate?: boolean;
}

export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
