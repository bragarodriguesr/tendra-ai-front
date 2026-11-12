---
titulo: Arquitetura de sistemas e integrações
tipo: documento
atualizado_em: 2026-09-12
versao: "1.0"
---

# Arquitetura de sistemas e integrações

---

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Hospedagem

Região principal em São Paulo e recuperação em região secundária no Brasil, em provedor fictício Nuvem Aurora.

## 2. Isolamento

Identificador de tenant obrigatório nas consultas e políticas de acesso por linha; testes automatizados verificam acessos entre empresas.

## 3. Componentes

Portal web, aplicativo, gateway de API, serviços de adesão e solicitação, fila de eventos e banco relacional com réplicas.

## 4. Subprocessadores

Fornecedores fictícios Nuvem Aurora (infraestrutura) e Mensageria Ipê (notificações); ambos sujeitos a avaliação anual e contrato de tratamento.

## 5. Backup

Backup completo diário, incrementais a cada 15 minutos e retenção de 35 dias; restauração amostral mensal.

## 6. Mudanças

Revisão de código por pessoa diferente, testes de segurança no pipeline e aprovação de mudança com plano de reversão.
