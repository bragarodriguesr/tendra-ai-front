# Backend da Tendra.ai

Backend do MVP descrito em [`docs/mvp-resposta-rfp/`](../docs/mvp-resposta-rfp/). Esta versão contém o esqueleto da etapa A2 do plano (configuração, armazenamento de arquivos e logs), a leitura da planilha de RFP da etapa A3, a carga da base de conhecimento da etapa A4 (pela tela Base de conhecimento do front e por comando) o contexto, o cliente do Claude e a geração em lotes da etapa A5 a checagem das fontes e a saída da etapa A6, os alertas da etapa A7, o conflito entre fontes da etapa A8, as métricas da etapa A9 e a avaliação contra o gabarito da etapa A10, testados com a API simulada.

## Requisitos

- Node.js 24 ou mais recente.
- Variável de ambiente `ANTHROPIC_API_KEY` definida no sistema ou num arquivo `backend/.env` (veja `.env.example`), para os comandos que chamam a IA. O `.env` fica fora do controle de versão. O servidor da base e a carga não usam a chave.

## Comandos

Execute a partir da pasta `backend/`:

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run verificar-config` | Confere a configuração. Sem uma variável obrigatória, termina com erro e mostra o nome dela |
| `npm run servidor` | Sobe o backend em `http://127.0.0.1:3000` (porta em `TENDRA_PORTA`), só acessível nesta máquina, com as rotas da base de conhecimento e das tarefas usadas pelo front. Exige `ANTHROPIC_API_KEY`; sem a chave, use `TENDRA_API_SIMULADA=1 npm run servidor` para respostas **simuladas** (até a A1). Ao iniciar, marca como falha as tarefas interrompidas. Encerre com Ctrl+C |
| `npm run carregar-base -- <pasta> [--enviado-por <nome>] [--organizacao <id>]` | A mesma carga da tela, na base da organização (padrão: a inicial, Pulse Benefícios), a partir de uma pasta (e subpastas): grava os `.md` no banco local, no formato de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`, e imprime o resumo: carregados, atualizados, sem mudança, recusados com o motivo, avisos, ignorados e órfãos. Termina com código 1 se algum arquivo for recusado. Não roda com o servidor aberto |
| `npm run gerar-amostra -- <planilha.xlsx> [--limite 5]` | Verificação real da A5: gera respostas para as primeiras perguntas da planilha com a base ativa do banco e mostra cada uma com as fontes (`arquivo · seção · linha`). Grava as respostas brutas da API e o registro em `dados/amostras/`. **Chama a API real**: exige `ANTHROPIC_API_KEY` e tem custo |
| `npm run responder -- <planilha.xlsx> [--organizacao <id>]` | Processa a planilha com a base ativa da organização (padrão: a inicial; cenário 25): grava em `dados/resultados/<id>/` os itens no formato de `src/workspace/data.js` (`itens.json`), a planilha preenchida, os dados da tarefa e o registro de requisições. Em falha, grava só o motivo e o registro. **Chama a API real** |
| `npm run avaliar -- <resultado> [<resultado>...] [--momento base\|atualizacao] [--fidelidade <lista.xlsx>]` | Avalia um resultado do `responder` contra o gabarito sintético, com os critérios do SPEC, e grava `avaliacao.md` e `avaliacao.json` no resultado. Na primeira vez, gera `fidelidade.xlsx` para uma pessoa marcar se cada resposta diz o mesmo que os trechos citados. Com três resultados da mesma RFP, mede a consistência dos guardrails. Termina com código 1 quando algum critério é reprovado ou fica pendente. Não chama a IA |
| `npm run aceitacao -- <id-da-tarefa>` | Relatório de aceitação da tarefa (cenário 48): itens com e sem rascunho, aprovados, aprovados sem edição, porcentagem média de texto alterado e avaliações. Não roda com o servidor aberto |
| `npm run cadastrar-organizacao -- <nome>` | Fase K: cadastra uma organização (empresa usuária, cliente da Tendra.ai) e mostra o id dela, usado no `cadastrar-perfil`. Usa o banco da configuração (`DATABASE_URL` no modo compartilhado) |
| `npm run cadastrar-perfil -- <e-mail> <nome> <Revisor\|Aprovador> <id-da-organização>` | Fase D e K: liga uma conta já criada no Supabase Auth (painel → Authentication → Add user, já confirmada) ao nome, ao papel e à organização. Exige `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; rodar de novo atualiza e reativa o perfil, mas não muda a organização |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm test` | Roda os testes automáticos (sem chamadas reais à API da Anthropic) |

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/config/` | Leitura e validação das variáveis de ambiente |
| `src/armazenamento/` | Leitura e gravação de arquivos, sempre com nome gerado pelo backend: no disco local ou, no modo compartilhado, no bucket privado `rfps` do Supabase Storage |
| `src/autenticacao/` | Fase D: conferência de senha no Supabase Auth, sessões do backend (só o hash do identificador no banco) e cadastro de perfis |
| `src/documentos/` | Validação, leitura e preenchimento da planilha `.xlsx` de RFP, identificação das perguntas e do modelo de resposta (colunas de resposta e de comentário e lista de valores permitidos) |
| `config/` | Listas configuráveis: os nomes aceitos para os cabeçalhos das colunas de pergunta, resposta e comentário (`cabecalhos.json`) os termos críticos (`termos-criticos.json`) os preços dos modelos para o custo estimado (`precos.json`) e as pessoas que podem agir na revisão (`pessoas.json`, exceção E1) |
| `src/base/` | Leitura e validação do cabeçalho dos `.md`, divisão em blocos com seção e linha, e a carga da base (usada pela rota de envio e pelo comando) |
| `src/recuperacao/` | Contexto da geração: só documentos ativos, base vazia sem chamar a IA e teto de 25 MB e 400 mil tokens |
| `src/ia/` | Cliente da API do Claude (erros tipados, novas tentativas, registro sem conteúdo), instruções versionadas em `ia/instrucoes/` e a API simulada (`TENDRA_API_SIMULADA=1`) |
| `src/geracao/` | Geração em lotes com citações, separação das respostas pelos marcadores `[Pn]`, identificação de perguntas com IA e a chamada que aponta conflitos entre fontes |
| `src/rastreabilidade/` | Checagem das citações contra os blocos, localização `seção · linha N`, parágrafos ligados às fontes e estados dos itens |
| `src/regras/` | Alertas determinísticos: fonte com mais de 120 dias (`old`) e termo crítico na pergunta (`critical`) |
| `src/avaliacao/` | Gabarito, critérios de avaliação, lista de conferência da fidelidade e relatório |
| `src/revisao/` | Revisão persistida (editar, restaurar, reconhecer alerta, escolher fonte, marcar como revisado, aprovar, avaliar), eventos só de inclusão e relatório de aceitação |
| `src/fluxo/` | Processamento de uma tarefa, da planilha aos itens e à planilha preenchida, e a tarefa persistida no banco |
| `src/http/` | Servidor HTTP (Fastify), rotas de tarefas (`POST /api/tarefas`, `GET /api/tarefas`, `GET` e `DELETE /api/tarefas/:id` e, abaixo dele, `/itens`, `/planilha`, `/registro` e `/metricas`), rotas da revisão (texto, restaurar, `alertas/:tipo/reconhecer`, `fonte`, `revisar`, aprovar e avaliação de cada item; eventos, avaliações e aceitação da tarefa; `GET /api/pessoas`) e rotas da base: `GET /api/base/documentos`, `POST /api/base/documentos` (envio de `.md` em JSON, conteúdo em base64, até 10 MB e 100 arquivos) e `PATCH /api/base/documentos/:id` (ativar e desativar) |
| `src/persistencia/` | Banco (PGlite no modo local ou Postgres com `DATABASE_URL`, atrás da mesma interface), migrações e acesso aos documentos, blocos, tarefas, itens e registro |
| `migracoes/` | Esquema do banco, em arquivos `.sql` aplicados em ordem de nome |
| `src/observabilidade/` | Logs estruturados, sem a chave da API, e métricas por tarefa (duração, tokens, custo estimado, itens por estado e alerta) |
| `src/cli/` | Comandos de terminal, incluindo o que sobe o servidor |
| `test/unitarios/`, `test/integracao/` | Testes; o nome de cada um cita o cenário do SPEC que cobre |
| `test/fixtures/` | Planilhas sintéticas usadas nos testes e, em `ia/`, respostas reais da API gravadas pelo `gerar-amostra` |
| `test/apoio/` | API do Claude simulada e banco de teste (PGlite em memória ou, com `TENDRA_TESTE_DATABASE_URL`, um esquema próprio no Postgres) |

