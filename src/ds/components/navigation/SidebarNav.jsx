import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from './Sidebar.jsx';

/** Adaptador dos grupos existentes para as primitivas Base UI; também funciona isolado. */
export function SidebarNav({ groups = [], value, tone = 'paper', header, footer, width = 'calc(4 * var(--space-18))', collapsed = false, style, className = '', ...rest }) {
  return <nav className={`tdr-sidebar-nav ${className}`} data-tone={tone} data-collapsed={collapsed} style={{ width, ...style }} {...rest}>
    {header}
    {groups.map((group, index) => <SidebarGroup key={index}>
      {group.label ? <SidebarGroupLabel aria-hidden={collapsed || undefined}>{group.label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {(group.items || []).map(item => <SidebarMenuItem key={item.value || item.label}>
            <SidebarMenuButton render={<a href={item.href || '#'} />} isActive={item.value === value}
              className={item.className} onClick={item.onClick}
              aria-current={item.value === value ? 'page' : undefined}
              aria-label={collapsed ? `${item.label}${item.count != null ? ` (${item.count})` : ''}` : undefined}
              tooltip={collapsed ? item.label : undefined}>
              {item.icon ? <Icon name={item.icon} size={20} /> : null}
              {collapsed ? null : <span className="tdr-sidebar-item-label">{item.label}</span>}
              {item.count != null && !collapsed ? <SidebarMenuBadge>{item.count}</SidebarMenuBadge> : null}
            </SidebarMenuButton>
          </SidebarMenuItem>)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>)}
    {footer}
  </nav>;
}
