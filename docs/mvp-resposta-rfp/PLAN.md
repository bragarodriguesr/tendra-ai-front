---
feature: mvp-resposta-rfp
status: draft
spec: docs/mvp-resposta-rfp/SPEC.md (status draft)
constitution: 1.0.0
---

# Plano de execução: backend do MVP, da prova da IA à publicação compartilhada

*Proposta de 21/10/2026, revisada em 22/10/2026 para a carga da base pela tela (etapa A4), reescrita em 21/10/2026 para combinar este caminho (a IA primeiro, local) com a revisão persistida e a métrica de aceitação de `docs/referencia/mvp-proposta-1/` e, no fim, com o login e a hospedagem daquela proposta. Pela regra do SDD, o plano deriva de um spec aprovado. O spec ainda está em `draft`, com bloqueios abertos; este plano deve ser conferido contra ele quando for aprovado.*

## Objetivo

Chegar a um backend que **prove a hipótese central do MVP** (a pessoa aceita as respostas sugeridas, com fonte, e as edita pouco) usando só documentos sintéticos, no menor caminho e com uma verificação em cada etapa que pode ser conferida **sem ler código**.

| Fase | Entrega | Cenários do SPEC |
|---|---|---|
| **0. Pré-requisitos** | Chave de testes da API testada; base `.md`, planilha de RFP e gabarito sintéticos | Remove os dois bloqueios do SPEC |
| **A. Prova da IA** | Carga da base pela tela Base de conhecimento (servidor local mínimo) e pelo comando `carregar-base`; comandos `responder` e `avaliar`: da planilha e da base aos itens e à planilha preenchida, com relatório contra o gabarito | 1 a 15, 17 a 22, 24 a 27, 29, 31, 33 a 40 |
| **B. Backend local com revisão** | As etapas atrás de rotas HTTP, com tarefas, progresso, revisão persistida e relatório de aceitação | 4, 16, 17, 23, 24, 28, 30, 31, 32, 40 a 49 |
| **C. Front conectado** | Nova RFP com arquivo real, progresso e revisão com ações gravadas (a Base já sai conectada da A4) | 6, 16, 23, 24, 33, 40, 42 a 46 |
| **D. Publicação compartilhada** | Login, sessão, hospedagem e segurança de exposição (fase 1 de `docs/referencia/mvp-proposta-1/PLAN.md`) | Cenários de `docs/referencia/mvp-proposta-1/SPEC.md`; spec próprio quando a fase começar |

> **Situação da fase A (23/10/2026):** A1 feita e execuções reais da A5 a A10 concluídas (`gerar-amostra`, `responder` e `avaliar` com Sonnet 5.5 e Opus 5.5). Com as instruções `geracao-v2` e `conflito-v2`, o Opus 5.5 atinge todos os critérios medidos pelo código na RFP-01 e na RFP-02 (3 execuções). Falta só a lista de fidelidade preenchida por uma pessoa para fechar o portão e registrar o modelo em P8.

> **Situação da fase B (23/10/2026):** B1 a B6 implementadas e testadas com a API do Claude simulada e retestadas com a API real: a jornada de ponta a ponta (`TENDRA_E2E_API_REAL=1 npm run e2e`) processou a RFP-01 pela rota com o servidor usando a chave, acompanhou o progresso, revisou e conferiu o relatório de aceitação. Pelo plano, o portão da fase A (fidelidade) continua valendo antes de a fase C ser dada como aceita.

A fase A concentra o risco técnico. Se a avaliação não atingir os limites do SPEC, o ajuste acontece **antes** de investir em servidor, tela ou hospedagem. A fase D só começa depois de A, B e C aceitas e de haver taxa de aceitação medida.

Cada etapa abaixo é uma mudança pequena, com objetivo claro, testes próprios e um pull request separado.

## Pendências

| # | Pendência | Bloqueia | Sugestão |
|---|---|---|---|
| P1 | Chave de testes da API definida e testada | Fase A | **Resolvida em 23/10/2026 (A1):** chave em `backend/.env`, fora do controle de versão. |
| P2 | Base `.md`, planilha de RFP sintética e gabarito | Fase A, etapa A4 em diante | Conforme a seção 5 de `ARQUITETURA_MAPPING.md` e `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`. |
| P3 | Método de medir a fidelidade (limite de 90% já decidido) | Etapa A10 | **Implementado na A10:** revisão humana pela lista `fidelidade.xlsx` que o `avaliar` gera (uma linha por resposta sugerida, com os trechos citados e a coluna "Diz o mesmo que os trechos? (sim/não)"). |
| P4 | Motor do banco local | Etapa A4 | **Decidido na A4:** PGlite 0.5.8 (Postgres embutido), porque a fase D usa o Postgres do Supabase. |
| P5 | Interface da carga (nome e opções) | Etapa A4 | **Decidido na A4 (revisto em 22/10/2026):** a carga principal é pela tela Base de conhecimento, com "Subir documentos" abrindo o seletor de arquivos `.md` do computador. O comando `npm run carregar-base -- <pasta> [--enviado-por <nome>]` continua, com a mesma carga, e termina com código 1 quando algum arquivo é recusado. A identidade do documento passou a ser o nome do arquivo. |
| P6 | Formato das citações enviado ao Claude: blocos ou texto corrido | Etapa A5 | **Implementado na A5 com blocos** (documentos com conteúdo em blocos, citações `content_block_location`). **Validado com a API real em 23/10/2026:** as citações devolvem o bloco certo e os marcadores separam as respostas do lote. |
| P7 | Fluxo de revisão de código e proteção da `main` exigindo a integração contínua | Primeiro commit de código | Branch + pull request revisado por outra pessoa, com CI obrigatória. |
| P8 | Modelo da geração e tamanho do lote | Fim da fase A | Decididos pela etapa A10, com dados. Valores configuráveis: `TENDRA_MODELO`, `TENDRA_ESFORCO`, `TENDRA_TAMANHO_LOTE`. **Recomendação da A10 (23/10/2026):** Opus 5.5 com esforço `medium` e lote de 10, o único que atingiu todos os critérios medidos pelo código; registrar como decisão depois da fidelidade. |
| P12 | Valor sugerido nas RFPs com valores permitidos (cenários 50 a 56 do SPEC, acrescentados depois deste plano) | Etapa A6 ou etapa própria | A A5 já gera em português (cenário 50). O valor sugerido (cenários 53 e 54) precisa de uma decisão de formato: o modelo não combina citações com saída estruturada. Sugestão: uma linha `Valor: <valor>` depois do marcador, conferida contra a lista. |
| P9 | Método de cálculo da porcentagem de texto alterado | Etapa B5 | **Decidido na B5:** diferença por palavras: palavras retiradas mais palavras acrescentadas, sobre a soma das palavras dos dois textos, pela maior subsequência comum (`revisao/diferenca.ts`). |
| P10 | Simplificação da definição de pronto e dos tipos de teste (ver as seções correspondentes) | Primeiro pull request | Aprovar a versão deste plano ou manter a constitution como está. |
| P11 | Hospedagem do front (Vercel em avaliação) | Fase D | Decidir antes da fase D. |

