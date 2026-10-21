# Backend da Tendra.ai

Backend do MVP descrito em [`docs/mvp-resposta-rfp/`](../docs/mvp-resposta-rfp/). Esta versão contém o esqueleto da etapa A2 do plano (configuração, armazenamento de arquivos e logs) e a leitura da planilha de RFP da etapa A3.

## Requisitos

- Node.js 24 ou mais recente.
- Variável de ambiente `ANTHROPIC_API_KEY` definida no sistema ou num arquivo `backend/.env` (veja `.env.example`). O `.env` fica fora do controle de versão.

## Comandos

Execute a partir da pasta `backend/`:

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run verificar-config` | Confere a configuração. Sem uma variável obrigatória, termina com erro e mostra o nome dela |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm test` | Roda os testes automáticos (sem chamadas reais à API da Anthropic) |

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/config/` | Leitura e validação das variáveis de ambiente |
| `src/armazenamento/` | Leitura e gravação de arquivos, sempre com nome gerado pelo backend |
| `src/documentos/` | Validação e leitura da planilha `.xlsx` de RFP e identificação das perguntas |
| `config/` | Listas configuráveis, como os nomes aceitos para o cabeçalho da coluna de perguntas |
| `src/observabilidade/` | Logs estruturados, sem a chave da API |
| `src/cli/` | Comandos de terminal |
| `test/unitarios/`, `test/integracao/` | Testes; o nome de cada um cita o cenário do SPEC que cobre |
| `test/fixtures/` | Planilhas sintéticas usadas nos testes |

Os dados locais (planilhas, resultados, registros) ficam em `dados/`, na raiz do repositório, fora do controle de versão.
