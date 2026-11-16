---
titulo: Anexo técnico: layout da exportação de gastos
tipo: documento
atualizado_em: 2026-08-21
versao: "1.1"
---

# Anexo técnico: layout da exportação de gastos

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Arquivo

O arquivo de exportação de gastos é um CSV em UTF-8, separado por ponto e vírgula, com cabeçalho na primeira linha e uma linha por solicitação concluída ou cancelada com cobrança. Datas no formato AAAA-MM-DD e valores com ponto decimal.

## 2. Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `id_solicitacao` | Texto | Identificador interno da solicitação na Vereda |
| `protocolo_emissor` | Texto | Número de protocolo do emissor, quando existe |
| `data_abertura` | Data | Data de abertura do pedido |
| `data_protocolo` | Data | Data de envio ao emissor |
| `data_recebimento` | Data e hora | Recebimento do arquivo do emissor |
| `data_entrega` | Data e hora | Disponibilização no dossiê |
| `tipo_documental` | Texto | Tipo documental do catálogo |
| `familia` | Texto | Família documental |
| `uf` | Texto (2) | Unidade federativa |
| `municipio` | Texto | Município, quando o emissor é municipal |
| `canal` | Texto | Integração, portal do emissor ou assistida |
| `titular_identificador` | Texto | Identificador do titular (sintético em demonstração) |
| `unidade` | Texto | Unidade da empresa cliente |
| `centro_custo` | Texto | Centro de custo informado no pedido |
| `solicitante` | Texto | E-mail corporativo de quem abriu o pedido |
| `aprovador` | Texto | E-mail corporativo de quem aprovou o orçamento |
| `taxa_vereda` | Decimal | Taxa da Vereda pela solicitação concluída |
| `emolumento_orcado` | Decimal | Valor estimado no orçamento |
| `emolumento_cobrado` | Decimal | Valor efetivamente cobrado pelo emissor |
| `diferenca_repassada` | Decimal | Diferença repassada na fatura |
| `desconto_volume` | Decimal | Desconto por volume aplicado sobre a taxa |
| `estado_final` | Texto | Entregue ou cancelado |
| `motivo_cancelamento` | Texto | Preenchido só para pedidos cancelados |
| `dossie` | Texto | Identificador do dossiê de destino |
| `prazo_emissor_dias` | Inteiro | Dias úteis entre protocolo e recebimento |
| `prazo_vereda_dias` | Inteiro | Dias úteis entre recebimento e entrega |

## 3. Entrega

O arquivo é gerado todo dia útil às 6h e enviado ao SFTP do cliente, com nome `gastos_AAAAMMDD.csv`. Arquivos não recebidos podem ser gerados de novo pelo portal por até 90 dias.

## 4. Mudanças no layout

Campos novos são acrescentados ao fim da linha, com aviso de 60 dias. Campos existentes não mudam de posição nem de tipo.
