---
feature: mvp-resposta-rfp
status: draft
spec: docs/mvp-resposta-rfp/SPEC.md (status draft)
constitution: 1.0.0
---

# Plano de execução: backend do MVP, da prova da IA à publicação compartilhada

*Proposta de 21/10/2026, reescrita em 21/10/2026 para combinar este caminho (a IA primeiro, local) com a revisão persistida e a métrica de aceitação de `docs/referencia/mvp-proposta-1/` e, no fim, com o login e a hospedagem daquela proposta. Pela regra do SDD, o plano deriva de um spec aprovado. O spec ainda está em `draft`, com bloqueios abertos; este plano deve ser conferido contra ele quando for aprovado.*

## Objetivo

Chegar a um backend que **prove a hipótese central do MVP** (a pessoa aceita as respostas sugeridas, com fonte, e as edita pouco) usando só documentos sintéticos, no menor caminho e com uma verificação em cada etapa que pode ser conferida **sem ler código**.

| Fase | Entrega | Cenários do SPEC |
|---|---|---|
| **0. Pré-requisitos** | Chave de testes da API testada; base `.md`, planilha de RFP e gabarito sintéticos | Remove os dois bloqueios do SPEC |
| **A. Prova da IA** | Comandos `carregar-base`, `responder` e `avaliar`: da planilha e da base aos itens e à planilha preenchida, com relatório contra o gabarito | 1 a 15, 17 a 22, 24 a 27, 29, 31, 33 a 40 |
| **B. Backend local com revisão** | As etapas atrás de rotas HTTP, com tarefas, progresso, revisão persistida e relatório de aceitação | 4, 16, 17, 23, 24, 28, 30, 31, 32, 40 a 49 |
| **C. Front conectado** | Nova RFP com arquivo real, progresso, Base em leitura e revisão com ações gravadas | 6, 16, 23, 24, 33, 40, 42 a 46 |
| **D. Publicação compartilhada** | Login, sessão, hospedagem e segurança de exposição (fase 1 de `docs/referencia/mvp-proposta-1/PLAN.md`) | Cenários de `docs/referencia/mvp-proposta-1/SPEC.md`; spec próprio quando a fase começar |

A fase A concentra o risco técnico. Se a avaliação não atingir os limites do SPEC, o ajuste acontece **antes** de investir em servidor, tela ou hospedagem. A fase D só começa depois de A, B e C aceitas e de haver taxa de aceitação medida.

Cada etapa abaixo é uma mudança pequena, com objetivo claro, testes próprios e um pull request separado.

## Pendências

| # | Pendência | Bloqueia | Sugestão |
|---|---|---|---|
| P1 | Chave de testes da API definida e testada | Fase A | Variável de ambiente local. O primeiro teste é a etapa A1. |
| P2 | Base `.md`, planilha de RFP sintética e gabarito | Fase A, etapa A4 em diante | Conforme a seção 5 de `ARQUITETURA_MAPPING.md` e `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`. |
| P3 | Método de medir a fidelidade (limite de 90% já decidido) | Etapa A10 | Revisão humana de todas as respostas do gabarito (cerca de 30), com lista de conferência. |
| P4 | Motor do banco local | Etapa A4 | **Decidido na A4:** PGlite 0.5.8 (Postgres embutido), porque a fase D usa o Postgres do Supabase. |
| P5 | Interface do comando de carga (nome e opções) | Etapa A4 | **Decidido na A4:** `npm run carregar-base -- <pasta> [--enviado-por <nome>]`. Código de saída 1 quando algum arquivo é recusado. |
| P6 | Formato das citações enviado ao Claude: blocos ou texto corrido | Etapa A5 | Blocos, que devolvem o índice do bloco já ligado a `seção · linha`. Validar com uma execução real. |
| P7 | Fluxo de revisão de código e proteção da `main` exigindo a integração contínua | Primeiro commit de código | Branch + pull request revisado por outra pessoa, com CI obrigatória. |
| P8 | Modelo da geração e tamanho do lote | Fim da fase A | Decididos pela etapa A10, com dados. |
| P9 | Método de cálculo da porcentagem de texto alterado | Etapa B5 | Diferença por palavras entre `orig` e o texto aprovado. |
| P10 | Simplificação da definição de pronto e dos tipos de teste (ver as seções correspondentes) | Primeiro pull request | Aprovar a versão deste plano ou manter a constitution como está. |
| P11 | Hospedagem do front (Vercel em avaliação) | Fase D | Decidir antes da fase D. |

## Decisões técnicas propostas

