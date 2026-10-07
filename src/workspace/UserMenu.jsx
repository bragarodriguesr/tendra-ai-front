import React from "react";
import { Button, MonoLabel } from "../ds/index.js";
import { usePopover } from "./usePopover.js";

/** Nome do usuário na barra superior; abre um menu com o perfil e a troca de usuário da demo. */
export function UserMenu({ name, role, onSwitch, onLogout }) {
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
          <div style={{ display: "grid", gap: 4 }}>
            <MonoLabel>Perfil</MonoLabel>
            <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{role}</span>
          </div>
          <Button size="sm" variant="secondary" icon="users" fullWidth onClick={() => { onSwitch(); setOpen(false); focusTrigger(); }}>
            Trocar usuário
          </Button>
          {/* No celular o "Sair" sai da barra e fica aqui, para a barra caber ao lado do logo. */}
          <span className="tdr-menu-logout">
            <Button size="sm" variant="ghost" icon="log-out" fullWidth onClick={onLogout}>Sair</Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