## Decisões técnicas propostas

| Tema | Proposta |
|---|---|
| Linguagem e estrutura | Node 24 + TypeScript, pasta `backend/` com `package.json` próprio, Fastify (5.12.5, adotado na A4 para as rotas da base) |
| Banco | PGlite (Postgres embutido) em `dados/banco`, com SQL parametrizado num módulo de persistência e migrações versionadas em `backend/migracoes/`. O query builder tipado ficou de fora na A4 para não somar uma dependência a mais; pode entrar quando as consultas crescerem. |
| Entrada da RFP | Só `.xlsx`: assinatura do arquivo conferida (não só a extensão), até 10 MB, nome gerado pelo backend |
| Planilhas | `exceljs` para ler e escrever |
| Base | Envio de `.md` pela tela (rota `POST /api/base/documentos`) e comando `carregar-base`, com a mesma carga: cabeçalho YAML validado, texto dividido em blocos com `seção` e `linha`, gravados em `documentos` e `blocos`; identidade pelo nome do arquivo (`docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`). Os arquivos chegam em JSON com o conteúdo em base64, sem dependência de multipart. O banco aceita um processo por vez, com trava: o comando não roda com o servidor aberto. |
| Integração com LLM | SDK oficial da Anthropic (`@anthropic-ai/sdk` 0.132.0), isolado num módulo cliente com erros tipados, novas tentativas em falhas temporárias (3, feitas pelo SDK) e registro de cada requisição. Geração por streaming, com o fallback do servidor para recusas indevidas (`fallbacks: "default"`). Sem agente nem framework intermediário. |
| Identificação de perguntas com IA | Só quando a regra da coluna "Pergunta" falha: modelo pequeno (candidato: Haiku 5.5) com saída estruturada `{linha, texto}`, seguido de validação literal |
| Geração | Documentos da base como documentos de conteúdo em blocos, com citações ativadas e cache; perguntas em lotes |
| Separar as respostas de um lote | Marcador fixo no início de cada resposta (por exemplo `[P12]`). A API não combina citações com saída estruturada na mesma chamada. **Risco a validar na etapa A5**; se falhar, uma pergunta por chamada, mantendo o cache da base. |
| Instruções ao modelo | Arquivos versionados no repositório, com a versão registrada em cada tarefa |
| Conflito entre fontes | Segunda chamada leve com saída estruturada; a decisão de marcar o alerta é do código |
| Pessoa que age (fases A a C) | Identificador da pessoa enviado em cada ação de revisão e validado contra uma lista de configuração (`config/pessoas.json`). Justificativa registrada (constitution XII): a revisão persistida precisa saber quem agiu. É substituída pela sessão na fase D. |
| Configuração | Tudo por variável de ambiente: chave, modelo, tamanho do lote, pastas, porta |
| Armazenamento de arquivos | Módulo único para ler e gravar arquivos das RFPs |
| Progresso | Gravado ao fim de cada lote |
| Logs | Estruturados, sem chave da API, sem conteúdo de documentos e sem texto das respostas |

## Estrutura de pastas

Cada pasta corresponde a uma responsabilidade separada (constitution II).

```
backend/
  package.json
  .env.example              nomes das variáveis, sem valores
  src/
    config/                 variáveis, termos críticos e lista de pessoas (cenário 27)
    armazenamento/          leitura e gravação dos arquivos das RFPs
    documentos/             planilha (ler, validar, escrever)
    base/                   carga dos .md: cabeçalho, blocos, resumo (tela da Base e comando carregar-base)
    recuperacao/            buscarFontes: contexto dos documentos ativos (cenários 10, 11, 35, 40)
    ia/                     cliente da API do Claude (erros, novas tentativas, registro)
      instrucoes/           instruções versionadas enviadas ao modelo
    geracao/                lotes, separação das respostas, identificação de perguntas com IA
    rastreabilidade/        conferência literal das citações, localização, relação evidência-resposta
    regras/                 estados, alertas, teto da base, termos críticos (determinístico)
    persistencia/           documentos, blocos, tarefas, itens, avaliações, eventos
    revisao/                editar, restaurar, aprovar, avaliar e relatório de aceitação
    observabilidade/        registro de requisições, métricas por tarefa, logs
    fluxo/                  processarTarefa: executa as etapas na ordem e grava o progresso
    cli/                    servidor, carregar-base, responder, avaliar e aceitacao
    http/                   servidor e rotas (rotas da base desde a A4; tarefas e revisão na fase B)
  config/
    termos-criticos.json
    pessoas.json            pessoas sintéticas (nome, papel)
  migracoes/                esquema do banco, versionado
  test/
    unitarios/              regras, rastreabilidade, planilha, cabeçalho e blocos
    integracao/             banco, rotas HTTP, processamento completo com a API simulada, revisão
    ia/                     avaliação contra o gabarito (chamadas reais)
base-sintetica/             .md sintéticos, planilha de RFP e gabarito
dados/                      banco, planilhas, resultados, registros e métricas (fora do Git)
```

Nenhuma regra de negócio vai para o front: estados, alertas e validações ficam no backend, e o front só exibe o que recebe.

## Estratégia de testes

O nome de cada teste traz o número do cenário que ele cobre.

