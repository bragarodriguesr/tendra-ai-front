# Backend da Tendra.ai

Backend do MVP descrito em [`docs/mvp-resposta-rfp/`](../docs/mvp-resposta-rfp/). Esta versão contém o esqueleto da etapa A2 do plano (configuração, armazenamento de arquivos e logs), a leitura da planilha de RFP da etapa A3, a carga da base de conhecimento da etapa A4 (pela tela Base de conhecimento do front e por comando) e o contexto, o cliente do Claude e a geração em lotes da etapa A5, testados com a API simulada.

## Requisitos

- Node.js 24 ou mais recente.
- Variável de ambiente `ANTHROPIC_API_KEY` definida no sistema ou num arquivo `backend/.env` (veja `.env.example`), para os comandos que chamam a IA. O `.env` fica fora do controle de versão. O servidor da base e a carga não usam a chave.

## Comandos

Execute a partir da pasta `backend/`:

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run verificar-config` | Confere a configuração. Sem uma variável obrigatória, termina com erro e mostra o nome dela |
| `npm run servidor` | Sobe o servidor da base em `http://127.0.0.1:3000` (porta em `TENDRA_PORTA`), só acessível nesta máquina. É ele que a tela Base de conhecimento usa para listar, receber os `.md` de "Subir documentos" e ativar ou desativar documentos. Encerre com Ctrl+C |
| `npm run carregar-base -- <pasta> [--enviado-por <nome>]` | A mesma carga da tela, a partir de uma pasta (e subpastas): grava os `.md` no banco local, no formato de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`, e imprime o resumo: carregados, atualizados, sem mudança, recusados com o motivo, avisos, ignorados e órfãos. Termina com código 1 se algum arquivo for recusado. Não roda com o servidor aberto |
| `npm run gerar-amostra -- <planilha.xlsx> [--limite 5]` | Verificação real da A5: gera respostas para as primeiras perguntas da planilha com a base ativa do banco e mostra cada uma com as fontes (`arquivo · seção · linha`). Grava as respostas brutas da API e o registro em `dados/amostras/`. **Chama a API real**: exige `ANTHROPIC_API_KEY` e tem custo |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm test` | Roda os testes automáticos (sem chamadas reais à API da Anthropic) |

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/config/` | Leitura e validação das variáveis de ambiente |
| `src/armazenamento/` | Leitura e gravação de arquivos, sempre com nome gerado pelo backend |
| `src/documentos/` | Validação e leitura da planilha `.xlsx` de RFP, identificação das perguntas e do modelo de resposta (colunas de resposta e de comentário e lista de valores permitidos) |
| `config/` | Listas configuráveis, como os nomes aceitos para os cabeçalhos das colunas de pergunta, resposta e comentário (`cabecalhos.json`) |
| `src/base/` | Leitura e validação do cabeçalho dos `.md`, divisão em blocos com seção e linha, e a carga da base (usada pela rota de envio e pelo comando) |
| `src/recuperacao/` | Contexto da geração: só documentos ativos, base vazia sem chamar a IA e teto de 25 MB e 400 mil tokens |
| `src/ia/` | Cliente da API do Claude (erros tipados, novas tentativas, registro sem conteúdo) e instruções versionadas em `ia/instrucoes/` |
| `src/geracao/` | Geração em lotes com citações, separação das respostas pelos marcadores `[Pn]` e identificação de perguntas com IA |
| `src/http/` | Servidor HTTP (Fastify) e rotas da base: `GET /api/base/documentos`, `POST /api/base/documentos` (envio de `.md` em JSON, conteúdo em base64, até 10 MB e 100 arquivos) e `PATCH /api/base/documentos/:id` (ativar e desativar) |
| `src/persistencia/` | Banco PGlite, migrações e acesso aos documentos e blocos |
| `migracoes/` | Esquema do banco, em arquivos `.sql` aplicados em ordem de nome |
| `src/observabilidade/` | Logs estruturados, sem a chave da API |
| `src/cli/` | Comandos de terminal, incluindo o que sobe o servidor |
| `test/unitarios/`, `test/integracao/` | Testes; o nome de cada um cita o cenário do SPEC que cobre |
| `test/fixtures/` | Planilhas sintéticas usadas nos testes e, em `ia/`, respostas da API (as `.simulada.json` foram montadas à mão e serão trocadas por respostas reais) |
| `test/apoio/` | API do Claude simulada para os testes |

Os dados locais (banco em `dados/banco`, planilhas, resultados, registros) ficam em `dados/`, na raiz do repositório, fora do controle de versão. Para experimentar a carga sem misturar com a base de trabalho, use outra pasta de dados, por exemplo `TENDRA_PASTA_DADOS=/tmp/tendra npm run carregar-base -- ../base-sintetica/pulse-beneficios/base`.

A identidade de um documento é o nome do arquivo, sem a pasta: enviar de novo `seguranca.md`, pela tela ou pelo comando, atualiza o mesmo documento. Dois arquivos com o mesmo nome numa só carga são recusados.

O banco local aceita um processo por vez. O servidor e o comando abrem o banco com uma trava (`dados/banco.em-uso`); com o servidor aberto, o comando recusa a carga e pede para encerrá-lo. A trava de um processo que já terminou é descartada sozinha.

Criar o banco do zero leva alguns segundos (o PGlite inicializa o Postgres). Por isso os testes de integração reaproveitam um banco por arquivo.
