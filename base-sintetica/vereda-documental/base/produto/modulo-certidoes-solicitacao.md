---
titulo: Módulo de solicitação de certidões
tipo: documento
atualizado_em: 2026-09-26
versao: "1.4"
---

# Módulo de solicitação de certidões

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Abertura do pedido

O solicitante escolhe o tipo documental, o titular (pessoa física ou jurídica, sempre com identificador sintético no ambiente de demonstração), a localidade e a finalidade. Pedidos em lote podem ser importados por planilha CSV, com validação linha a linha antes da confirmação.

Campos obrigatórios por pedido: tipo documental, titular, unidade federativa, município quando o emissor for municipal, finalidade e centro de custo.

## 2. Orçamento

Antes do protocolo, a plataforma monta o orçamento com a taxa da Vereda por solicitação concluída e a estimativa de emolumentos externos informada pelo emissor. O pedido só segue depois da aprovação no portal. Despesas acima do limite da empresa exigem um aprovador diferente de quem abriu o pedido.

## 3. Acompanhamento

Cada pedido mostra o estado atual, a data de protocolo, o canal usado e o prazo estimado do emissor. Mudanças de estado geram notificação por e-mail e, no plano Corporativo, também por webhook.

| Estado | O que significa |
|---|---|
| Aguardando orçamento | A estimativa de custos ainda não foi aprovada |
| Protocolado | O pedido foi enviado ao emissor |
| Exigência do emissor | O emissor pediu documento ou informação adicional |
| Recebido | O arquivo chegou do emissor e está em conferência |
| Entregue | O documento está disponível no dossiê |

## 4. Renovação

Quando a validade de um documento é conhecida, a plataforma sugere a renovação a 30 e a 7 dias do vencimento. A renovação abre um novo pedido ligado ao anterior, com o mesmo titular e localidade, e passa de novo pelo orçamento.

## 5. O que o módulo não faz

O módulo não contorna exigências de procuração, não usa credenciais pessoais de terceiros e não marca um documento como "negativo" quando o emissor está indisponível. Falhas do emissor ficam registradas e o pedido é tentado de novo.
