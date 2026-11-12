---
titulo: Roteiro técnico de recuperação de serviços
tipo: documento
atualizado_em: 2026-09-25
versao: "1.1"
---

# Roteiro técnico de recuperação de serviços

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Quando usar

Este roteiro técnico detalha a ativação da região secundária, decidida conforme o procedimento de recuperação de desastres. Ele é usado pela equipe de plantão da engenharia.

## 2. Pré-checagem

1. Confirmar no incidente a decisão conjunta do diretor de tecnologia e do responsável de operações.
2. Confirmar o atraso da réplica na região secundária; ele precisa estar dentro do RPO do plano de continuidade.
3. Avisar o responsável por comunicação para atualizar a página de status.

## 3. Ativação

1. Colocar o portal e a API em modo de manutenção, interrompendo as escritas.
2. Promover a réplica do banco relacional na região secundária.
3. Apontar os serviços de aplicação para o banco promovido.
4. Ativar a fila de eventos secundária e conferir o atraso dos webhooks.
5. Rodar a bateria de verificação: login, abertura de pedido, consulta de dossiê e download.
6. Liberar o tráfego em etapas: 10%, 50% e 100%, com 10 minutos de observação entre elas.

## 4. Depois da ativação

Manter monitoramento reforçado por 24 horas, registrar os tempos de cada etapa no incidente e preparar o retorno para a região principal, que só acontece em janela aprovada pelo comitê.

## 5. Tempos de referência

No exercício de setembro de 2026, a ativação completa levou 1 hora e 42 minutos, com perda de dados de 12 minutos.
