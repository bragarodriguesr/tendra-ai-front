import * as React from "react";

/** Estado vazio: ícone em moldura quadrada, título, uma frase e uma ação. */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nome de glifo Lucide, 24px */
  icon?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "paper" | "ink";
}

export declare function EmptyState(props: EmptyStateProps): JSX.Element;
