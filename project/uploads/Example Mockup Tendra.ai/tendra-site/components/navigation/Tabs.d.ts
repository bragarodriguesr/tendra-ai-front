import * as React from "react";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  /** Nome de glifo Lucide */
  icon?: string;
  /** Contador em mono à direita do rótulo */
  count?: number;
}

/**
 * Navegação entre visões irmãs. Ativo = sublinhado de 2px.
 * @startingPoint section="Navegação" subtitle="Abas, breadcrumb e barra superior" viewport="700x200"
 */
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  tone?: "paper" | "ink";
}

export declare function Tabs(props: TabsProps): JSX.Element;
