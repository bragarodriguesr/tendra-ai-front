import * as React from "react";

export type SelectOption = string | { value: string; label: string };

/** Lista suspensa nativa com a seta e a moldura da marca. */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "style" | "children"> {
  options?: SelectOption[];
  size?: "sm" | "md";
  invalid?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

export declare function Select(props: SelectProps): JSX.Element;