Os dados locais (banco em `dados/banco`, planilhas, resultados, registros) ficam em `dados/`, na raiz do repositório, fora do controle de versão. Para experimentar a carga sem misturar com a base de trabalho, use outra pasta de dados, por exemplo `TENDRA_PASTA_DADOS=/tmp/tendra npm run carregar-base -- ../base-sintetica/pulse-beneficios/base`.

A identidade de um documento é o nome do arquivo, sem a pasta: enviar de novo `seguranca.md`, pela tela ou pelo comando, atualiza o mesmo documento. Dois arquivos com o mesmo nome numa só carga são recusados.

O banco local aceita um processo por vez. O servidor e o comando abrem o banco com uma trava (`dados/banco.em-uso`); com o servidor aberto, o comando recusa a carga e pede para encerrá-lo. A trava de um processo que já terminou é descartada sozinha.

Criar o banco do zero leva alguns segundos (o PGlite inicializa o Postgres). Por isso os testes de integração reaproveitam um banco por arquivo.

### Modo compartilhado (fase D)

Com `TENDRA_MODO=compartilhado`, `npm run servidor` usa o Postgres (`DATABASE_URL`) e o Storage do Supabase, exige login (senha conferida no Supabase Auth, sessão própria do backend, 3 falhas seguidas em 15 minutos bloqueiam por e-mail e por IP), recusa pedidos sem HTTPS e alterações de outra origem que não `TENDRA_ORIGEM_DO_FRONT`, e ouve em `0.0.0.0` na porta `PORT`. As variáveis obrigatórias estão em `.env.example`; o plano está em `docs/mvp-resposta-rfp/PLAN_FASE_D.md`.

### Postgres (etapa D1 da fase D)

Com `DATABASE_URL` (por exemplo, a conexão do Supabase), os comandos e o servidor usam esse Postgres no lugar do PGlite em `dados/banco`, com as mesmas migrações e sem a trava de um processo por vez. Para rodar a suíte contra um Postgres, defina `TENDRA_TESTE_DATABASE_URL`: cada arquivo de teste de integração cria um esquema próprio e o apaga ao terminar. O CI roda a suíte nos dois bancos.
