---
titulo: Política de Segurança da Informação
tipo: documento
atualizado_em: 2026-08-14
versao: "3.2"
---

# Política de Segurança da Informação

Documento da Órbita Sistemas S.A., empresa fictícia usada para testes. Aplica-se a todos os colaboradores, prestadores e sistemas que tratam dados de clientes.

## 1. Objetivo

Proteger a confidencialidade, a integridade e a disponibilidade das informações tratadas pela Órbita e pelos clientes que usam a plataforma.

## 2. Criptografia

### 2.1 Dados em repouso

Todos os dados de clientes armazenados em bancos de dados, arquivos e cópias de segurança são criptografados com AES-256.

### 2.2 Dados em trânsito

Toda comunicação entre usuários, integrações e a plataforma usa TLS 1.2 ou superior. Conexões sem criptografia são recusadas.

## 3. Controle de acesso

### 3.1 Autenticação multifator

A autenticação multifator (MFA) é obrigatória para todos os acessos administrativos à plataforma e à infraestrutura. Para os usuários finais dos clientes, o MFA está disponível e pode ser exigido por política do cliente.

### 3.2 Revisão de acessos

Os acessos privilegiados são revisados a cada trimestre. Acessos de pessoas desligadas são revogados em até 24 horas.

## 4. Registro de acessos

### 4.1 O que é registrado

São registrados logins, falhas de autenticação, alterações de permissões e acessos a dados de clientes por colaboradores da Órbita.

### 4.2 Retenção de logs

Os logs de acesso são mantidos por 12 meses em armazenamento imutável e só podem ser consultados pela equipe de segurança.

## 5. Gestão de vulnerabilidades

### 5.1 Varreduras

A Órbita executa varreduras automatizadas de vulnerabilidades uma vez por mês, na aplicação e na infraestrutura.

### 5.2 Prazos de correção

Vulnerabilidades críticas são corrigidas em até 7 dias corridos. Vulnerabilidades altas são corrigidas em até 30 dias corridos.

### 5.3 Testes de penetração

Uma empresa independente realiza testes de penetração uma vez por ano. O resumo dos resultados pode ser compartilhado com clientes mediante acordo de confidencialidade.

## 6. Certificações

A Órbita é certificada na norma ISO/IEC 27001. O certificado vigente é válido até 31 de março de 2027, e a auditoria de manutenção ocorre anualmente.

## 7. Resposta a incidentes

Incidentes de segurança que afetem dados de clientes são comunicados aos clientes afetados em até 72 horas após a confirmação.
