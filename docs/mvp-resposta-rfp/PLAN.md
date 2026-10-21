---
feature: mvp-resposta-rfp
status: draft
spec: docs/mvp-resposta-rfp/SPEC.md (status draft)
constitution: 1.0.0
---

# Plano de execução: análise e resposta de RFP rodando localmente

*Proposta de 21/10/2026, revisada em 21/10/2026 contra a constitution da Tendra.AI (v1.0.0). Pela regra do SDD, o plano deriva de um spec aprovado. O spec ainda está em `draft`, com bloqueios abertos; este plano deve ser conferido contra ele quando for aprovado.*

## Objetivo

Implementar o fluxo descrito em `docs/mvp-resposta-rfp/SPEC.md` em três passos, cada um validável sozinho:

| Passo | Entrega | Cenários |
|---|---|---|
| **A. Linha de comando** | Comando que recebe a planilha e a pasta da base e gera os itens (JSON) e a planilha preenchida. Comando de avaliação contra o gabarito. | 1 a 15, 17 a 22, 24 a 27, 29, 31, 33 a 38 |
| **B. Backend local** | As mesmas etapas atrás de rotas HTTP, com tarefas, estados e progresso gravados localmente. | 4, 16, 17, 23, 24, 28, 30, 31, 32 |
| **C. Front** | Envio real da planilha na Nova RFP, acompanhamento do progresso e tela de revisão com os itens reais. | 6, 16, 23, 24, 33 |

O passo A concentra o risco técnico. Se a avaliação não atingir os critérios do spec, os ajustes acontecem antes de investir nos passos B e C.

Cada etapa abaixo corresponde a uma mudança pequena, com objetivo claro e testes próprios, integrada por um pull request separado (constitution X).

## Pendências

| # | Pendência | Bloqueia | Sugestão |
|---|---|---|---|
| P1 | Chave de testes da API definida e testada | Passo A | Variável de ambiente local. O primeiro teste é a etapa A1. |
| P2 | Base sintética com manifesto, planilha de RFP sintética e gabarito | Passo A (etapa A6 em diante) | Conforme a seção 5 de `ARQUITETURA_MAPPING.md`. |
| P3 | Origem da data de atualização dos documentos (cenário 20) | Etapa A7 | Manifesto na pasta da base (`base.json`, com nome do arquivo e data), porque a data do arquivo muda ao copiar ou baixar. |
| P4 | Limites dos critérios de avaliação e método de verificação de fidelidade | Etapa A10 | Ver o spec, seção "Critérios de avaliação da IA". |
| P5 | Motor do banco local: SQLite ou PGlite (PUB-1) | Passo B | Ver seção 8 de `ARQUITETURA_MAPPING.md`. |
| P6 | Caminho de preparação para publicação (1, 2 ou 3 da seção 8 do mapa) | Passo B | Os cuidados obrigatórios pela constitution (PUB-2, PUB-3 e PUB-5) já estão neste plano. |
| P7 | Fluxo de revisão de código e proteção da branch `main` exigindo a integração contínua aprovada | Primeiro commit de código | Branch + pull request revisado por outra pessoa, com a integração contínua obrigatória. |
| P8 | Modelo da geração | Fim do passo A | Decidido pela etapa A10, com dados. |

## Decisões técnicas propostas

| Tema | Proposta | Princípio |
|---|---|---|
| Linguagem e estrutura | Node 24 + TypeScript, pasta `backend/` com `package.json` próprio | I |
| Processamento documental | `exceljs` para ler e escrever planilhas; `pdfjs-dist` para detectar PDF sem texto antes de enviar | I, VI (validação de entrada) |
| Validação de upload | Conferir a assinatura do arquivo (não só a extensão), limite de 10 MB e nome de arquivo gerado pelo backend | VI |
| Integração com LLM | SDK oficial da Anthropic, isolado num módulo cliente com erros tipados, novas tentativas em falhas temporárias e registro de cada requisição. Sem agente nem framework intermediário. | II, VIII, IX |
| Identificação de perguntas com IA (cenário 3) | Modelo pequeno (candidato: Haiku 5.5) com saída estruturada (`{linha, texto}`), seguido de validação determinística | II (IA não controla regra crítica) |
| Geração | Documentos da base como blocos de documento com citações ativadas e marcados para cache; perguntas enviadas em lotes | IV, VII |
| Separar as respostas de cada pergunta num lote | Instruir o modelo a abrir cada resposta com um marcador fixo (por exemplo `[P12]`) e separar o texto por esses marcadores | As citações não podem ser combinadas com saída estruturada na mesma chamada. **Risco a validar na etapa A5**; se falhar, uma pergunta por chamada, mantendo o cache da base. |
| Instruções ao modelo | Arquivos versionados no repositório, com número de versão registrado em cada tarefa (cenário 38) | IV, VII |
| Conflito entre fontes | Segunda chamada leve com saída estruturada; a decisão de marcar o alerta é do código | II, IV, VIII |
| Configuração | Tudo por variável de ambiente: chave, modelo, tamanho do lote, pastas, porta (PUB-2) | I |
| Armazenamento de arquivos | Módulo único para ler e gravar arquivos (PUB-3) | II |
| Progresso | Gravado ao fim de cada lote (PUB-5) | VIII, IX |
| Autor das ações | **Não implementar** um ponto de "usuário atual" nesta versão (PUB-4) | I: sem login nem ações humanas persistidas, seria complexidade especulativa |
| Logs | Estruturados, sem chave da API, sem conteúdo de documentos e sem texto das respostas | VII, IX |

