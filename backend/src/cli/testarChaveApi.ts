/**
 * Testa se ANTHROPIC_API_KEY é aceita pela API da Anthropic.
 * Faz uma única chamada de listagem de modelos (não consome tokens) e mostra só o resultado,
 * nunca o valor da chave. Termina com código de saída 1 se a chave estiver ausente ou for recusada.
 */
const chave = process.env.ANTHROPIC_API_KEY?.trim() ?? "";

if (chave === "") {
  console.error("ANTHROPIC_API_KEY ausente: defina a variável ou crie backend/.env");
  process.exit(1);
}

const resposta = await fetch("https://api.anthropic.com/v1/models?limit=1", {
  headers: { "x-api-key": chave, "anthropic-version": "2023-06-01" },
});

if (resposta.ok) {
  console.log(`Chave válida (HTTP ${resposta.status}, ${chave.length} caracteres)`);
} else {
  const corpo = (await resposta.json().catch(() => null)) as { error?: { message?: string } } | null;
  console.error(`Chave recusada (HTTP ${resposta.status}): ${corpo?.error?.message ?? "sem detalhes"}`);
  process.exitCode = 1;
}
