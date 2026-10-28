import React from "react";
import { Button, Tooltip } from "../ds/index.js";

/**
 * "Nova RFP/RFI" do Dashboard e do painel de tarefas: desabilitado enquanto não há nenhum documento
 * na base, porque sem base todas as perguntas ficariam sem rascunho.
 */
export function NewRfpButton({ v, ws }) {
  const button = <Button icon="plus" disabled={!v.canCreate} onClick={() => ws.go("new")}>Nova RFP/RFI</Button>;
  if (v.canCreate) return button;
  return (
    <Tooltip content="Suba ao menos um documento na Base de conhecimento para criar uma RFP." placement="bottom">
      <span tabIndex={0} style={{ display: "inline-flex" }}>{button}</span>
    </Tooltip>
  );
}
