// Adapted from shadcn/ui Base Sidebar/Sheet/Tooltip. See THIRD_PARTY_NOTICES.md.
import React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Tooltip } from '@base-ui/react/tooltip';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { Icon } from '../core/Icon.jsx';

const SidebarContext = React.createContext(null);
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.');
  return context;
}

export function SidebarProvider({ open, onOpenChange, openMobile, onOpenMobileChange, isMobile, enabled = true, children }) {
  const triggerRef = React.useRef(null);
  const mainRef = React.useRef(null);
  const closeReason = React.useRef('dismiss');
  const toggleSidebar = React.useCallback(() => {
    closeReason.current = 'dismiss';
    return isMobile ? onOpenMobileChange(!openMobile) : onOpenChange(!open);
  }, [isMobile, open, openMobile, onOpenChange, onOpenMobileChange]);
  React.useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = event => {
      if (event.key.toLowerCase() !== 'b' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      event.preventDefault();
      toggleSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, enabled]);
  const wasMobile = React.useRef(isMobile);
  React.useEffect(() => {
    if (wasMobile.current !== isMobile) {
      const focusWasInSidebar = document.activeElement?.closest('[data-slot="sidebar"]');
      closeReason.current = 'resize';
      onOpenMobileChange(false);
      if (focusWasInSidebar) (triggerRef.current || mainRef.current)?.focus();
      wasMobile.current = isMobile;
    }
  }, [isMobile, onOpenMobileChange]);
  const context = React.useMemo(() => ({
    state: open ? 'expanded' : 'collapsed', open, setOpen: onOpenChange,
    openMobile, setOpenMobile: onOpenMobileChange, isMobile, toggleSidebar,
    triggerRef, mainRef, closeReason
  }), [open, onOpenChange, openMobile, onOpenMobileChange, isMobile, toggleSidebar]);
  return <SidebarContext.Provider value={context}>{children}</SidebarContext.Provider>;
}

export function Sidebar({ children, id = 'tdr-sidebar', ...props }) {
  const { state, isMobile, openMobile, setOpenMobile, triggerRef, mainRef, closeReason } = useSidebar();
  const popupRef = React.useRef(null);
  if (isMobile) return (
    <Dialog.Root open={openMobile} onOpenChange={value => { if (value) closeReason.current = 'dismiss'; setOpenMobile(value); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="tdr-sidebar-backdrop" />
        <Dialog.Popup ref={popupRef} id={id} data-slot="sidebar" data-mobile="true" data-state="expanded" className="tdr-sidebar tdr-sidebar-mobile"
          initialFocus={() => popupRef.current?.querySelector('nav a')}
          finalFocus={() => {
            if (closeReason.current !== 'navigate') return triggerRef.current;
            // Base UI otherwise selects the first tabbable child of main (tabIndex=-1).
            queueMicrotask(() => mainRef.current?.focus({ preventScroll: true }));
            return false;
          }} {...props}>
          <Dialog.Title className="tdr-sidebar-sr-only">Navegação do workspace</Dialog.Title>
          <Dialog.Close className="tdr-sidebar-icon-button tdr-sidebar-mobile-close" aria-label="Fechar menu"><Icon name="x" size={20} /></Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return <aside id={id} data-slot="sidebar" data-state={state} data-collapsible={state === 'collapsed' ? 'icon' : ''} data-variant="sidebar" className="tdr-sidebar" {...props}>{children}</aside>;
}

export const SidebarTrigger = React.forwardRef(function SidebarTrigger({ onClick, ...props }, ref) {
  const { isMobile, open, openMobile, triggerRef, toggleSidebar } = useSidebar();
  const label = isMobile ? openMobile ? 'Fechar menu' : 'Abrir menu' : open ? 'Recolher menu' : 'Expandir menu';
  return <button type="button" data-slot="sidebar-trigger" className="tdr-sidebar-icon-button tdr-sidebar-trigger" aria-label={label}
    aria-expanded={isMobile ? openMobile : open} aria-controls="tdr-sidebar"
    ref={node => { triggerRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) toggleSidebar(); }} {...props}><Icon name="panel-left" size={20} /></button>;
});

export function SidebarHeader(props) { return <div data-slot="sidebar-header" {...props} />; }
export function SidebarContent(props) { return <div data-slot="sidebar-content" {...props} />; }
export function SidebarFooter(props) { return <div data-slot="sidebar-footer" {...props} />; }
export function SidebarGroup(props) { return <div data-slot="sidebar-group" {...props} />; }
export function SidebarGroupLabel(props) { return <div data-slot="sidebar-group-label" {...props} />; }
export function SidebarGroupContent(props) { return <div data-slot="sidebar-group-content" {...props} />; }
export function SidebarMenu(props) { return <ul data-slot="sidebar-menu" {...props} />; }
export function SidebarMenuItem(props) { return <li data-slot="sidebar-menu-item" {...props} />; }
export function SidebarMenuBadge(props) { return <span data-slot="sidebar-menu-badge" {...props} />; }

export function SidebarTooltip({ children, content }) {
  return <Tooltip.Root>
    <Tooltip.Trigger render={children} />
    <Tooltip.Portal>
      <Tooltip.Positioner side="right" sideOffset={8} className="tdr-sidebar-tooltip-positioner">
        <Tooltip.Popup role="tooltip" className="tdr-sidebar-tooltip">{content}</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>;
}

export const SidebarMenuButton = React.forwardRef(function SidebarMenuButton({ render, isActive = false, tooltip, ...props }, ref) {
  const comp = useRender({
    defaultTagName: 'button', render, ref,
    props: mergeProps({ className: 'tdr-sidebar-menu-button' }, props),
    state: { slot: 'sidebar-menu-button', sidebar: 'menu-button', active: isActive }
  });
  return tooltip ? <SidebarTooltip content={tooltip}>{comp}</SidebarTooltip> : comp;
});