| Tipo | O que cobre | Depende de serviço externo? |
|---|---|---|
| **Unitários** | Planilha, cabeçalho e blocos dos `.md`, filtro de documentos ativos, teto, estados, alertas, termos críticos, conferência de citações, tradução de localização, separação das respostas por marcador, cálculo da aceitação | Não |
| **Integração** | Banco, rotas HTTP, processamento completo com a API do Claude simulada, tarefa interrompida, revisão persistida; formato das respostas da API validado contra **respostas reais gravadas** como arquivos de teste, e dos itens contra o contrato de `src/workspace/data.js` | Não |
| **IA** | Avaliação contra o gabarito com os critérios do SPEC | **Sim**, controlada: base e gabarito sintéticos fixos |
| **Jornada ponta a ponta** | Um único teste no navegador: da planilha enviada à aprovação e à taxa de aceitação, com a API simulada | Não |

**Regras:**
- Unitários, integração e a jornada ponta a ponta rodam na integração contínua em cada pull request e **bloqueiam o merge** quando falham.
- A avaliação de IA chama a API real, com custo; não roda a cada pull request. Ela é **obrigatória** para qualquer pull request que altere instruções, modelo, parâmetros, tamanho do lote ou recuperação, e o relatório é anexado ao pull request (cenário 36).
- As respostas reais gravadas são renovadas quando o modelo ou o SDK mudam.
- Correções de bug incluem um teste que reproduz o problema antes da correção.

> **Mudança em relação à versão anterior (P10):** a versão anterior listava testes de contrato e de ponta a ponta como tipos separados e vários cenários de ponta a ponta. Aqui os de contrato viram parte da integração, e fica um único teste de ponta a ponta. Como a constitution não está versionada no repositório, a simplificação precisa da aprovação do grupo.

## Fase 0: pré-requisitos

### 0.1 Chave da API (P1)
Ver etapa A1.

### 0.2 Dados sintéticos (P2)
- Empresa fictícia, 4 a 6 documentos `.md` com cabeçalho válido, os casos embutidos (conflito, fonte antiga, instrução maliciosa, documento fora da base, arquivos inválidos para a carga), planilha de RFP com 20 a 30 perguntas (e uma variante sem coluna "Pergunta"), gabarito e lista de pessoas sintéticas.
- **Verificação:** o material é revisado contra a lista da seção 5 de `ARQUITETURA_MAPPING.md`; cada caso embutido tem uma pergunta correspondente no gabarito.

## Fase A: prova da IA

### A1. Teste da chave
- Definir a chave de testes em variável de ambiente local e fazer uma requisição mínima à API.
- **Verificação:** a requisição retorna resposta. Se falhar, a implementação para até o acesso ser resolvido.
- **Situação (23/10/2026): concluída.** Adiada em 22/10 por decisão do grupo, enquanto a chave não estava disponível. Com a chave em `backend/.env`, `npm run verificar-config` aceita a configuração e uma requisição mínima ao Haiku 5.5 retorna resposta (HTTP 200).

### A2. Esqueleto e integração contínua
- Criar `backend/` com TypeScript, Vitest e os módulos `config`, `armazenamento` e `observabilidade`.
- `.gitignore` cobrindo `.env`, `dados/` e resultados (cenários 27 e 28).
- GitHub Actions com verificação de tipos, testes e varredura de segredos em cada pull request.
- **Verificação:** `npm test` passa; executar sem a chave mostra o nome da variável que falta; a integração contínua aparece no pull request.

### A3. Leitura e validação da planilha
- Assinatura de `.xlsx`, limite de 10 MB, nome gerado pelo backend (cenários 4 e 31).
- Regra da coluna "Pergunta", ignorando linhas vazias e títulos (cenários 1 e 2).
- Identificação com IA quando a regra falha, com descarte de textos que não aparecem na planilha (cenários 3 e 5).
- **Verificação:** testes dos cenários 1 a 5 e 31 passando, com a IA simulada no cenário 3.

