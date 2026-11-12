---
titulo: Webhooks e eventos da plataforma
tipo: documento
atualizado_em: 2026-09-24
versao: "1.2"
---

# Webhooks e eventos da plataforma

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Eventos disponíveis

| Evento | Quando é enviado |
|---|---|
| `pedido.estado_alterado` | O pedido muda de estado (por exemplo, de "Protocolado" para "Recebido") |
| `pedido.exigencia` | O emissor registra uma exigência; o evento traz o motivo |
| `documento.entregue` | O documento foi conferido e está disponível no dossiê |
| `documento.vencendo` | Faltam 30 ou 7 dias para o vencimento conhecido |
| `dossie.completo` | Todos os itens obrigatórios do checklist foram cumpridos |

## 2. Cadastro

O administrador cadastra até 5 endereços de webhook por empresa, com o escopo `eventos:gestao`. Cada endereço precisa usar HTTPS com certificado válido. Endereços em redes privadas ou com IP fixo interno são recusados.

## 3. Assinatura

Cada envio traz o cabeçalho `Vereda-Assinatura`, com um HMAC SHA-256 do corpo calculado com o segredo do endereço. O cliente deve conferir a assinatura e o carimbo de tempo, recusando envios com mais de 5 minutos de diferença.

## 4. Entrega e novas tentativas

A plataforma considera entregue o envio que recebe resposta 2xx em até 10 segundos. Sem isso, faz novas tentativas com intervalo crescente: 1 minuto, 5 minutos, 30 minutos, 2 horas e 12 horas. Depois da quinta falha, o endereço é marcado como suspenso e o administrador recebe um e-mail. Os eventos ficam disponíveis para reenvio pelo portal por 7 dias.

## 5. Ordem dos eventos

A ordem de chegada não é garantida. Cada evento traz um número sequencial por pedido e o carimbo de tempo de origem, para o cliente reordenar. Eventos podem chegar duplicados; o campo `id_evento` é único e serve para descartar repetições.

## 6. Conteúdo

O corpo do evento traz identificadores e estados, nunca o conteúdo do documento. Para obter o arquivo, o cliente usa a API de download com o escopo `documentos:download`, o que gera registro no log de auditoria.
