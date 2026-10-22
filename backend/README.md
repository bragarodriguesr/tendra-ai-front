# Backend da Tendra.ai

Backend do MVP descrito em [`docs/mvp-resposta-rfp/`](../docs/mvp-resposta-rfp/). Esta versão contém o esqueleto da etapa A2 do plano (configuração, armazenamento de arquivos e logs), a leitura da planilha de RFP da etapa A3 e a carga da base de conhecimento da etapa A4.

## Requisitos

- Node.js 24 ou mais recente.
- Variável de ambiente `ANTHROPIC_API_KEY` definida no sistema ou num arquivo `backend/.env` (veja `.env.example`), para os comandos que chamam a IA. O `.env` fica fora do controle de versão. A carga da base não usa a chave.

## Comandos

Execute a partir da pasta `backend/`:

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run verificar-config` | Confere a configuração. Sem uma variável obrigatória, termina com erro e mostra o nome dela |
| `npm run carregar-base -- <pasta> [--enviado-por <nome>]` | Carrega os `.md` da pasta (e subpastas) no banco local, no formato de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`, e imprime o resumo: carregados, atualizados, sem mudança, recusados com o motivo, avisos, ignorados e órfãos. Termina com código 1 se algum arquivo for recusado |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm test` | Roda os testes automáticos (sem chamadas reais à API da Anthropic) |

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/config/` | Leitura e validação das variáveis de ambiente |
| `src/armazenamento/` | Leitura e gravação de arquivos, sempre com nome gerado pelo backend |
| `src/documentos/` | Validação e leitura da planilha `.xlsx` de RFP, identificação das perguntas e do modelo de resposta (colunas de resposta e de comentário e lista de valores permitidos) |
| `config/` | Listas configuráveis, como os nomes aceitos para os cabeçalhos das colunas de pergunta, resposta e comentário (`cabecalhos.json`) |
| `src/base/` | Leitura e validação do cabeçalho dos `.md`, divisão em blocos com seção e linha, e a carga da base |
| `src/persistencia/` | Banco PGlite, migrações e acesso aos documentos e blocos |
| `migracoes/` | Esquema do banco, em arquivos `.sql` aplicados em ordem de nome |
| `src/observabilidade/` | Logs estruturados, sem a chave da API |
| `src/cli/` | Comandos de terminal |
| `test/unitarios/`, `test/integracao/` | Testes; o nome de cada um cita o cenário do SPEC que cobre |
| `test/fixtures/` | Planilhas sintéticas usadas nos testes |

Os dados locais (banco em `dados/banco`, planilhas, resultados, registros) ficam em `dados/`, na raiz do repositório, fora do controle de versão. Para experimentar a carga sem misturar com a base de trabalho, use outra pasta de dados, por exemplo `TENDRA_PASTA_DADOS=/tmp/tendra npm run carregar-base -- ../base-sintetica/pulse-beneficios/base`.

Criar o banco do zero leva alguns segundos (o PGlite inicializa o Postgres). Por isso os testes de integração reaproveitam um banco por arquivo.
