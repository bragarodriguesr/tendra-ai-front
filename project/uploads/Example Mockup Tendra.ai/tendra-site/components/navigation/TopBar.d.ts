import * as React from "react";

/** Barra superior de 64px em três zonas. */
export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Marca, trilha, título da view */
  start?: React.ReactNode;
  /** Busca global (cresce) */
  center?: React.ReactNode;
  /** Ações, notificações, avatar */
  end?: React.ReactNode;
  tone?: "paper" | "ink";
}

export declare function TopBar(props: TopBarProps): JSX.Element;