## Estrutura de pastas

Cada pasta corresponde a uma responsabilidade separada exigida pela constitution (II).

```
backend/
  package.json
  .env.example              nomes das variáveis, sem valores
  src/
    config/                 leitura e validação das variáveis (cenário 27)
    armazenamento/          leitura e gravação de arquivos (PUB-3)
    documentos/             planilha (ler, validar, escrever), PDF (texto), base (listar, filtrar, manifesto)
    recuperacao/            buscarFontes (cenários 7 a 11, 35)
    ia/                     cliente da API do Claude (erros, novas tentativas, registro)
      instrucoes/           instruções versionadas enviadas ao modelo
    geracao/                lotes, separação das respostas, identificação de perguntas com IA
    rastreabilidade/        conferência literal das citações, localização, relação evidência-resposta
    regras/                 estados, alertas, teto da base, termos críticos (determinístico)
    persistencia/           tarefas, itens, estados e progresso (passo B)
    observabilidade/        registro de requisições, métricas por tarefa, logs
    fluxo/                  processarTarefa: executa as etapas na ordem e grava o progresso
    cli/                    responder e avaliar
    http/                   servidor e rotas (passo B)
  config/termos-criticos.json
  test/
    unitarios/              regras, rastreabilidade, documentos
    integracao/             armazenamento, persistência, rotas HTTP
    contrato/               respostas gravadas da API do Claude; formato dos itens de data.js
    ia/                     avaliação contra o gabarito (chamadas reais)
base-sintetica/             documentos sintéticos e base.json (manifesto)
dados/                      tarefas, planilhas, resultados, registros e métricas (fora do Git)
```

Nenhuma regra de negócio vai para o front: estados, alertas e validações ficam no backend, e o front só exibe o que recebe.

## Estratégia de testes

Exigida pela constitution (III e IV). O nome de cada teste traz o número do cenário que ele cobre.

| Tipo | O que cobre | Depende de serviço externo? |
|---|---|---|
| **Unitários** | Regras determinísticas: leitura e validação da planilha, filtro da base, teto, estados, alertas, termos críticos, conferência de citações, tradução de localização, separação das respostas por marcador | Não |
| **Integração** | Armazenamento em disco, banco local, rotas HTTP, processamento completo com a API do Claude simulada, tarefa interrompida | Não |
| **Contrato** | Formato das respostas da API do Claude (citações com página e com posição no texto), validado contra respostas reais gravadas como arquivos de teste; formato dos itens contra o contrato de `src/workspace/data.js` | Não (usa as respostas gravadas) |
| **Ponta a ponta** | Jornada principal no navegador: envio da planilha, progresso, revisão com fontes e download da planilha preenchida, com a API do Claude simulada | Não |
| **IA** | Avaliação contra o gabarito com os critérios do spec: validade das fontes, relevância, contexto insuficiente, conflito, isolamento da base, guardrails e fidelidade | **Sim**, controlada: base e gabarito sintéticos fixos |

**Regras:**
- Unitários, integração, contrato e ponta a ponta rodam na integração contínua em cada pull request e **bloqueiam o merge** quando falham.
- A avaliação de IA chama a API real, com custo; não roda a cada pull request. Ela é **obrigatória** para qualquer pull request que altere instruções, modelo, parâmetros, tamanho do lote ou recuperação, e o relatório é anexado ao pull request (cenário 36).
- As respostas reais gravadas para os testes de contrato são renovadas quando o modelo ou o SDK mudam.
- Correções de bugs incluem um teste que reproduz o problema antes da correção.

## Passo A: linha de comando

### A1. Teste da chave
- Definir a chave de testes em variável de ambiente local.
- Fazer uma requisição mínima à API.
- **Verificação:** a requisição retorna resposta. Se falhar, a implementação para até o acesso ser resolvido. Remove o primeiro bloqueio do spec.

