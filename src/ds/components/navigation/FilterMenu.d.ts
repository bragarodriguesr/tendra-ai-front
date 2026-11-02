import * as React from "react";

export interface FilterMenuItem {
  value: string;
  label: React.ReactNode;
  /** Quantidade de itens da visão, em mono à direita */
  count?: number;
}

/**
 * Filtro padrão de listas e tabelas: o primeiro item ("Todos") fica fixo como botão;
 * os demais vão para o menu do botão "Filtrar", cada um com a sua contagem.
 * Com um filtro ativo, o botão mostra o nome e a contagem dele e fica preenchido.
 */
export interface FilterMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** O primeiro item é a visão sem filtro ("Todos") */
  items?: FilterMenuItem[];
  /** `value` da visão ativa */
  value?: string;
  onChange?: (value: string) => void;
  /** Nome acessível do menu (padrão "Filtrar itens") */
  label?: string;
  /** Texto do botão sem filtro ativo (padrão "Filtrar") */
  triggerLabel?: string;
  /** Lado do botão "Filtrar" em que o menu se alinha: "start" (padrão) ou "end", para filtros à direita da tela */
  align?: "start" | "end";
}

export declare function FilterMenu(props: FilterMenuProps): JSX.Element;
