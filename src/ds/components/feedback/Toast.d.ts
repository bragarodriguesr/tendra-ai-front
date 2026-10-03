import * as React from "react";

export type ToastTone = "neutral" | "success" | "warning" | "danger";

/** Confirmação transitória. Sempre em campo tinta, inclusive sobre páginas claras. */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Uma ação, normalmente `<Button variant="inverse-secondary" size="sm">` */
  action?: React.ReactNode;
  onClose?: () => void;
}

export declare function Toast(props: ToastProps): JSX.Element;