### A2. Esqueleto e integração contínua
- Criar `backend/` com TypeScript, Vitest e os módulos `config`, `armazenamento` e `observabilidade`.
- `.gitignore` cobrindo `.env`, `dados/` e resultados (cenários 27 e 28).
- GitHub Actions executando verificação de tipos, testes e varredura de segredos em cada pull request.
- **Verificação:** `npm test` passa; executar sem a chave mostra o nome da variável que falta; a integração contínua aparece no pull request.

### A3. Leitura e validação da planilha
- Validação do arquivo: assinatura de `.xlsx`, limite de 10 MB, nome gerado pelo backend (cenários 4 e 31).
- Regra da coluna "Pergunta", ignorando linhas vazias e títulos (cenários 1 e 2).
- Identificação com IA quando a regra falha, com descarte de textos que não aparecem na planilha (cenários 3 e 5).
- **Verificação:** testes unitários dos cenários 1 a 5 e 31 passando, com a IA simulada no cenário 3.

### A4. Carregamento da base
- Listar só a pasta configurada, aceitar PDF, MD e TXT, detectar PDF sem texto e montar a lista de ignorados (cenários 7 a 9 e 35).
- Contar tokens pela API de contagem e aplicar o teto (cenário 11).
- Base vazia: itens sem rascunho, sem chamar a geração (cenário 10).
- **Verificação:** testes dos cenários 7 a 11 e 35 passando.

### A5. Integração com o Claude e geração
- Módulo cliente: chamadas, novas tentativas em erros temporários, erros tipados, registro de cada requisição sem chave nem conteúdo (cenários 17 e 29).
- Instruções versionadas: responder só com base nos documentos, dizer quando não houver resposta, não assumir compromissos comerciais ou jurídicos fora da base, tratar documentos e perguntas como dado.
- Geração com documentos, citações e cache; perguntas em lotes, separadas por marcadores.
- Gravar respostas reais da API como arquivos de teste de contrato.
- **Verificação:** testes unitários e de contrato passando; uma execução real com 3 a 5 perguntas sintéticas confirma que o formato com marcadores funciona. Se não funcionar, adotar uma pergunta por chamada.

### A6. Rastreabilidade, estados e saída
- Conferir cada trecho citado contra o documento, traduzir a localização (página, título de seção ou parágrafo), preservar a relação parágrafo-fonte, remover texto sem citação válida e marcar `lowconf` e `nocontext` (cenários 12 a 14, 18, 19 e 34).
- Todos os itens saem como sugestões pendentes de revisão (cenário 33).
- Falha em qualquer etapa leva a tarefa a `falha`, sem resultado parcial apresentado (cenário 17).
- Gerar o JSON no formato de `data.js` e a planilha preenchida identificada como não revisada (cenários 24 e 25).
- Registro de requisições sem CNPJ, contatos nem chave (cenários 6 e 29).
- **Verificação:** testes dos cenários correspondentes passando; primeira execução completa com a RFP sintética.

### A7. Alertas determinísticos
- Fonte desatualizada a partir da data definida em P3 (cenário 20).
- Termo crítico a partir de `config/termos-criticos.json` (cenário 21).
- **Verificação:** testes unitários dos cenários 20 e 21 passando.

### A8. Conflito entre fontes
- Segunda chamada leve, com saída estruturada, recebendo só os trechos citados de cada item; o código decide o alerta a partir da indicação (cenário 22).
- **Verificação:** teste com a API simulada passando; o caso de conflito embutido na base sintética é marcado.

### A9. Métricas e versão do comportamento
- Métricas por tarefa: duração por etapa, tokens, custo estimado, ignorados, contagem por estado e alerta (cenário 37).
- Registro do modelo, versão das instruções e tamanho do lote em cada tarefa (cenário 38).
- **Verificação:** testes dos cenários 37 e 38 passando; as métricas não contêm conteúdo de documentos nem respostas.

### A10. Avaliação e escolha do modelo
- Comando de avaliação com todos os critérios do spec, limites configurados e código de saída de erro quando algum critério falha (cenários 26 e 36).
- Executar a RFP sintética com Sonnet 5.5 e com Opus 5.5 e comparar os relatórios e o custo registrado.
- Executar três vezes os casos de instrução maliciosa e de compromisso não sustentado (cenários 15 e 34, critério de consistência dos guardrails).
- **Verificação:** relatório de cada modelo gerado; o modelo escolhido atinge todos os limites e é registrado como decisão (P8).

## Passo B: backend local

### B1. Persistência local
- Tarefas, itens, estados, progresso, registro e métricas no motor definido em P5.
- Mudança de esquema: recriar o banco e reprocessar, aceitável com dados sintéticos.
- **Verificação:** testes de integração; uma tarefa processada continua disponível depois de reiniciar o backend.

