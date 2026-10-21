---
titulo: Plano de Continuidade de Negócios e Recuperação de Desastres
tipo: documento
atualizado_em: 2026-09-02
versao: "2.0"
---

# Plano de Continuidade de Negócios e Recuperação de Desastres

Documento da Órbita Sistemas S.A., empresa fictícia usada para testes.

## 1. Objetivos de recuperação

### 1.1 Objetivo de ponto de recuperação (RPO)

O RPO da plataforma é de 15 minutos. Em um desastre, a perda máxima aceita de dados é a dos últimos 15 minutos.

### 1.2 Objetivo de tempo de recuperação (RTO)

O RTO da plataforma é de 4 horas, contadas a partir da declaração do desastre.

## 2. Cópias de segurança

Cópias incrementais são feitas a cada 15 minutos e cópias completas são feitas todos os dias. As cópias são mantidas por 35 dias e replicadas para uma região secundária.

## 3. Site de recuperação de desastres

A Órbita mantém um ambiente de recuperação em uma região geográfica diferente da região principal. O ambiente secundário recebe a replicação contínua dos dados e pode assumir o tráfego em caso de falha da região principal.

## 4. Testes do plano

### 4.1 Testes de recuperação

A recuperação a partir das cópias de segurança é testada a cada semestre, com relatório assinado pela gerência de infraestrutura.

### 4.2 Simulação de desastre

Uma simulação completa de desastre, com troca de região, é realizada uma vez por ano.

## 5. Comunicação em crises

Os clientes afetados são avisados pela página de status e por e-mail em até 1 hora após a declaração do desastre.
