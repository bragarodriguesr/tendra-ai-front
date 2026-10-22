// Sobe o backend para o teste de ponta a ponta: API simulada, banco novo numa pasta temporária
// e porta própria. Não lê backend/.env, para nunca usar a chave real da API num teste.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backend = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "backend");
const dados = mkdtempSync(path.join(tmpdir(), "tendra-e2e-"));
const env = { ...process.env, TENDRA_API_SIMULADA: "1", TENDRA_PASTA_DADOS: dados, TENDRA_PORTA: process.env.TENDRA_PORTA || "3100" };
delete env.ANTHROPIC_API_KEY;

const servidor = spawn(process.execPath, ["src/cli/servidor.ts"], { cwd: backend, env, stdio: "inherit" });
const parar = () => servidor.kill("SIGTERM");
process.on("SIGTERM", parar);
process.on("SIGINT", parar);
servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
