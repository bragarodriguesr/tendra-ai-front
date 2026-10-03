import * as React from "react";

export interface SourceRef {
  /** Nome do arquivo de origem, ex. "Security_Whitepaper_v4.pdf" */
  file: string;
  /** Página citada */
  page?: number | string;
  href?: string;
}

/**
 * Rastreabilidade: de qual documento saiu a afirmação.
 * Adição intencional ao conjunto padrão — é a promessa central do produto.
 */
export interface SourceTrailProps extends React.HTMLAttributes<HTMLDivElement> {
  sources?: SourceRef[];
  tone?: "paper" | "ink";
  label?: string;
}

export declare function SourceTrail(props: SourceTrailProps): JSX.Element;