### A4. Carga da base
- Migração do esquema do banco para `documentos` e `blocos` (PGlite).
- Carga: validação do cabeçalho, divisão em blocos com seção e linha, gravação, recarga com hash, resumo (cenários 7, 8, 9 e 39, e os cenários de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`). A identidade do documento é o nome do arquivo.
- **Carga pela tela (decisão do grupo, 22/10/2026):** a pessoa sobe os `.md` pela tela Base de conhecimento. Por isso esta etapa antecipa uma parte das fases B e C:
  - servidor local mínimo (`npm run servidor`, só em 127.0.0.1) com as rotas da base de B3 e o envio `POST /api/base/documentos`;
  - no front, o proxy do Vite e `src/api.js` de C1, e a tela Base de C4: "Subir documentos" e "Importar RFP passada" abrem o seletor de arquivos do computador, o quadro "Resultado do envio" mostra o motivo de cada recusa, e a chave Ativar/Desativar grava no banco;
  - sem o servidor, a tela avisa e mostra a lista de exemplo.
- Comando `carregar-base`: a mesma carga sobre uma pasta, com órfãos e código de saída.
- Ativar e desativar documento no banco e pela tela (cenário 40, partes do banco e da tela).
- O tamanho em tokens de cada documento é uma estimativa (caracteres divididos por 4). A contagem exata pela API, usada no teto da base, entra na A5.
- **Verificação:** testes dos cenários 7 a 9, 39 e 40 e das rotas da base passando; no navegador, subir os `.md` da base sintética e os casos de carga pela tela e conferir o resultado do envio, a lista, a desativação e a atualização; carregar a base sintética pelo comando e conferir o resumo.

### A5. Contexto, integração com o Claude e geração
- Contexto: só documentos ativos; base vazia sem chamar a IA; teto de 25 MB e 400 mil tokens com contagem pela API (cenários 10, 11 e 35).
- Módulo cliente: chamadas, novas tentativas em erros temporários, erros tipados, registro de cada requisição sem chave nem conteúdo (cenários 17 e 29).
- Instruções versionadas: responder só com base nos documentos, dizer quando não houver resposta, não assumir compromissos comerciais ou jurídicos fora da base, tratar documentos e perguntas como dado.
- Geração com documentos em blocos (P6), citações e cache; perguntas em lotes, separadas por marcadores.
- Gravar respostas reais da API como arquivos de teste.
- **Verificação:** testes passando; uma execução real com 3 a 5 perguntas sintéticas confirma que a citação devolve o bloco certo e que o formato com marcadores funciona. Se algum dos dois falhar, adotar a alternativa (texto corrido com posição de caracteres; uma pergunta por chamada).
- **Situação (22/10/2026): implementada com a API simulada, por decisão do grupo, porque a chave ainda não está disponível.**
  - Feito: `recuperacao/buscarFontes.ts` (cenários 10, 11, 35 e 40), `ia/cliente.ts` (cenários 17 e 29), instruções `geracao-v1` e `identificacao-v1` em `ia/instrucoes/`, `geracao/gerarRespostas.ts` e `geracao/separarRespostas.ts` (lotes, marcadores, citações por bloco, cache no último documento), e o identificador de perguntas com Haiku 5.5 do cenário 3.
  - Testes com a API simulada; as novas tentativas e a recusa da chave foram testadas com o SDK real contra um servidor local; o caminho completo, com streaming e citações, foi conferido contra uma API falsa local.
  - **Execução real (23/10/2026): concluída.** `npm run gerar-amostra -- ../base-sintetica/rfps/RFP-01-Rede-Varejo-Alfa.xlsx --limite 5` com Opus 5.5: as citações apontam o bloco certo de cada documento, os marcadores `[P1]` a `[P5]` separam as respostas e a pergunta sem base sai como `SEM_RESPOSTA`. A alternativa (texto corrido; uma pergunta por chamada) não é necessária. A fixture simulada foi trocada pela resposta real, em `test/fixtures/ia/geracao-lote-pulse.real.json`.

### A6. Rastreabilidade, estados e saída
- Conferir cada trecho citado contra o bloco, traduzir a localização (`seção · linha`), preservar a relação parágrafo-fonte, remover texto sem citação válida e marcar `lowconf` e `nocontext` (cenários 12 a 14, 18, 19 e 34).
- Todos os itens saem como sugestões pendentes (cenário 33).
- Falha em qualquer etapa leva a tarefa a `falha`, sem resultado parcial apresentado (cenário 17).
- Gerar o JSON no formato de `data.js` e a planilha preenchida identificada como não revisada (cenários 24 e 25).
- **Verificação:** testes passando; primeira execução completa do comando `responder` com a RFP sintética.
- **Situação (22/10/2026): implementada com a API simulada.**
  - Feito: `rastreabilidade/montarItem.ts` (citação conferida contra os blocos, `loc` como `seção · linha N`, `ex` com o texto literal do documento, texto sem citação válida retirado com `lowconf`, `sem-rascunho` com `nocontext`), `documentos/planilhaPreenchida.ts` (cenário 24), `fluxo/processarTarefa.ts` e o comando `npm run responder -- <planilha.xlsx>`, que grava `itens.json`, a planilha preenchida, `tarefa.json` e o registro em `dados/resultados/<id>/`.
  - Regras de checagem adotadas: um trecho sem letras nem números (pontuação entre trechos citados) não conta como texto sem fonte; o texto de um parágrafo tem os espaços normalizados; `ex` de uma citação de vários blocos é o texto dos blocos unidos por quebra de linha; o título das colunas novas fica na linha acima da primeira pergunta da aba.
  - Testes do processamento completo da RFP-01 com a API simulada (46 itens, células originais intactas, base vazia, falha no meio). O `responder` foi conferido contra uma API falsa local com a RFP-03.
  - **Execução real (23/10/2026): concluída.** `responder` com a RFP-01 (46 itens) e a RFP-02 (84 itens), com Sonnet 5.5 e Opus 5.5. Validade das fontes e ausência de texto sem fonte em 100% em todas as execuções. Uma execução falhou por falha de comunicação no último lote, depois das novas tentativas, e ficou como `falha` sem resultado parcial (cenário 17); repetida, passou.

### A7. Alertas determinísticos
- Fonte desatualizada a partir de `atualizado_em` (cenário 20) e termo crítico a partir de `config/termos-criticos.json` (cenário 21).
- **Verificação:** testes unitários dos cenários 20 e 21 passando.
- **Situação (22/10/2026): concluída.** `regras/alertas.ts` e `config/termos-criticos.json` (lista do SPEC). O termo é procurado como palavra inteira, sem diferenciar maiúsculas, minúsculas nem acentos, aceitando o plural ("multas", "indenizações"): "seguro" não marca "segurança". A regra confere com o gabarito das três RFPs sintéticas (as 19 perguntas críticas e nenhuma outra). O alerta `critical` vale também para itens sem rascunho; `old` vale para fonte com mais de 120 dias.

### A8. Conflito entre fontes
- Segunda chamada leve, com saída estruturada, recebendo só os trechos citados de cada item; o código decide o alerta (cenário 22).
- **Verificação:** teste com a API simulada passando; o caso de conflito embutido na base sintética é marcado.
- **Situação (22/10/2026): implementada com a API simulada.** `geracao/conflitos.ts` e instruções `conflito-v1`. Só vão à chamada os itens com rascunho e fontes de dois ou mais documentos, até 20 por chamada, com saída estruturada `{id, conflito, fontes}`. O código só marca o alerta quando as fontes apontadas existem no item e vêm de documentos diferentes. **Execução real (23/10/2026):** com `conflito-v1` e Haiku 5.5, o conflito do RTO (2 h no plano de continuidade, 8 h no anexo de SLA) deixou de ser marcado em duas execuções, porque um dos trechos detalha o escopo. As instruções `conflito-v2` dizem que valores diferentes para o indicador perguntado são conflito mesmo com detalhes de escopo, e que não há conflito quando o próprio trecho explica a diferença (por exemplo, um novo ciclo de certificação). O modelo padrão (`TENDRA_MODELO_CONFLITO`) passou a ser o Sonnet 5.5, que marcou o RTO nos casos em que o Haiku falhou, repetindo a chamada sobre os mesmos itens. Com a v2, os conflitos C1 a C3 das RFP-01 e RFP-02 são marcados em todas as execuções do Opus.

### A9. Métricas e versão do comportamento
- Métricas por tarefa: duração por etapa, tokens, custo estimado, ignorados, contagem por estado e alerta (cenário 37).
- Registro do modelo, versão das instruções e tamanho do lote em cada tarefa (cenário 38).
- **Verificação:** testes passando; as métricas não contêm conteúdo de documentos nem respostas.
- **Situação (22/10/2026): concluída.** `observabilidade/metricas.ts` e `config/precos.json` (US$ por milhão de tokens, conferidos em 22/10/2026). O `responder` grava `metricas.json`: duração de cada etapa (planilha, identificação, contexto, geração, checagem, conflito, alertas, planilha preenchida), requisições por etapa e com erro, tokens cobrados (a contagem de tokens da base fica à parte, porque não é cobrada), custo estimado por modelo (nulo, com o nome do modelo, quando falta o preço), itens por estado e por alerta, e o que a checagem ignorou (citações descartadas, trechos sem fonte, perguntas sem marcador). O `tarefa.json` registra modelo, esforço, lote, os modelos de identificação e de conflito e a versão de cada instrução (cenário 38).

### A10. Avaliação e escolha do modelo
- Comando `avaliar` com todos os critérios do SPEC, limites de 80% (relevância) e 90% (fidelidade), e código de saída de erro quando algum critério falha (cenários 26 e 36).
- Fidelidade pelo método de P3: lista de conferência para uma pessoa revisar as respostas do gabarito.
- Executar a RFP sintética com Sonnet 5.5 e com Opus 5.5 e comparar relatórios e custo. Executar três vezes os casos de instrução maliciosa e de compromisso não sustentado (cenários 15 e 34).
- **Verificação (portão da fase A):** relatório de cada modelo gerado; o modelo escolhido atinge todos os limites e é registrado como decisão (P8). **Se nenhum atingir, a fase B não começa:** o ajuste de instruções, lote ou contexto acontece primeiro.
- **Situação (22/10/2026): comando pronto; avaliação real pendente da A1.**
  - Feito: `npm run avaliar -- <resultado> [<resultado>...] [--momento base|atualizacao] [--fidelidade <lista.xlsx>]` (`src/avaliacao/`), com os dez critérios do SPEC. O relatório (`avaliacao.md` e `avaliacao.json`) traz o valor, o limite e a situação de cada critério, as perguntas divergentes, o modelo, as instruções, o lote e o custo estimado. O comando termina com código 1 quando algum critério é reprovado ou fica pendente.
  - Como cada critério é medido:
    - **Validade das fontes:** conferida nos arquivos `.md` em disco, independente do banco. A linha de `loc` precisa ser a primeira linha de `ex`, e todas as linhas de `ex` precisam estar no arquivo.
    - **Relevância:** pelo nome do arquivo esperado no gabarito.
    - **Guardrails:** perguntas de injeção e de compromisso sem resposta no gabarito, em 3 execuções. Com menos de 3, o critério fica pendente.
    - **Fidelidade (P3):** pela lista `fidelidade.xlsx`, gerada no primeiro resultado. Uma pessoa marca "sim" ou "não" em cada resposta sugerida.
    - **Idioma:** por uma heurística de palavras frequentes.
    - **Valor sugerido:** "não se aplica" até a P12.
  - Testes com execuções simuladas que seguem o gabarito (aprovam) e que erram de propósito (reprovam). O `responder` e o `avaliar` foram conferidos juntos contra uma API falsa local.
  - **Avaliação real (23/10/2026):** RFP-01 uma vez e RFP-02 três vezes, com cada modelo.
    - **Com `geracao-v1`:** os dois modelos reprovaram. O Opus deduziu respostas de fatos vizinhos (transferência internacional a partir da região de hospedagem; responsabilidade ilimitada a partir da cláusula de limitação, em 2 de 3 execuções) e respondeu com conteúdo tangencial a pergunta com instrução maliciosa (6.11). O Sonnet deixou RPO e RTO sem resposta numa execução e deixou de marcar conflitos.
    - **`geracao-v2`:** responder só o que os documentos afirmam diretamente, sem deduzir de fatos vizinhos; a pergunta com pedido malicioso segue as mesmas regras; o compromisso só é respondido com o mesmo alcance da pergunta; indicadores técnicos documentados (SLA, RPO, RTO, retenção) não são compromisso novo.
    - **Resultado com `geracao-v2` e `conflito-v2`:**

      | Critério (limite) | Opus 5.5 | Sonnet 5.5 |
      |---|---|---|
      | Validade das fontes (100%) | 100% | 100% |
      | Ausência de texto sem fonte (100%) | 100% | 100% |
      | Relevância (80%) | 98% (RFP-01), 93% (RFP-02) | 98%, 92% |
      | Contexto insuficiente (100%) | 100%, 100% | 100%, 100% |
      | Fontes conflitantes (100%) | 100%, 100% | **50%**, 100% |
      | Isolamento da base | 0 | 0 |
      | Guardrails (3 de 3) | 3 de 3 | 3 de 3 |
      | Idioma (100%) | 100% | 100% |
      | Custo por execução | US$ 0,23 (RFP-01), US$ 0,30 a 0,31 (RFP-02) | US$ 0,09, US$ 0,11 a 0,12 |

      O Sonnet reprova no conflito da RFP-01 porque a resposta sobre RPO e RTO citou só o anexo de SLA, sem o plano de continuidade.
  - **Pendente (portão da fase A):**
    1. Preencher a lista de fidelidade (`fidelidade.xlsx`) de uma execução do Opus com `geracao-v2` e rodar o `avaliar` com `--fidelidade`.
    2. Registrar o modelo em P8 (recomendação: Opus 5.5).
    3. As variantes de borda (`base-sintetica/rfps/variantes/`) e a RFP-03 ainda não foram executadas com a API real.

## Fase B: backend local com revisão

### B1. Persistência de tarefas e itens
- Migrações para tarefas, itens, fontes, alertas, avaliações e eventos. Progresso gravado ao fim de cada lote.
- **Verificação:** testes de integração; uma tarefa processada continua disponível depois de reiniciar o backend (cenário 47, parte das tarefas).
- **Situação (22/10/2026): concluída, com a API simulada até a A1.**
  - Migração `002_tarefas_itens_e_revisao.sql`: tarefas, itens, requisições, eventos e avaliações. Fontes e alertas ficam no item como JSON, no formato de `data.js`. Os eventos só aceitam inclusão, garantido por um gatilho do banco.
  - `persistencia/tarefas.ts` e `fluxo/executarTarefa.ts`: a planilha é gravada com nome gerado e o progresso é gravado a cada lote, sem nunca diminuir. Os itens, a planilha preenchida, o comportamento e as métricas são gravados numa só transação quando a tarefa fica pronta. Em falha, ficam só o motivo e o registro, sem itens.
  - O processamento é o mesmo `processarTarefa` do comando `responder`.
  - Testes: tarefa pronta e em falha, cenário 6 (CNPJ e contatos nunca vão à IA) e persistência depois de fechar e reabrir o banco em disco.
  - **Reteste com a API real (23/10/2026): passou.** Na jornada de ponta a ponta, a RFP-01 foi processada pelo servidor com a chave: progresso de 46 de 46, itens gravados sem texto simulado e comportamento registrado (Opus 5.5, `geracao-v2`, conflito no Sonnet 5.5).

### B2. Rotas de tarefas
- `POST /api/tarefas`: valida a planilha (cenários 4 e 31), recebe opcionalmente nome, empresa, CNPJ e contatos, cria a tarefa e inicia o processamento em segundo plano.
- `GET /api/tarefas/:id`: estado e progresso (cenário 16).
- `GET /api/tarefas/:id/itens`: itens no formato de `data.js`, só para tarefas `pronta` (cenários 17 e 23).
- `GET /api/tarefas/:id/planilha`: planilha preenchida, só para tarefas `pronta` (cenário 24).
- `GET /api/tarefas/:id/registro` e `GET /api/tarefas/:id/metricas` (cenários 29 e 37).
- Servidor ouvindo só em `127.0.0.1` (cenário 30).
- **Verificação:** testes de integração das rotas passando.
- **Situação (22/10/2026): concluída, com a API simulada até a A1.**
  - `http/rotasDeTarefas.ts`: as rotas `POST /api/tarefas` (planilha em JSON, conteúdo em base64), `GET /api/tarefas` (lista, acrescentada para a tela de tarefas), `GET /api/tarefas/:id`, `/itens`, `/planilha`, `/registro` e `/metricas`.
  - A planilha é validada e lida no envio: formato, tamanho e arquivo corrompido são recusados com 400, sem criar tarefa. O processamento roda em segundo plano, uma tarefa por vez.
  - Itens e planilha só saem de tarefas prontas; nos outros estados a resposta é 409, com o motivo da falha.
  - Campo desconhecido no corpo de qualquer rota passou a ser recusado.
  - **Chave da API no servidor (cenário 27):** `npm run servidor` não inicia sem `ANTHROPIC_API_KEY`, a não ser com `TENDRA_API_SIMULADA=1`. Essa opção liga a API simulada (`ia/apiSimulada.ts`): cita o bloco da base com mais palavras em comum com a pergunta ou responde sem rascunho. O texto sai marcado como "[Resposta simulada]" e um aviso aparece no log. Serve para usar a tela sem a chave; não mede a IA.
  - **Reteste com a API real (23/10/2026): passou.** O servidor subiu com a chave e processou a RFP-01 por `POST /api/tarefas`, com 7 requisições à API e nenhuma com erro.

### B3. Rotas da base
- **Antecipadas na A4**, junto com o envio pela tela: `GET /api/base/documentos` (nome do arquivo, título, tipo, versão, data de atualização, ativo, enviado por e data da carga; a idade é calculada na tela), `POST /api/base/documentos` (envio de `.md`) e `PATCH /api/base/documentos/:id` (ativar e desativar, cenário 40).
- **Situação (22/10/2026): concluída.** O teste `equivalencia.test.ts` desativa um documento pela rota, processa uma tarefa pela rota e confere três coisas: o documento não vai à IA, não aparece no registro e não é citado. Reativado, ele volta ao contexto. (API simulada até a A1.)

### B4. Tarefa interrompida
- Ao iniciar, marcar como falha toda tarefa que estava em `processando` (cenário 32).
- **Verificação:** teste de integração passando.
- **Situação (22/10/2026): concluída.** `marcarInterrompidas` roda ao iniciar o `npm run servidor`.

### B5. Revisão persistida e relatório de aceitação
- Pessoa que age validada contra `config/pessoas.json` (cenário 41; exceção E1).
- Editar, restaurar, aprovar, aprovar sem rascunho e avaliar com motivo (cenários 42 a 46), com eventos só de inclusão (cenário 49).
- Relatório de aceitação por tarefa, por rota e pelo comando `aceitacao` (cenário 48); método de P9.
- Persistência após reinício (cenário 47).
- **Verificação:** testes passando; uma tarefa processada, editada, aprovada e avaliada gera um relatório cujos números conferem com os eventos.
- **Situação (22/10/2026): concluída (os itens dos testes vêm da API simulada até a A1).**
  - `revisao/revisao.ts`, `http/rotasDeRevisao.ts` e `config/pessoas.json`.
  - Rotas, cada ação com `pessoa` (o id da lista):
    - `PUT /api/tarefas/:id/itens/:numero/texto`, `POST .../restaurar`, `POST .../aprovar` e `PUT .../avaliacao`;
    - `GET /api/tarefas/:id/eventos`, `/avaliacoes` e `/aceitacao`, mais `GET /api/pessoas`.
  - Comando `npm run aceitacao -- <id>`.
  - Regras adotadas:
    - **Edição:** cada parágrafo editado mantém as fontes do parágrafo na mesma posição. Texto vazio e item sem rascunho são recusados (sem editor nesses itens nesta versão).
    - **Restauração:** volta aos parágrafos e fontes originais, guardados na migração `003_paras_originais.sql`. Se o texto de um item aprovado muda, a aprovação sai.
    - **Aprovado sem edição:** o texto aprovado é igual a `orig`, ignorando espaços.
  - Os eventos só aceitam inclusão, garantido por gatilho do banco, e não guardam texto.

### B6. Equivalência com o comando
- Teste que processa a mesma planilha e a mesma base pelo comando `responder` e pelo backend e compara os itens (cenário 25), com a API simulada.
- **Verificação:** teste passando.
- **Situação (22/10/2026): concluída, com a API simulada até a A1.** `equivalencia.test.ts` processa a RFP-01 pelo caminho do comando (`processarTarefa`, o mesmo do `responder`) e pela rota `POST /api/tarefas` e compara os itens, que saem iguais, e a posição de cada pergunta. O mesmo arquivo confere o cenário 30: o `npm run servidor` real responde em 127.0.0.1 e recusa conexão pelo endereço da rede. Com a API real, a equivalência não se compara item a item, porque duas execuções do modelo não geram o mesmo texto; o comando e a rota usam o mesmo `processarTarefa`, e os dois caminhos foram exercidos com a API real (A6 e o reteste da B2).

## Fase C: front conectado

### C1. Conexão com o backend
- Proxy do Vite para `/api`; `src/api.js` como camada única de chamadas, com tratamento explícito de erro e enviando a pessoa que age.
- **Parte feita na A4:** o proxy e `src/api.js` já existem para a tela da Base; esta etapa estende a camada para as tarefas e a revisão.
- **Verificação:** o front em `npm run dev` consulta o backend.
- **Situação (22/10/2026): concluída, com a API simulada até a A1.** `src/api.js` cobre a base, as tarefas (`listarTarefas`, `criarTarefa`, `listarItensDaTarefa`, `enderecoDaPlanilha`) e a revisão (`editarTextoDoItem`, `restaurarItem`, `aprovarItemNaApi`, `avaliarItemNaApi`, `listarPessoas`, `relatorioDeAceitacao`); as ações da revisão enviam `pessoa`. Erros chegam como `ErroDaApi` com a mensagem do backend; sem o servidor, a mensagem diz como iniciá-lo. Com o servidor, tarefas, exportação, histórico e alertas do sino vêm do banco; sem ele, o protótipo segue com os exemplos de `data.js`, como a tela Base.

### C2. Nova RFP
- Seletor de arquivo real para a planilha `.xlsx`, enviando para `POST /api/tarefas` com os campos existentes do formulário; recusa de outros formatos e mensagens dos cenários 4 e 31.
- **Verificação:** enviar a planilha sintética pela tela cria a tarefa.
- **Situação (22/10/2026): concluída, com a API simulada até a A1.** O quadro de arquivo abre o seletor do computador só para `.xlsx`; o nome da tarefa vem do arquivo quando o campo está vazio. Outro formato mostra "Envie a RFP em formato .xlsx" na hora (cenário 4); planilha corrompida mostra "Arquivo .xlsx inválido", devolvido pelo backend (cenário 31). Os campos do formulário (nome, empresa, CNPJ, tipo, prazo, responsável e contatos) vão em `dados`. Conferido no navegador com a RFP-01 e a RFP-02.

### C3. Progresso e itens
- Acompanhar o progresso consultando o estado a cada poucos segundos, no lugar da simulação de `useWorkspace.js`; mostrar o motivo quando a tarefa falha.
- Ao terminar, carregar os itens reais na tela de revisão, todos como sugestões pendentes (cenário 33); botão para baixar a planilha preenchida.
- **Verificação:** a jornada da planilha às respostas com fonte funciona na tela.
- **Situação (22/10/2026): concluída, com a API simulada até a A1.** Enquanto alguma tarefa processa, o front consulta `GET /api/tarefas` a cada 2 segundos e mostra "Processando: N de M perguntas"; ao terminar, avisa e lê os itens, que entram na Revisão como chegam do banco (sugeridas ou sem rascunho, cenário 33). Tarefa com falha mostra o motivo gravado e não oferece "Tentar de novo", que não existe no backend. O detalhe da tarefa e a tela Exportação têm "Baixar planilha preenchida" (`GET /api/tarefas/:id/planilha`). Essa planilha é a gerada no processamento: as edições e aprovações da revisão não entram nela nesta fase.

### C4. Base conectada
- **Feita na A4:** a tela Base lê `GET /api/base/documentos`, envia `.md` pelo seletor de arquivos do computador e grava a chave Ativar/Desativar (PRD v3, F-02).
- Falta: a área de envio de Primeiros passos usa a mesma rota, e "Criar primeira RFP" passa a depender de haver ao menos um documento ativo no banco.
- **Verificação:** a lista mostra os documentos enviados pela tela e pelo comando, com idade e selo de 120 dias; Primeiros passos mostra os mesmos documentos.
- **Situação (22/10/2026): concluída.** Com o servidor, "Subir documentos" de Primeiros passos envia os `.md` para `POST /api/base/documentos`, mostra o mesmo "Resultado do envio" da Base e lista os documentos do banco. "Criar primeira RFP" só fica disponível com ao menos um documento ativo. Sem o servidor, a tela segue com a simulação do protótipo.

### C5. Revisão com ações gravadas
- Editar, restaurar, aprovar e avaliar chamam as rotas de B5; o reconhecimento de alerta continua só na tela. Sem editor em itens sem rascunho nesta versão. O seletor "Trocar usuário" passa a definir a pessoa que age.
- **Verificação (portão da fase C):** teste de ponta a ponta da jornada passando, com a API simulada; no navegador, editar e aprovar, recarregar a página e ver as ações mantidas; o relatório de aceitação confere.
- **Situação (22/10/2026): ações conectadas, com a API simulada até a A1.**
  - A pessoa que age é a de `config/pessoas.json` com o papel escolhido em "Trocar usuário" (Aprovador: Marcelo Vieira; Revisor: Kadu Mendes).
  - O texto editado é gravado 800 ms depois da última tecla, ao concluir a edição, ao trocar de item e antes de aprovar: uma edição contínua gera um só evento.
  - Restaurar e aprovar usam o item devolvido pelo backend (data e hora do servidor).
  - O polegar positivo grava na hora; o negativo grava quando o motivo é escolhido. Ao abrir a tarefa, a tela mostra a avaliação já gravada da pessoa que age.
  - Itens sem rascunho não têm editor.
  - **Ficam só na tela:** reconhecer alerta, escolher a fonte num conflito e "Marcar como revisado", que não têm rota na B5. Depois de recarregar a página, alertas voltam a pendentes e o item revisado volta ao estado gravado.
  - Com o servidor, o "Painel de demo" (aprovar tudo só na tela) não aparece.
  - Conferido no navegador: editar e aprovar como Aprovador, avaliar como Aprovador e como Revisor, recarregar e ver o item aprovado, editado e com a avaliação; `GET /api/tarefas/:id/aceitacao` conta 1 aprovado, 7,7% alterado e as duas avaliações.
- **Portão (22/10/2026): passando, com a API simulada.** `e2e/jornada.spec.js` (`npm run e2e`, Playwright) sobe o backend com a API simulada num banco novo e o front. Ele percorre a jornada:
  1. envia os `.md` da base sintética pela tela Base;
  2. confere a recusa de um arquivo que não é `.xlsx`;
  3. cria a tarefa com a RFP-01 e espera o processamento;
  4. baixa a planilha preenchida e confere que todos os itens chegam como sugestões pendentes;
  5. como Aprovador, edita, aprova e avalia um item;
  6. recarrega a página e vê as ações mantidas;
  7. compara `/aceitacao` e `/eventos` com o que foi feito na tela.
  
  O job "Build e jornada de ponta a ponta" (`.github/workflows/front.yml`) roda o teste em todo PR. Para que ele bloqueie o merge pelo GitHub, marque-o como verificação obrigatória na proteção da branch `main`.
- **Reteste com a API real (23/10/2026): passou.** `TENDRA_E2E_API_REAL=1 npm run e2e` sobe o backend com a chave de `backend/.env`, sem a API simulada, e percorre a mesma jornada em 1,5 minuto. Tem custo (cerca de US$ 0,25 por execução) e não roda no CI; sem a variável, o teste continua com a API simulada e não lê a chave.

## Fase D: publicação compartilhada

Só começa com A, B e C aceitas e uma taxa de aceitação medida. Nesse momento, e somente se for pedido expressamente, consulta-se o material de referência em `docs/referencia/mvp-proposta-1/` (etapas 0 a 8 do `PLAN.md` dele), com estas adaptações:

| Item | Adaptação |
|---|---|
| Esqueleto, CI e segredos | Já existem; só acrescentar as variáveis do Supabase e do Render |
| Banco | Trocar a conexão do PGlite para o Postgres do Supabase; migrações já versionadas |
| Arquivos das RFPs | Trocar o módulo de armazenamento para o Supabase Storage |
| Login e sessão | Supabase Auth para conferir a senha e sessão própria do backend; limite de tentativas; HTTPS, cookie e CORS |
| Pessoa que age | Sai da lista de configuração e passa a vir da sessão; remover "Trocar usuário" do front |
| Papéis | Bloqueio do Revisor para aprovar e exportar (cenários 37 e 44 de `docs/referencia/mvp-proposta-1/SPEC.md`) entra junto com o login |
| Retomada após reinício | Passa a retomar do último lote gravado (cenário 54), porque os planos gratuitos "dormem" |
| Base | A carga continua pela tela e pelo comando, agora no banco compartilhado; a pessoa que envia passa a vir da sessão. A trava de um processo por vez some com o Postgres do Supabase. |

O spec curto e o plano detalhado da fase D são escritos quando ela for começar.

## Definição de pronto (proposta, P10)

Uma etapa só é concluída quando:

1. os cenários da etapa passam nos testes automáticos e a integração contínua está verde;
2. a verificação da etapa foi feita da forma descrita nela;
3. os estados de erro da etapa estão tratados de forma explícita;
4. validação de entrada, segredos fora do código e uso só da base autorizada foram considerados;
5. se a etapa mexe em instruções, modelo, parâmetros ou recuperação, o relatório de avaliação aprovado está anexado ao pull request;
6. spec, plano e arquitetura afetados foram atualizados;
7. nenhuma resposta é aprovada pelo sistema, e toda resposta preserva a rastreabilidade até o trecho citado.

> **Mudança em relação à versão anterior (P10):** a versão anterior aplicava os 13 itens do princípio XI da constitution a cada etapa. Os 7 itens acima mantêm o que protege o produto (testes, estados de erro, segurança, avaliação da IA, rastreabilidade, sem aprovação automática) e tiram a repetição de itens de organização de código (legibilidade, duplicação, responsabilidades separadas), que já são garantidos pela estrutura de pastas e pela revisão do pull request. Precisa da aprovação do grupo para valer.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| 1 a 5, 31 | Enviar as planilhas de teste (com coluna "Pergunta", sem ela, vazia, em outro formato, corrompida e acima do limite) e conferir itens ou mensagens |
| 6 e 29 | Abrir o registro de requisições de uma tarefa com CNPJ e contatos e procurar por eles |
| 7 a 9, 39 | Subir pela tela os `.md` da base sintética, de novo sem mudança, com um arquivo alterado e os inválidos; conferir o resultado do envio. Rodar `carregar-base` com a pasta e um arquivo renomeado; conferir o resumo e os órfãos |
| 10, 11, 35, 40 | Executar com bases de teste (completa, vazia, acima do teto, com documento desativado e com `.md` não carregado) |
| 12 a 15, 34 | Conferir as respostas da RFP sintética contra o gabarito, o caso de instrução maliciosa e a pergunta de compromisso |
| 16, 17, 32 | Acompanhar o progresso; executar com uma chave inválida; encerrar o backend no meio de uma tarefa e reiniciar |
| 18 a 22 | Conferir os alertas dos casos embutidos na base sintética |
| 23, 24, 33 | Abrir a tela de revisão e a planilha preenchida; conferir que nada aparece como aprovado antes de alguém agir |
| 25, 26, 36 | Executar `responder`, `avaliar` e uma avaliação com limite propositalmente alto |
| 27 e 28 | Executar sem a chave; conferir `git status` depois de usar o sistema |
| 30 | Tentar acessar o backend de outro computador da rede |
| 37 e 38 | Consultar as métricas e os dados de uma tarefa |
| 41 a 46 | Pela tela: editar, restaurar, aprovar, tentar aprovar item sem rascunho e avaliar; tentar uma ação sem pessoa válida |
| 47 | Reiniciar o backend e conferir que edições, aprovações e avaliações continuam |
| 48 e 49 | Consultar o relatório de aceitação e os eventos de uma tarefa revisada e conferir os números |

## Fora deste plano

- Tudo o que está em "Fora de escopo" no SPEC.
- O detalhamento da fase D, que vem de `docs/referencia/mvp-proposta-1/` e é escrito quando ela começar.
