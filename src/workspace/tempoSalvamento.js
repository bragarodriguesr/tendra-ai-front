export function formatarTempoSalvamento(saved, now = Date.now()) {
  if (!saved) return "Salvamento automático";
  const elapsed = Math.max(0, now - saved);
  if (elapsed < 60000) return "Salvo agora";
  const [divisor, unidade] = elapsed < 3600000 ? [60000, "minuto"] : [3600000, "hora"];
  const quantidade = Math.floor(elapsed / divisor);
  return `Salvo há ${quantidade} ${unidade}${quantidade === 1 ? "" : "s"}`;
}
