import * as React from "react";

/**
 * Camada modal. Um dos poucos lugares com sombra — ela flutua de fato.
 * @startingPoint section="Feedback" subtitle="Modal, toast, tooltip e estado vazio" viewport="700x300"
 */
export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Ações, normalmente dois `Button` alinhados à direita */
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
}

export declare function Dialog(props: DialogProps): JSX.Element | null;