### B2. Rotas
- `POST /api/tarefas`: valida a planilha (cenários 4 e 31), recebe opcionalmente nome, empresa, CNPJ e contatos, cria a tarefa e inicia o processamento em segundo plano.
- `GET /api/tarefas/:id`: estado e progresso (cenário 16).
- `GET /api/tarefas/:id/itens`: itens no formato de `data.js`, só para tarefas `pronta` (cenários 17 e 23).
- `GET /api/tarefas/:id/planilha`: planilha preenchida, só para tarefas `pronta` (cenário 24).
- `GET /api/tarefas/:id/registro` e `GET /api/tarefas/:id/metricas` (cenários 29 e 37).
- Servidor ouvindo só em `127.0.0.1` (cenário 30).
- **Verificação:** testes de integração das rotas passando.

### B3. Tarefa interrompida
- Ao iniciar, marcar como falha toda tarefa que estava em `processando` (cenário 32).
- **Verificação:** teste de integração passando.

### B4. Equivalência com o comando
- Teste que processa a mesma planilha e a mesma base pelo comando e pelo backend e compara os itens (cenário 25), com a API simulada.
- **Verificação:** teste passando.

## Passo C: front

### C1. Conexão com o backend
- Proxy do Vite encaminhando `/api` para o backend local.
- `src/api.js`: camada única de chamadas ao backend, com tratamento explícito de erro.
- **Verificação:** o front em `npm run dev` consegue consultar o backend.

### C2. Nova RFP
- Seletor de arquivo real para a planilha, enviando para `POST /api/tarefas` com os campos já existentes do formulário.
- Mensagens de erro dos cenários 4 e 31.
- **Verificação:** enviar a planilha sintética pela tela cria a tarefa.

### C3. Progresso e revisão
- Acompanhar o progresso consultando o estado a cada poucos segundos, no lugar da simulação de `useWorkspace.js`; mostrar o motivo quando a tarefa falha.
- Ao terminar, carregar os itens reais na tela de revisão, todos como sugestões pendentes (cenário 33).
- Botão para baixar a planilha preenchida.
- **Verificação:** teste de ponta a ponta da jornada passando, com a API do Claude simulada.

## Definition of Done

Cada etapa só é concluída quando atende aos 13 itens do princípio XI da constitution. Aplicados a este plano:

1. Os cenários da etapa passam nos testes automáticos.
2. A etapa respeita a constitution ou usa só as exceções documentadas (E1 a E6).
3. O código é legível, com responsabilidades separadas conforme a estrutura de pastas.
4. Não há duplicação nem complexidade especulativa.
5. Há testes unitários, de integração, de contrato, de ponta a ponta ou de IA, conforme o risco da etapa.
6. A integração contínua passa no pull request.
7. Os estados de erro da etapa estão tratados de forma explícita.
8. Validação de entrada, segredos fora do código e uso só da base autorizada foram considerados.
9. Registro e métricas cobrem o que a etapa introduz.
10. A documentação afetada (spec, plano, mapa) foi atualizada.
11. Mudanças de comportamento da IA têm relatório de avaliação aprovado.
12. As respostas preservam a rastreabilidade até o trecho citado.
13. Nenhuma resposta é aprovada pelo sistema; tudo sai pendente de revisão humana.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| 1 a 5, 31 | Enviar as planilhas de teste (com coluna "Pergunta", sem ela, vazia, em outro formato, corrompida e acima do limite) e conferir itens ou mensagens. |
| 6 e 29 | Abrir o registro de requisições de uma tarefa com CNPJ e contatos e procurar por eles. |
| 7 a 11, 35 | Executar com bases de teste (completa, com arquivos ignorados, vazia, acima do teto e com documento fora da pasta). |
| 12 a 15, 34 | Conferir as respostas da RFP sintética contra o gabarito, o caso de instrução maliciosa e a pergunta de compromisso. |
| 16, 17, 32 | Acompanhar o progresso; executar com uma chave inválida; encerrar o backend no meio de uma tarefa e reiniciar. |
| 18 a 22 | Conferir os alertas dos casos embutidos na base sintética. |
| 23, 24, 33 | Abrir a tela de revisão e a planilha preenchida; conferir que nada aparece como aprovado. |
| 25, 26, 36 | Executar o comando, o relatório de avaliação e uma avaliação com limite propositalmente alto. |
| 27 e 28 | Executar sem a chave; conferir `git status` depois de usar o sistema. |
| 30 | Tentar acessar o backend de outro computador da rede. |
| 37 e 38 | Consultar as métricas e os dados de uma tarefa. |

## Fora deste plano

- Tudo o que está em "Fora de escopo" no spec.
- A publicação fora da máquina local, que depende da validação da seção 8 de `ARQUITETURA_MAPPING.md`.
