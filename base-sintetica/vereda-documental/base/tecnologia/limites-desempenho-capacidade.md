---
titulo: Limites de uso, desempenho e capacidade
tipo: documento
atualizado_em: 2026-09-18
versao: "1.0"
---

# Limites de uso, desempenho e capacidade

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Limites da API

| Item | Limite |
|---|---|
| Requisições por minuto, por integração | 600 |
| Requisições simultâneas, por integração | 20 |
| Pedidos abertos por requisição em lote | 500 |
| Tamanho máximo do corpo da requisição | 5 MB |

Ao passar do limite, a API responde com o código 429 e o cabeçalho `Retry-After`, em segundos.

## 2. Limites do portal

| Item | Limite |
|---|---|
| Linhas por importação CSV | 5.000 |
| Arquivos por envio manual ao dossiê | 50 |
| Tamanho de arquivo para extração | 50 MB e 200 páginas |
| Usuários simultâneos por empresa | Sem limite contratual; capacidade dimensionada para 2.000 |

## 3. Metas de desempenho

- Abertura de pedido pelo portal: resposta em até 2 segundos em 95% das requisições.
- Consulta de estado pela API: resposta em até 500 milissegundos em 95% das requisições.
- Extração assistida: resultado em até 10 minutos para documentos de até 50 páginas em 90% dos casos.

As metas de desempenho são objetivos internos de engenharia, não compromissos contratuais. Os compromissos de disponibilidade estão no anexo de níveis de serviço.

## 4. Capacidade

A plataforma é dimensionada para processar até 200 mil pedidos por mês no conjunto de clientes. O teste de carga semestral mais recente (cenário fictício, setembro de 2026) sustentou 3 vezes o pico de tráfego observado no trimestre sem degradação das metas.

## 5. Crescimento acima dos limites

Clientes que precisem de limites maiores na API podem pedir um ajuste pelo gerente de conta. O aumento é avaliado pela equipe de tecnologia e formalizado em aditivo, sem custo adicional até 1.200 requisições por minuto.
