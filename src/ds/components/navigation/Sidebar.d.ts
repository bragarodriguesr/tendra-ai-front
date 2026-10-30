import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
export interface SidebarProviderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openMobile: boolean;
  onOpenMobileChange: (open: boolean) => void;
  isMobile: boolean;
  enabled?: boolean;
  children?: React.ReactNode;
}
export interface SidebarContextValue {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  mainRef: React.MutableRefObject<HTMLElement | null>;
  closeReason: React.MutableRefObject<'dismiss' | 'navigate' | 'resize'>;
}
export declare function SidebarProvider(props: SidebarProviderProps): React.JSX.Element;
export declare function useSidebar(): SidebarContextValue;
export declare function Sidebar(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;
export declare const SidebarTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
export declare function SidebarHeader(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarContent(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarFooter(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarGroup(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarGroupLabel(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarGroupContent(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarMenu(props: React.HTMLAttributes<HTMLUListElement>): React.JSX.Element;
export declare function SidebarMenuItem(props: React.LiHTMLAttributes<HTMLLIElement>): React.JSX.Element;
export declare function SidebarMenuBadge(props: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element;
export declare function SidebarTooltip(props: { children: React.ReactElement; content: React.ReactNode }): React.JSX.Element;
export declare const SidebarMenuButton: React.ForwardRefExoticComponent<useRender.ComponentProps<'button'> & { isActive?: boolean; tooltip?: React.ReactNode } & React.RefAttributes<HTMLElement>>;
