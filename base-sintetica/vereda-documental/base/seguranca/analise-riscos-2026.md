---
titulo: Análise de riscos de segurança 2026
tipo: documento
atualizado_em: 2026-03-27
versao: "2026.1"
---

# Análise de riscos de segurança 2026

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Método

Os riscos são avaliados por probabilidade (1 a 5) e impacto (1 a 5). O nível é o produto dos dois. Riscos com nível 12 ou mais exigem plano de tratamento aprovado pelo comitê.

## 2. Riscos avaliados

| Risco | Probabilidade | Impacto | Nível | Tratamento |
|---|---|---|---|---|
| Acesso indevido entre empresas clientes | 1 | 5 | 5 | Isolamento por empresa testado a cada publicação |
| Credencial de usuário do cliente comprometida | 3 | 4 | 12 | MFA obrigatória e bloqueio por tentativas |
| Indisponibilidade da região principal de nuvem | 2 | 4 | 8 | Recuperação em região secundária, testada semestralmente |
| Erro de extração usado em decisão do cliente | 3 | 4 | 12 | Conferência humana e descarte de campos sem trecho válido |
| Vazamento por fornecedor | 2 | 5 | 10 | Avaliação anual e cláusulas contratuais |
| Pedido de documento sem base legal pelo cliente | 2 | 4 | 8 | Finalidade obrigatória por pedido e norma de uso aceitável |
| Perda de dados por falha de backup | 1 | 5 | 5 | Restauração amostral mensal |
| Instrução maliciosa em documento enviado ao modelo de IA | 3 | 3 | 9 | Documento tratado como conteúdo e conferência automática dos trechos |
| Indisponibilidade de emissor estadual | 4 | 2 | 8 | Nova tentativa progressiva e aviso ao cliente |
| Uso de dados para treinar modelos gerais pelo provedor de IA | 1 | 5 | 5 | Proibição contratual e auditoria do contrato |

## 3. Planos de tratamento em andamento

- **Credencial comprometida:** implantar detecção de login em localização incomum até dezembro de 2026.
- **Erro de extração:** ampliar o conjunto de avaliação de 400 para 600 documentos rotulados até março de 2027.

## 4. Próxima revisão

A próxima análise completa está prevista para março de 2027, ou antes, se houver mudança relevante na plataforma ou em um fornecedor.
