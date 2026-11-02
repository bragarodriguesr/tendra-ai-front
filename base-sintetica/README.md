# Dados sintéticos para teste e avaliação

Material da **fase 0.2** do `docs/mvp-resposta-rfp/plan/PLAN.md`. Tudo aqui é fictício: a empresa **Pulse Benefícios LTDA** (benefícios corporativos: vale-alimentação e vale-refeição) não existe, e nenhum documento ou cliente é real. É a base para testar e avaliar o pipeline: a carga da base (pela tela Base de conhecimento ou pelo comando `carregar-base`) e os comandos `responder` e `avaliar`.

**Data de referência para os testes: 2026-10-21.** Os alertas de fonte antiga (mais de 120 dias) foram calculados para essa data, então os testes devem fixar o relógio nela.

## Estrutura

| Caminho | O que é |
|---|---|
| `pulse-beneficios/base/` | 16 documentos `.md` com o cabeçalho de `docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`. São os arquivos a subir pela tela Base de conhecimento (pode escolher todos de uma vez) ou a pasta que o comando `carregar-base` lê. |
| `pulse-beneficios/atualizacao/` | 2 documentos com o mesmo nome de arquivo de documentos da base e versão mais nova (cenário 39). |
| `pulse-beneficios/fora-da-base/` | 1 documento válido que nunca pode ser fonte (cenário 35). Não é carregado. |
| `pulse-beneficios/injecao-em-documento/` | 1 documento com instrução maliciosa, com o mesmo nome de arquivo de um da base (cenário 15). |
| `pulse-beneficios/casos-de-carga/` | 13 arquivos para a validação da carga (cenário 9 e `FORMATO_BASE_MD.md`). Subidos pela tela, mostram 2 carregados, 10 recusados com o motivo, 1 aviso e 1 ignorado. |
| `pulse-beneficios/GUIA-casos-de-teste.md` | Lista dos documentos com idade, versões, conflitos e perguntas de exemplo. |
| `rfps/` | 3 planilhas de RFP (46, 84 e 61 perguntas), o gabarito e o guia. |
| `rfps/variantes/` | Casos de borda e arquivos inválidos para a entrada da RFP. |
| `rfps/gabarito-rfps-pulse.json` | Para cada pergunta: linha, documentos esperados, estado e alertas esperados antes e depois da atualização. |
| `rfps/GUIA-rfps-pulse.md` | O mesmo gabarito em tabelas legíveis. |
| `pessoas.json` | As duas pessoas sintéticas (Kadu Mendes, Revisor; Marcelo Vieira, Aprovador). |

As pastas `base/` e `atualizacao/` são as únicas que representam o estado da base. O `GUIA-casos-de-teste.md` e os demais arquivos de `pulse-beneficios/` ficam fora delas de propósito, para o comando de carga não os ler. Pela tela, suba só os arquivos dessas pastas. A identidade de um documento é o nome do arquivo, sem a pasta.

## Fase 0.2: lista da seção 5 de `ARQUITETURA.md`

| Item exigido | Onde está |
|---|---|
| Empresa fictícia | Pulse Benefícios LTDA |
| Documentos `.md` da base, com manifesto de datas | `pulse-beneficios/base/` (a data de cada um está no próprio cabeçalho) |
| Conflito entre fontes | Quatro conflitos, C1 a C4: retenção de logs, RPO e RTO, prazo de crédito e prazo de comunicação de incidentes (ver o guia) |
| Fonte antiga | Cinco documentos com mais de 140 dias e um de 131 dias, que testa a fronteira dos 120 |
| Mais de uma versão | Política de segurança e anexo de SLA, em `base/` e `atualizacao/` |
| Instrução maliciosa | No documento de `injecao-em-documento/` e na pergunta 6.11 da `RFP-02` |
| Documento fora da base | `fora-da-base/politica-guarda-documentos-fiscais.md`, testado por `rfps/variantes/RFP-casos-de-borda.xlsx`, pergunta 1 |
| Arquivos inválidos para a carga | `casos-de-carga/` |
| Planilha de RFP | `rfps/RFP-01`, `RFP-02` e `RFP-03` |
| Variante sem coluna "Pergunta" | `rfps/variantes/RFP-sem-coluna-pergunta.xlsx` |
| Compromisso não sustentado pela base | Perguntas sobre multa por descumprimento do SLA e responsabilidade civil ilimitada (RFP-02 6.05 e 6.06, RFP-03 8.5) |
| Perguntas sem resposta na base | 24 nas três RFPs, mais as de `variantes/RFP-casos-de-borda.xlsx` |
| Gabarito | `rfps/gabarito-rfps-pulse.json` |
| Pessoas sintéticas | `pessoas.json` |

**Diferenças em relação ao texto do plano:** a base tem 16 documentos (o plano fala em 4 a 6) e as RFPs têm 46, 84 e 61 perguntas (o plano fala em 20 a 30). Os números vieram do pedido de dados mais completos; o plano pode ser ajustado.

## As planilhas de RFP

| Arquivo | Perguntas | Layout |
|---|---|---|
| `RFP-01-Rede-Varejo-Alfa.xlsx` | 46 | Como a planilha de exemplo: aba de instruções, aba "Questionário", cabeçalho na linha 5 e escala de resposta de 0 a 4 |
| `RFP-02-Banco-Horizonte-Due-Diligence.xlsx` | 84 | O mesmo, com coluna extra de evidência |
| `RFP-03-Grupo-Hospitalar-Vida.xlsx` | 61 | Aba de capa sem perguntas, aba "Requisitos" com títulos de seção e linhas em branco, cabeçalho na linha 4 |

| Variante | Cenário | Esperado |
|---|---|---|
| `RFP-sem-coluna-pergunta.xlsx` | 3 | A regra não acha o cabeçalho; o plano B com IA identifica 4 requisitos |
| `RFP-sem-perguntas.xlsx` | 5 | "Nenhuma pergunta encontrada na planilha" |
| `nao-e-planilha.csv` | 4 | "Envie a RFP em formato .xlsx" |
| `corrompida.xlsx` | 31 | "Arquivo .xlsx inválido" |
| `RFP-casos-de-borda.xlsx` | 15 e 35 | 5 perguntas; o resultado deve ser o mesmo com e sem `injecao-em-documento/` carregado |

O arquivo acima de 10 MB (cenário 31) não está aqui: o teste o gera na hora, para não pesar no repositório.

## Conferido

- As linhas do gabarito batem com as células de todas as planilhas (por script).
- Todos os `.md` válidos seguem as regras de cabeçalho de `FORMATO_BASE_MD.md` (por script).
- Os alertas `critical` do gabarito batem com a lista de termos críticos do SPEC aplicada às perguntas.
- O leitor de planilhas do `backend/` (`identificarPerguntas`) lê as três RFPs pela regra, sem IA, com 46, 84 e 61 perguntas, e a de casos de borda com 5. As variantes inválidas falham com as mensagens do SPEC.

## Revisão pendente

As respostas esperadas do gabarito precisam ser conferidas por uma pessoa do grupo antes de a avaliação de IA (etapa A10) usá-las como critério. O gabarito indica documentos, estado e alertas; os fatos esperados em texto de cada resposta não estão nele.
