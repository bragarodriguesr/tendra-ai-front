import * as React from "react";

/** Invólucro de rótulo + dica + erro para qualquer controle de formulário. */
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  /** Texto de apoio; suprimido quando `error` está presente */
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export declare function Field(props: FieldProps): JSX.Element;
