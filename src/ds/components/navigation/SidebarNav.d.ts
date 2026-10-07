import * as React from "react";

export interface SidebarNavItem {
  value?: string;
  label: React.ReactNode;
  /** Nome de glifo Lucide */
  icon?: string;
  count?: number;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export interface SidebarNavGroup {
  /** Eyebrow em mono acima do grupo */
  label?: React.ReactNode;
  items?: SidebarNavItem[];
}

/** Navegação lateral do produto. Item ativo = fundo afundado + filete de 2px à esquerda. */
export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  groups?: SidebarNavGroup[];
  /** `value` do item ativo */
  value?: string;
  tone?: "paper" | "ink";
  header?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  /** Só os ícones; o rótulo (texto) vira aria-label e title, e os títulos de grupo viram um traço */
  collapsed?: boolean;
}

export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
