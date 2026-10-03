import * as React from "react";

/** Chip de filtro ou entidade selecionada. Remoção opcional. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "inverse";
  /** Presente = renderiza o botão de remover */
  onRemove?: () => void;
  removeLabel?: string;
}

export declare function Tag(props: TagProps): JSX.Element;
