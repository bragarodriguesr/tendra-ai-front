---
titulo: Política de backup e restauração
tipo: documento
atualizado_em: 2026-08-08
versao: "1.2"
---

# Política de backup e restauração

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. O que é copiado

Banco relacional, armazenamento de objetos com os documentos, configurações das empresas clientes e logs de auditoria.

## 2. Frequência e retenção

| Item | Frequência | Retenção |
|---|---|---|
| Banco relacional | Completo diário e incremental a cada 15 minutos | 35 dias |
| Documentos | Versionamento contínuo | 35 dias para versões apagadas |
| Configurações | Diária | 90 dias |
| Logs de auditoria | Contínua, em armazenamento imutável | Conforme a norma de registro e monitoramento |

## 3. Proteção das cópias

As cópias são criptografadas com AES-256 e guardadas na região secundária no Brasil, em conta de nuvem separada da produção, com permissão de exclusão restrita a duas pessoas.

## 4. Testes de restauração

Uma restauração amostral é feita todo mês, sorteando um dia e conferindo a integridade dos dados restaurados. Uma restauração completa do banco é feita no exercício semestral do plano de continuidade.

## 5. Restauração a pedido do cliente

A restauração de dados apagados por engano pelo cliente pode ser pedida em até 30 dias, por chamado de severidade 2. A restauração é feita apenas para a empresa que pediu, sem afetar as demais.
