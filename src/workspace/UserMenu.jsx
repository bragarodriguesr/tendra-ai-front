import React from "react";
import { Button, MonoLabel } from "../ds/index.js";
import { usePopover } from "./usePopover.js";

/**
 * Nome do usuário na barra superior; abre um menu com o perfil e a troca de usuário da demo. Com
 * login (fase D), o papel vem da sessão e não há troca de usuário (`onSwitch` nulo); a organização
 * da sessão (fase K) aparece acima do perfil. As áreas do Aprovador (fase N, cenário N1) vêm ao
 * lado do papel ("Aprovador · Jurídico, Comercial").
 */
export function UserMenu({ name, role, areas = [], organization, onSwitch, onLogout }) {
  const { open, setOpen, root, focusTrigger } = usePopover();
  const menuId = "tdr-user-menu";

  return (
    <div ref={root} style={{ position: "relative" }}>
      <Button
        size="sm"
        variant="inverse-secondary"
        iconEnd="chevron-down"
        aria-label={name}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tdr-user-name">{name}</span>
        <span className="tdr-user-initials" aria-hidden="true">{name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
      </Button>
      {open ? (
        <div id={menuId} className="tdr-popover tdr-user-menu" role="group" aria-label="Usuário">
          {organization ? (
            <div style={{ display: "grid", gap: 4 }}>
              <MonoLabel>Organização</MonoLabel>
              <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{organization}</span>
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 4 }}>
            <MonoLabel>Perfil</MonoLabel>
            <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{areas.length > 0 ? `${role} · ${areas.join(", ")}` : role}</span>
          </div>
          {onSwitch ? (
            <Button size="sm" variant="secondary" icon="users" fullWidth onClick={() => { onSwitch(); setOpen(false); focusTrigger(); }}>
              Trocar usuário
            </Button>
          ) : null}
          {/* No celular o "Sair" sai da barra e fica aqui, para a barra caber ao lado do logo. */}
          <span className="tdr-menu-logout">
            <Button size="sm" variant="ghost" icon="log-out" fullWidth onClick={onLogout}>Sair</Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