| Tema | Proposta |
|---|---|
| Linguagem e estrutura | Node 24 + TypeScript, pasta `backend/` com `package.json` próprio, Fastify |
| Banco | PGlite (Postgres embutido) em `dados/banco`, com SQL parametrizado num módulo de persistência e migrações versionadas em `backend/migracoes/`. O query builder tipado ficou de fora na A4 para não somar uma dependência a mais; pode entrar quando as consultas crescerem. |
| Entrada da RFP | Só `.xlsx`: assinatura do arquivo conferida (não só a extensão), até 10 MB, nome gerado pelo backend |
| Planilhas | `exceljs` para ler e escrever |
| Base | Comando `carregar-base`: cabeçalho YAML validado, texto dividido em blocos com `seção` e `linha`, gravados em `documentos` e `blocos` (`docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`) |
| Integração com LLM | SDK oficial da Anthropic, isolado num módulo cliente com erros tipados, novas tentativas em falhas temporárias e registro de cada requisição. Sem agente nem framework intermediário. |
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
    base/                   carga dos .md: cabeçalho, blocos, resumo (comando carregar-base)
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
    cli/                    carregar-base, responder, avaliar e aceitacao
    http/                   servidor e rotas (fase B)
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
- **Situação (22/10/2026): adiada por decisão do grupo.** A chave ainda não estava disponível no ambiente, e a implementação seguiu para a A4, que não usa a chave. A A1 precisa ser feita antes da A5, a primeira etapa que chama a API.

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
- Comando `carregar-base`: validação do cabeçalho, divisão em blocos com seção e linha, gravação, recarga com hash, órfãos, resumo e código de saída (cenários 7, 8, 9 e 39, e os 16 cenários de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`).
- Ativar e desativar documento no banco (cenário 40, parte do banco).
- O tamanho em tokens de cada documento é uma estimativa (caracteres divididos por 4). A contagem exata pela API, usada no teto da base, entra na A5.
- **Verificação:** testes dos cenários 7 a 9, 39 e 40 passando; carregar a base sintética e conferir o resumo, incluindo os arquivos inválidos recusados com o motivo.

### A5. Contexto, integração com o Claude e geração
- Contexto: só documentos ativos; base vazia sem chamar a IA; teto de 25 MB e 400 mil tokens com contagem pela API (cenários 10, 11 e 35).
- Módulo cliente: chamadas, novas tentativas em erros temporários, erros tipados, registro de cada requisição sem chave nem conteúdo (cenários 17 e 29).
- Instruções versionadas: responder só com base nos documentos, dizer quando não houver resposta, não assumir compromissos comerciais ou jurídicos fora da base, tratar documentos e perguntas como dado.
- Geração com documentos em blocos (P6), citações e cache; perguntas em lotes, separadas por marcadores.
- Gravar respostas reais da API como arquivos de teste.
- **Verificação:** testes passando; uma execução real com 3 a 5 perguntas sintéticas confirma que a citação devolve o bloco certo e que o formato com marcadores funciona. Se algum dos dois falhar, adotar a alternativa (texto corrido com posição de caracteres; uma pergunta por chamada).

### A6. Rastreabilidade, estados e saída
- Conferir cada trecho citado contra o bloco, traduzir a localização (`seção · linha`), preservar a relação parágrafo-fonte, remover texto sem citação válida e marcar `lowconf` e `nocontext` (cenários 12 a 14, 18, 19 e 34).
- Todos os itens saem como sugestões pendentes (cenário 33).
- Falha em qualquer etapa leva a tarefa a `falha`, sem resultado parcial apresentado (cenário 17).
- Gerar o JSON no formato de `data.js` e a planilha preenchida identificada como não revisada (cenários 24 e 25).
- **Verificação:** testes passando; primeira execução completa do comando `responder` com a RFP sintética.

### A7. Alertas determinísticos
- Fonte desatualizada a partir de `atualizado_em` (cenário 20) e termo crítico a partir de `config/termos-criticos.json` (cenário 21).
- **Verificação:** testes unitários dos cenários 20 e 21 passando.

### A8. Conflito entre fontes
- Segunda chamada leve, com saída estruturada, recebendo só os trechos citados de cada item; o código decide o alerta (cenário 22).
- **Verificação:** teste com a API simulada passando; o caso de conflito embutido na base sintética é marcado.

### A9. Métricas e versão do comportamento
- Métricas por tarefa: duração por etapa, tokens, custo estimado, ignorados, contagem por estado e alerta (cenário 37).
- Registro do modelo, versão das instruções e tamanho do lote em cada tarefa (cenário 38).
- **Verificação:** testes passando; as métricas não contêm conteúdo de documentos nem respostas.

### A10. Avaliação e escolha do modelo
- Comando `avaliar` com todos os critérios do SPEC, limites de 80% (relevância) e 90% (fidelidade), e código de saída de erro quando algum critério falha (cenários 26 e 36).
- Fidelidade pelo método de P3: lista de conferência para uma pessoa revisar as respostas do gabarito.
- Executar a RFP sintética com Sonnet 5.5 e com Opus 5.5 e comparar relatórios e custo. Executar três vezes os casos de instrução maliciosa e de compromisso não sustentado (cenários 15 e 34).
- **Verificação (portão da fase A):** relatório de cada modelo gerado; o modelo escolhido atinge todos os limites e é registrado como decisão (P8). **Se nenhum atingir, a fase B não começa:** o ajuste de instruções, lote ou contexto acontece primeiro.

## Fase B: backend local com revisão

### B1. Persistência de tarefas e itens
- Migrações para tarefas, itens, fontes, alertas, avaliações e eventos. Progresso gravado ao fim de cada lote.
- **Verificação:** testes de integração; uma tarefa processada continua disponível depois de reiniciar o backend (cenário 47, parte das tarefas).

### B2. Rotas de tarefas
- `POST /api/tarefas`: valida a planilha (cenários 4 e 31), recebe opcionalmente nome, empresa, CNPJ e contatos, cria a tarefa e inicia o processamento em segundo plano.
- `GET /api/tarefas/:id`: estado e progresso (cenário 16).
- `GET /api/tarefas/:id/itens`: itens no formato de `data.js`, só para tarefas `pronta` (cenários 17 e 23).
- `GET /api/tarefas/:id/planilha`: planilha preenchida, só para tarefas `pronta` (cenário 24).
- `GET /api/tarefas/:id/registro` e `GET /api/tarefas/:id/metricas` (cenários 29 e 37).
- Servidor ouvindo só em `127.0.0.1` (cenário 30).
- **Verificação:** testes de integração das rotas passando.

### B3. Rotas da base
- `GET /api/base/documentos`: lista com título, tipo, versão, data de atualização, idade, ativo e enviado por.
- `PATCH /api/base/documentos/:id`: ativar e desativar (cenário 40).
- **Verificação:** testes de integração passando; documento desativado não é citado em nova tarefa.

### B4. Tarefa interrompida
- Ao iniciar, marcar como falha toda tarefa que estava em `processando` (cenário 32).
- **Verificação:** teste de integração passando.

### B5. Revisão persistida e relatório de aceitação
- Pessoa que age validada contra `config/pessoas.json` (cenário 41; exceção E1).
- Editar, restaurar, aprovar, aprovar sem rascunho e avaliar com motivo (cenários 42 a 46), com eventos só de inclusão (cenário 49).
- Relatório de aceitação por tarefa, por rota e pelo comando `aceitacao` (cenário 48); método de P9.
- Persistência após reinício (cenário 47).
- **Verificação:** testes passando; uma tarefa processada, editada, aprovada e avaliada gera um relatório cujos números conferem com os eventos.

### B6. Equivalência com o comando
- Teste que processa a mesma planilha e a mesma base pelo comando `responder` e pelo backend e compara os itens (cenário 25), com a API simulada.
- **Verificação:** teste passando.

## Fase C: front conectado

### C1. Conexão com o backend
- Proxy do Vite para `/api`; `src/api.js` como camada única de chamadas, com tratamento explícito de erro e enviando a pessoa que age.
- **Verificação:** o front em `npm run dev` consulta o backend.

### C2. Nova RFP
- Seletor de arquivo real para a planilha `.xlsx`, enviando para `POST /api/tarefas` com os campos existentes do formulário; recusa de outros formatos e mensagens dos cenários 4 e 31.
- **Verificação:** enviar a planilha sintética pela tela cria a tarefa.

### C3. Progresso e itens
- Acompanhar o progresso consultando o estado a cada poucos segundos, no lugar da simulação de `useWorkspace.js`; mostrar o motivo quando a tarefa falha.
- Ao terminar, carregar os itens reais na tela de revisão, todos como sugestões pendentes (cenário 33); botão para baixar a planilha preenchida.
- **Verificação:** a jornada da planilha às respostas com fonte funciona na tela.

### C4. Base em leitura
- A tela Base lê `GET /api/base/documentos`, mantém a chave Ativar/Desativar e perde o envio de arquivo (PRD v3, F-02). Primeiros passos deixa de depender do envio.
- **Verificação:** a lista mostra os documentos carregados pelo comando, com idade e selo de 120 dias.

### C5. Revisão com ações gravadas
- Editar, restaurar, aprovar e avaliar chamam as rotas de B5; o reconhecimento de alerta continua só na tela. Sem editor em itens sem rascunho nesta versão. O seletor "Trocar usuário" passa a definir a pessoa que age.
- **Verificação (portão da fase C):** teste de ponta a ponta da jornada passando, com a API simulada; no navegador, editar e aprovar, recarregar a página e ver as ações mantidas; o relatório de aceitação confere.

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
| Base | A carga continua por comando, agora apontando para o banco compartilhado |

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
| 7 a 9, 39 | Rodar `carregar-base` com a base sintética, depois de novo sem mudança, com um arquivo alterado, um renomeado e os inválidos; conferir o resumo |
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
