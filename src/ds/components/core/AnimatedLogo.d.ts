import * as React from "react";

export type AnimatedLogoVariant = "ink" | "paper" | "lime";

export interface TendraLogoElement extends HTMLElement {
  play(): void;
  pause(): void;
  replay(): void;
  /** Posição no ciclo, em segundos (0–6) */
  currentTime: number;
  readonly duration: number;
}

/**
 * Logo animado Tendra.ai — o cronômetro percorre a caixa, o ponto trava e o wordmark entra. Ciclo de 6 s.
 * @startingPoint section="Marca" subtitle="Logo animado (cronômetro)" viewport="700x400"
 */
export interface AnimatedLogoProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** ink: fundo Tinta · paper: fundo Papel · lime: fundo Limão */
  variant?: AnimatedLogoVariant;
  /** Toca uma vez e mantém o logo completo (padrão: loop) */
  once?: boolean;
  /** Não inicia sozinho; use ref.current.play() */
  paused?: boolean;
  /** Sem fundo nem palco 16:9 — só o logo, na largura do elemento */
  bare?: boolean;
  title?: string;
}

export declare const AnimatedLogo: React.ForwardRefExoticComponent<
  AnimatedLogoProps & React.RefAttributes<TendraLogoElement>
>;
