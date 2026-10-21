---
titulo: Plano de Continuidade de Negócios
tipo: documento
atualizado_em: 2026-09-05
versao: "3.1"
---

# Plano de Continuidade de Negócios

Documento da Pulse Benefícios LTDA, empresa fictícia criada para testes do Tendra.ai. Nenhum dado aqui é real.

## 1. Escopo e processos críticos

O plano cobre a autorização de transações, o crédito de benefícios, o aplicativo móvel, o portal da empresa cliente e o atendimento. A análise de impacto no negócio (BIA) define a autorização de transações como o processo mais crítico.

## 2. Objetivos de recuperação

### 2.1 Objetivo de ponto de recuperação (RPO)

O RPO da plataforma é de 5 minutos.

### 2.2 Objetivo de tempo de recuperação (RTO)

O RTO é de 2 horas, contadas a partir da declaração do desastre. Este é o compromisso assumido com os clientes para o serviço de autorização de transações.

## 3. Estratégia de recuperação

A plataforma roda em três zonas de disponibilidade na região principal, com replicação síncrona dos bancos de dados. Um ambiente de recuperação de desastres, em região secundária também no território brasileiro, recebe replicação contínua e pode assumir o tráfego.

## 4. Testes

O plano de recuperação de desastres é testado a cada semestre, com relatório e plano de ação. A análise de impacto no negócio é revisada uma vez por ano.

## 5. Gestão de crises

### 5.1 Comitê de crise

O comitê de crise é formado pela diretoria de tecnologia, segurança da informação, operações e atendimento. Ele declara o desastre e coordena a resposta.

### 5.2 Comunicação

Os clientes afetados são avisados pela página de status e por e-mail em até 1 hora após a declaração do desastre.

## 6. Dependências externas

Os processos críticos dependem da processadora de cartões, dos adquirentes e dos bancos de liquidação. Cada fornecedor crítico tem plano de contingência registrado e avaliado todos os anos.
