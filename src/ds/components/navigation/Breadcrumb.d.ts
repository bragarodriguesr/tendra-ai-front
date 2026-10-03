import * as React from "react";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

/** Trilha de hierarquia. O último item é o atual e não é link. */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItem[];
  tone?: "paper" | "ink";
}

export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
