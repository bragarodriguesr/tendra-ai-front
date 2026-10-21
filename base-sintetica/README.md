# Dados sintéticos para teste e avaliação

Material da **fase 0.2** do `docs/mvp-resposta-rfp/PLAN.md`. Tudo aqui é fictício: a empresa **Órbita Sistemas S.A.** não existe, e nenhum documento é real. É a base para testar e avaliar o pipeline (comandos `carregar-base`, `responder` e `avaliar`).

**Data de referência para os testes: 2026-10-21.** Os alertas de fonte antiga (mais de 120 dias) foram calculados para essa data, então os testes devem fixar o relógio nela.

## Estrutura

| Caminho | O que é |
|---|---|
| `base/` | Seis documentos `.md` com o cabeçalho de `docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`. É a pasta que o comando `carregar-base` lê. |
| `fora-da-base/` | Um `.md` válido que **nunca** pode ser usado como fonte (cenário 35). Não é carregado. |
| `casos-de-carga/` | Treze arquivos para testar a validação da carga (cenários 7 a 9 e os 16 de `FORMATO_BASE_MD.md`). |
| `rfp/` | A planilha de RFP com 28 perguntas, uma variante sem coluna "Pergunta", uma sem perguntas e dois arquivos inválidos. |
| `gabarito.json` | Para cada pergunta: linha na planilha, documentos esperados, estado e alertas esperados e fatos que a resposta deve conter. |
| `pessoas.json` | As duas pessoas sintéticas (nome e papel) usadas nas ações de revisão. |

## A base (`base/`)

| Documento | Tipo | `atualizado_em` | Observação |
|---|---|---|---|
| `politicas/seguranca-informacao.md` | documento | 2026-08-14 | Criptografia, MFA, logs, vulnerabilidades, ISO 27001. Não menciona SOC 2 de propósito. |
| `continuidade/plano-continuidade.md` | documento | 2026-09-02 | RPO de 15 minutos e RTO de 4 horas. |
| `continuidade/procedimento-backup-recuperacao.md` | documento | 2026-07-20 | RPO de 1 hora e RTO de 8 horas: **conflita** com o plano. |
| `privacidade/politica-privacidade.md` | documento | 2025-02-10 | **Fonte antiga**: mais de 120 dias. |
| `produto/descricao-tecnica.md` | documento | 2026-09-20 | SLA, hospedagem, API, SSO, suporte. A seção 6 contém uma **instrução maliciosa** de propósito. |
| `rfps-passadas/rfp-banco-exemplo-2025.md` | rfp-passada | 2026-08-05 | Respostas de uma RFP anterior. |

## Casos embutidos e onde estão no gabarito

| Caso | Cenário do SPEC | Onde |
|---|---|---|
| Pergunta com resposta na base | 12 e 13 | Q01 a Q06, Q08 a Q14, Q16 a Q21, Q25, Q27 |
| Pergunta sem resposta na base | 14 | Q07, Q15, Q22, Q23, Q24, Q26, Q28 |
| Compromisso não sustentado pela base | 34 | Q22 (multa de 10%) e Q23 (responsabilidade civil ilimitada) |
| Instrução maliciosa em documento | 15 | `descricao-tecnica.md`, seção 6; testada por Q07 (SOC 2) e Q22 |
| Instrução maliciosa na planilha | 15 | Q28 |
| Fonte desatualizada (`old`) | 20 | Q12 e Q13, que dependem de `politica-privacidade.md` |
| Termo crítico (`critical`) | 21 | Q22, Q23, Q24 e Q27 |
| Fontes conflitantes (`conflict`) | 22 | Q08 (RPO e RTO) |
| Documento fora da base | 35 | Q15: a resposta existe só em `fora-da-base/` |
| RFP passada como fonte | 7 | Q14 e Q25 |

Totais: 28 perguntas, 21 com resposta na base e 7 sem. Cada caso tem ao menos uma pergunta no gabarito.

## A planilha (`rfp/`)

| Arquivo | Cenário | Para que serve |
|---|---|---|
| `RFP-Orbita-Cliente-Exemplo.xlsx` | 1, 2 | Coluna "Pergunta", linhas de título de seção e linhas vazias entre as seções. As perguntas estão nas linhas 3 a 38. |
| `RFP-sem-coluna-pergunta.xlsx` | 3 | Sem cabeçalho "Pergunta" (a coluna chama "Requisito"): ativa o plano B com IA. Tem 4 requisitos. |
| `RFP-sem-perguntas.xlsx` | 5 | Cabeçalho "Pergunta" sem nenhuma linha preenchida. |
| `nao-e-planilha.csv` | 4 | Formato diferente de `.xlsx`. |
| `corrompida.xlsx` | 31 | Extensão `.xlsx`, mas não é uma planilha válida. |

O arquivo acima de 10 MB (cenário 31) não está aqui: o teste o gera na hora, para não pesar no repositório.

## Casos de carga (`casos-de-carga/`)

| Arquivo | Resultado esperado na carga |
|---|---|
| `sem-cabecalho.md` | Recusado: cabeçalho ausente |
| `cabecalho-sem-fechamento.md` | Recusado: cabeçalho sem fechamento |
| `sem-atualizado-em.md` | Recusado: campo obrigatório ausente |
| `tipo-invalido.md` | Recusado: `tipo` inválido |
| `data-formato-errado.md` | Recusado: data fora de `AAAA-MM-DD` |
| `data-futura.md` | Recusado: data no futuro |
| `titulo-curto.md` | Recusado: título com menos de 3 caracteres |
| `versao-longa.md` | Recusado: versão com mais de 20 caracteres |
| `corpo-vazio.md` | Recusado: sem conteúdo |
| `nao-utf8.md` | Recusado: fora de UTF-8 |
| `campo-desconhecido.md` | Carregado, com aviso do campo `area` |
| `versao-numerica.md` | Carregado: versão `3.2` convertida para texto |
| `outro-formato.txt` | Ignorado: formato não aceito |

## Formato do gabarito

Cada item de `perguntas` em `gabarito.json` tem:

- `id` e `linha`: identificador (Q01 a Q28) e linha da pergunta na planilha principal;
- `pergunta`: texto exato da célula;
- `tem_resposta`: `false` quando a base não responde;
- `estado_esperado`: `sugerida` ou `sem-rascunho`;
- `documentos_esperados`: caminhos relativos a `base/` que devem aparecer entre as fontes (critério de relevância);
- `alertas_esperados`: alertas que o item deve receber (`old`, `conflict`, `critical`); a ausência de `nocontext` ou `lowconf` em itens com resposta também é verificada;
- `fatos_esperados`: pontos que o texto da resposta deve conter (apoio à revisão de fidelidade);
- `casos`: marcadores do caso de teste coberto.

## Revisão pendente

O material foi criado, e a verificação da fase 0.2 pede uma revisão contra a lista da seção 5 de `ARQUITETURA_MAPPING.md`. As respostas esperadas do gabarito devem ser conferidas por uma pessoa do grupo antes de a avaliação de IA (etapa A10) usá-las como critério.
