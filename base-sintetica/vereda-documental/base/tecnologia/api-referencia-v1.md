---
titulo: Referência da API REST versão 1
tipo: documento
atualizado_em: 2026-09-24
versao: "1.6"
---

# Referência da API REST versão 1

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Visão geral

A API REST versão 1 permite abrir pedidos, consultar status, receber eventos e baixar documentos autorizados. Está disponível apenas no plano Corporativo e exige que o cliente desenvolva a integração do lado dele. A Vereda não desenvolve integrações sob medida dentro do contrato padrão.

Endereço base no ambiente de produção: `https://api.vereda-sintetica.example/v1`. No ambiente de homologação: `https://api.hml.vereda-sintetica.example/v1`. Os domínios `.example` não existem; são usados apenas neste cenário.

## 2. Autenticação

A API usa OAuth 2.0 com o fluxo de credenciais de cliente (client credentials). Cada integração recebe um identificador e um segredo, criados pelo administrador da empresa no portal. O token de acesso vale por 60 minutos. Os escopos disponíveis são:

| Escopo | Permite |
|---|---|
| `pedidos:escrita` | Abrir e cancelar pedidos |
| `pedidos:leitura` | Consultar pedidos e estados |
| `dossies:leitura` | Consultar dossiês e checklists |
| `documentos:download` | Baixar documentos entregues |
| `eventos:gestao` | Cadastrar e remover endereços de webhook |

O segredo é mostrado uma única vez, no momento da criação. Ele pode ser rotacionado a qualquer momento; o segredo anterior continua válido por 24 horas para permitir a troca sem interrupção.

## 3. Recursos principais

| Método e caminho | Descrição |
|---|---|
| `POST /pedidos` | Abre um pedido; devolve o identificador interno e o estado "Aguardando orçamento" |
| `GET /pedidos/{id}` | Estado atual, protocolo externo e histórico do pedido |
| `POST /pedidos/{id}/cancelar` | Pede o cancelamento operacional |
| `GET /dossies/{id}` | Itens do checklist, documentos e pendências |
| `GET /documentos/{id}/arquivo` | Download do arquivo entregue, com registro no log de auditoria |
| `GET /catalogo` | Tipos documentais e localidades cobertas, conforme a matriz de cobertura |

A aprovação do orçamento não pode ser feita pela API: ela exige um aprovador humano no portal ou no aplicativo.

## 4. Idempotência

Todas as requisições `POST` aceitam o cabeçalho `Idempotency-Key`. Uma mesma chave reenviada em até 24 horas devolve a resposta original, sem abrir outro pedido. Além disso, a regra de duplicidade da plataforma devolve o protocolo anterior para um pedido repetido com o mesmo titular, tipo documental e localidade na mesma janela de solicitação.

## 5. Erros

| Código | Quando acontece |
|---|---|
| 400 | Campo obrigatório ausente ou inválido; a resposta lista os campos |
| 401 | Token ausente, expirado ou inválido |
| 403 | O escopo não permite a operação ou o recurso é de outra unidade |
| 404 | O recurso não existe ou pertence a outra empresa |
| 409 | O pedido não está em um estado que permita a operação |
| 429 | Limite de requisições excedido; ver o documento de limites e capacidade |

## 6. Versões

A versão 1 é a única ativa. Mudanças incompatíveis só entram em uma nova versão, anunciada com 90 dias de antecedência, e a versão anterior é mantida por pelo menos 12 meses depois do anúncio.
