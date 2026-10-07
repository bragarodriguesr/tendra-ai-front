import React from "react";
import { Button, MonoLabel } from "../ds/index.js";

/** Nome do usuário na barra superior; abre um menu com o perfil e a troca de usuário da demo. */
export function UserMenu({ name, role, onSwitch }) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef(null);
  const menuId = "tdr-user-menu";

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); root.current.querySelector("button").focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

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
        <div id={menuId} className="tdr-user-menu" role="group" aria-label="Usuário">
          <div style={{ display: "grid", gap: 4 }}>
            <MonoLabel>Perfil</MonoLabel>
            <span style={{ fontWeight: 600, color: "var(--n-900)" }}>{role}</span>
          </div>
          <Button size="sm" variant="secondary" icon="users" fullWidth onClick={() => { onSwitch(); setOpen(false); root.current.querySelector("button").focus(); }}>
            Trocar usuário
          </Button>
        </div>
      ) : null}
    </div>
  );
}
