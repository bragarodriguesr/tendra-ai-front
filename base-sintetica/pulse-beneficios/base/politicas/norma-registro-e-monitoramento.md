---
titulo: Norma de Registro e Monitoramento de Eventos
tipo: documento
atualizado_em: 2026-07-28
versao: "1.5"
---

# Norma de Registro e Monitoramento de Eventos

Documento da Pulse Benefícios LTDA, empresa fictícia criada para testes do Tendra.ai. Nenhum dado aqui é real.

## 1. Eventos registrados

São registrados logins e falhas de autenticação, alterações de permissões, acessos a dados de beneficiários por colaboradores, operações administrativas no portal da empresa cliente e transações do motor de autorização.

## 2. Retenção dos registros

Os registros de acesso e de auditoria são mantidos por 12 meses em armazenamento imutável. Após esse prazo, são eliminados de forma segura, salvo obrigação legal de guarda.

## 3. Monitoramento

### 3.1 Central de monitoramento

Os eventos são enviados a uma plataforma de gestão de eventos de segurança (SIEM), monitorada 24 horas por dia, 7 dias por semana.

### 3.2 Alertas

Alertas de severidade alta são tratados em até 30 minutos. Os relógios dos sistemas são sincronizados por NTP.
