---
titulo: Relatório de impacto: extração documental assistida
tipo: documento
atualizado_em: 2026-08-19
versao: "1.0"
---

# Relatório de impacto: extração documental assistida

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Escopo da avaliação

Este relatório de impacto à proteção de dados avalia o módulo de extração assistida, que lê documentos com dados de titulares e preenche campos estruturados com ajuda de modelos de linguagem.

## 2. Riscos identificados

| Risco | Probabilidade | Impacto | Medida |
|---|---|---|---|
| Uso de documentos para treinar modelos gerais | Baixa | Alto | Contrato com o provedor de IA proíbe o treinamento; auditoria anual do contrato |
| Extração de dados além da finalidade | Média | Médio | Campos extraídos limitados por tipo documental |
| Erro de extração levando a decisão errada | Média | Alto | Conferência humana obrigatória e campos sem trecho válido descartados |
| Acesso indevido entre empresas | Baixa | Alto | Isolamento por empresa testado a cada publicação |
| Retenção excessiva no provedor de IA | Baixa | Médio | Retenção técnica de 30 dias, verificada trimestralmente |

## 3. Dados sensíveis

O módulo não foi desenhado para tratar dados pessoais sensíveis. Quando um documento contém dado sensível (por exemplo, informação de saúde em uma certidão judicial), a extração não cria campo estruturado para ele; o texto fica apenas no arquivo original.

## 4. Conclusão

O risco residual foi considerado aceitável pela comissão de privacidade, com revisão anual ou a cada mudança relevante no provedor de IA. Esta avaliação é interna e não constitui certificação.
