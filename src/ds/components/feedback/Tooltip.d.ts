import * as React from "react";

/** Rótulo em hover/foco. Só texto curto — nunca informação essencial. */
export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  content?: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}

export declare function Tooltip(props: TooltipProps): JSX.Element;
