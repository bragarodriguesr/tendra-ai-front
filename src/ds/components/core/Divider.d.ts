import * as React from "react";

/** Régua de 1px. Divide dentro de um card; entre cards use gap. */
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "subtle" | "inverse";
}

export declare function Divider(props: DividerProps): JSX.Element;
