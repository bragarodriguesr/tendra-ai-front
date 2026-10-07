import React from "react";

/** Abre e fecha um menu suspenso: fecha com clique fora e com Esc (devolvendo o foco ao botão). */
export function usePopover() {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef(null);
  const focusTrigger = () => root.current && root.current.querySelector("button").focus();

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); focusTrigger(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return { open, setOpen, root, focusTrigger };
}
