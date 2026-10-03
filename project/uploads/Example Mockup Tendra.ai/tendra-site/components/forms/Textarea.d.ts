import * as React from "react";

/** Campo de texto multilinha — resposta de requisito, nota de revisão. */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  invalid?: boolean;
  style?: React.CSSProperties;
}

export declare function Textarea(props: TextareaProps): JSX.Element;
