# Base sintética da Vereda Documental

Material da fase U (`docs/mvp-resposta-rfp/spec/SPEC_FASE_U.md`). Tudo aqui é fictício: a **Vereda Documental** (plataforma de emissão, gestão e inteligência documental) não existe, e nenhum documento, cliente ou valor é real.

A base existe para avaliar a seleção da base por área. A base da Pulse Benefícios (cerca de 6 mil tokens) fica abaixo do limiar de 50 mil tokens da decisão PU11; esta base fica acima dele.

## Estrutura

| Caminho | O que é |
|---|---|
| `base/existentes/` | Os 16 documentos que já estavam na base publicada da Vereda, reconstruídos a partir do banco em 12/11/2026 com as mesmas linhas, para a avaliação conferir as citações em disco. **Não subir de novo:** já estão na base publicada. |
| `base/<área>/` | 86 documentos novos, nas pastas `produto`, `tecnologia`, `seguranca`, `comercial`, `juridico`, `operacoes`, `referencia`, `institucional` e `rfp-passadas`. São os arquivos a subir pela tela Base de conhecimento da Vereda. |
| `areas-esperadas-documentos.json` | Áreas esperadas de cada documento novo, rotuladas pelo autor da base, para a avaliação da classificação (cenário U7). |
| `rfps/RFP-V1-Banco-Pampa-Homologacao.xlsx` | RFP com 54 perguntas, no layout das RFPs da Pulse (aba "Questionário", cabeçalho na linha 5). |
| `rfps/gabarito-rfp-vereda.json` | Gabarito da RFP: área esperada, documentos esperados e casos especiais de cada pergunta (cenário U16). |
| `gerador/` | Scripts Python que geram `base/`, o JSON de áreas, a RFP e o gabarito. |

## Números

- 102 documentos no total (16 existentes + 86 novos), sendo 4 RFPs passadas (`tipo: rfp-passada`, ficam "Geral" sem classificar).
- Cerca de 48 mil tokens pela estimativa da carga (caracteres ÷ 4): 43 mil dos novos e 4,8 mil dos existentes. A contagem da API, que o processamento usa, costuma ficar acima disso em textos em português; a medida exata sai da primeira tarefa processada.
- Áreas dos documentos novos, sem contar os que têm várias áreas: cerca de 15 a 20 por área, mais os "Geral".

## Casos embutidos

| Caso | Onde | Pergunta da RFP |
|---|---|---|
| Fonte em outra área | O limite da API do plano Profissional só está na tabela de preços (Comercial) | 3.03 (Tecnologia) |
| Conflito de RPO e RTO | Anexo de SLA (60 min e 4 h) e plano de continuidade (15 min e 2 h), ambos existentes | 3.06 |
| Conflito de retenção de logs | Norma de registro (24 meses) e política de segurança (6 meses), ambas existentes | 4.05 |
| Conflito de prazo de disponibilização | Contrato (2 dias úteis) e portal (1 dia útil), ambos existentes; as condições gerais novas repetem os 2 dias | 5.03 |
| Sem resposta na base | — | 4.11 e 6.02 |
| Compromisso não sustentado | O contrato não prevê multa além dos créditos | 5.07 |
| Fonte antiga (mais de 120 dias na data de referência) | Tabela de preços, política de reajuste, emolumentos e outros com data até julho de 2026 | Várias |

## Como regenerar

```bash
cd base-sintetica/vereda-documental/gerador
python3 gerar.py
python3 gerar_rfp.py
```

Os scripts usam só a biblioteca padrão e o `openpyxl`.

## Como carregar

Entre no Tendra.ai com uma conta da organização Vereda Documental, abra a tela Base de conhecimento, use "Subir documentos" e escolha os arquivos das pastas de `base/`, **exceto `base/existentes/`**. O resultado do envio deve mostrar 86 carregados e nenhum recusado.
