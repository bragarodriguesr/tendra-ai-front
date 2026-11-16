---
titulo: Arquitetura da extração assistida por IA
tipo: documento
atualizado_em: 2026-10-01
versao: "1.1"
---

# Arquitetura da extração assistida por IA

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Etapas do processamento

1. **Recepção:** o arquivo chega do emissor ou do envio manual e recebe uma verificação de formato e de vírus.
2. **Reconhecimento de texto:** PDFs digitalizados e imagens passam por OCR; PDFs pesquisáveis usam o texto embutido.
3. **Classificação do tipo documental:** um modelo identifica o tipo (por exemplo, certidão trabalhista ou matrícula).
4. **Extração de campos:** um modelo de linguagem preenche os campos do tipo documental e indica a página e o trecho de cada um.
5. **Conferência automática:** o código confere se o trecho indicado existe no texto do documento; campo sem trecho válido é descartado.
6. **Fila de conferência:** o analista do cliente revisa os campos, começando pelos de confiança baixa.

## 2. Modelos usados

Os modelos de linguagem são usados por meio de um provedor de IA contratado pela Vereda, com cláusula que proíbe o uso dos dados para treinar modelos gerais. A inferência fica restrita ao serviço contratado, com retenção técnica de 30 dias no provedor.

## 3. Isolamento

Cada documento é processado de forma isolada, sem mistura com documentos de outras empresas. Instruções escritas dentro de um documento são tratadas como conteúdo, nunca como comando para o modelo.

## 4. Avaliação contínua

A qualidade da extração é medida mensalmente contra um conjunto sintético de 400 documentos rotulados. Uma nova versão de modelo ou de instrução só entra em produção se mantiver pelo menos 95% de campos corretos no conjunto de avaliação.
