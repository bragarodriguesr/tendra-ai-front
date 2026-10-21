---
titulo: Arquitetura de Sistemas e Aplicações
tipo: documento
atualizado_em: 2026-09-18
versao: "6.2"
---

# Arquitetura de Sistemas e Aplicações

Documento da Pulse Benefícios LTDA, empresa fictícia criada para testes do Tendra.ai. Nenhum dado aqui é real.

## 1. Visão geral

A plataforma da Pulse é composta pelo aplicativo móvel, pelo portal da empresa cliente, por uma camada de APIs e por serviços de back-end que autorizam transações, creditam benefícios e liquidam pagamentos com a rede de estabelecimentos.

## 2. Camadas

### 2.1 Canais

O aplicativo móvel para iOS e Android é desenvolvido em React Native. O portal da empresa cliente é uma aplicação web em React.

### 2.2 Camada de APIs

Um API gateway centraliza autenticação OAuth 2.0 e OpenID Connect, limites de uso e roteamento. Os clientes corporativos integram-se por API REST com notificações por webhooks.

### 2.3 Serviços de back-end

Os serviços são microsserviços em Kotlin e Node.js, executados em Kubernetes. Eventos entre serviços trafegam em Apache Kafka. O motor de autorização de transações responde com latência p95 inferior a 300 milissegundos.

### 2.4 Dados

Os dados transacionais ficam em PostgreSQL gerenciado, com alta disponibilidade em três zonas. Um cache Redis atende consultas de saldo. Um data lake recebe dados anonimizados para análises.

## 3. Hospedagem e ambientes

A plataforma é hospedada em nuvem pública, na região de São Paulo. O ambiente de recuperação de desastres fica em região secundária também no território brasileiro. Os ambientes de desenvolvimento, homologação e produção são segregados em contas e redes distintas.

## 4. Multiempresa e isolamento

A plataforma é multiempresa. Todos os registros carregam o identificador da empresa cliente, e dados pessoais de beneficiários têm criptografia de campo na camada de aplicação.

## 5. Integrações externas

A plataforma integra-se à processadora de cartões, aos adquirentes, aos bancos de liquidação (Pix e TED) e ao serviço de antifraude. Os subprocessadores são o provedor de nuvem, o serviço de envio de notificações push e SMS e o serviço de e-mails transacionais.

## 6. Entrega e observabilidade

O código é entregue por pipelines de integração e entrega contínuas, com infraestrutura como código. Métricas, logs e rastreamentos distribuídos alimentam a central de monitoramento.
