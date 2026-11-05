import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from './Sidebar.jsx';

/** Um item do menu: link com ícone, rótulo e contagem. O pai de subitens fica ativo só no menu recolhido. */
function NavButton({ item, value, collapsed = false, sub = false, hidden = false }) {
  const filhos = item.items || [];
  // Com os subitens escondidos (menu recolhido ou grupo fechado), o pai marca a página de um deles.
  const escondidos = collapsed || hidden;
  const ativo = item.value === value || (escondidos && filhos.some(f => f.value === value));
  const dica = collapsed ? (filhos.length ? `${item.label}: ${filhos.map(f => f.label).join(', ')}` : item.label) : undefined;
  return <SidebarMenuButton render={<a href={item.href || '#'} />} isActive={ativo}
    className={[sub ? 'tdr-sidebar-menu-sub-button' : '', item.className || ''].join(' ').trim() || undefined} onClick={item.onClick}
    aria-current={ativo ? 'page' : undefined}
    aria-label={collapsed ? `${item.label}${item.count != null ? ` (${item.count})` : ''}` : undefined}
    tooltip={dica}>
    {item.icon && !sub ? <Icon name={item.icon} size={20} /> : null}
    {collapsed ? null : <span className="tdr-sidebar-item-label">{item.label}</span>}
    {/* O pai de subitens mostra a contagem só no menu recolhido (no rótulo); aberto, cada subitem tem a sua. */}
    {item.count != null && !collapsed && (!filhos.length || hidden) ? <SidebarMenuBadge>{item.count}</SidebarMenuBadge> : null}
  </SidebarMenuButton>;
}

/** Adaptador dos grupos existentes para as primitivas Base UI; também funciona isolado. */
export function SidebarNav({ groups = [], value, tone = 'paper', header, footer, width = 'calc(4 * var(--space-18))', collapsed = false, style, className = '', ...rest }) {
  return <nav className={`tdr-sidebar-nav ${className}`} data-tone={tone} data-collapsed={collapsed} style={{ width, ...style }} {...rest}>
    {header}
    {groups.map((group, index) => <SidebarGroup key={index}>
      {group.label ? <SidebarGroupLabel aria-hidden={collapsed || undefined}>{group.label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {(group.items || []).map(item => <SidebarMenuItem key={item.value || item.label} className={item.onToggle && !collapsed ? 'tdr-sidebar-item-with-toggle' : undefined}>
            <NavButton item={item} value={value} collapsed={collapsed} hidden={item.expanded === false} />
            {item.onToggle && !collapsed ? <button type="button" className="tdr-sidebar-icon-button tdr-sidebar-sub-toggle" aria-expanded={item.expanded !== false}
              aria-label={item.expanded === false ? `Mostrar ${item.label}` : `Recolher ${item.label}`} onClick={item.onToggle}>
              <Icon name={item.expanded === false ? 'chevron-right' : 'chevron-down'} size={16} />
            </button> : null}
            {/* Subitens (fase O, PO8): recuados e sem ícone; no menu recolhido, só o item pai, com eles na dica. */}
            {item.items && item.items.length && !collapsed && item.expanded !== false ? <ul data-slot="sidebar-menu-sub" className="tdr-sidebar-menu-sub">
              {item.items.map(sub => <li key={sub.value || sub.label} data-slot="sidebar-menu-sub-item"><NavButton item={sub} value={value} sub /></li>)}
            </ul> : null}
          </SidebarMenuItem>)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>)}
    {footer}
  </nav>;
}
