# Chat

_Started 2026-10-03 23:01 UTC_

---

## User

Continuing from "Nova RFP button text".

## Assistant

Trabalhamos no front do Tendra.ai seguindo o PRD, montando um protótipo navegável com site integrado e workspace com nove telas principais (Dashboard, Tarefas, Detalhes, Revisão, Fonte, Exportação, Histórico, Nova RFP/RFI, Base de Conhecimento, Suporte).

**Decisões tomadas:**

- Site e Workspace unificados num único arquivo que alterna entre visões sem recarregar.
- Sistema de papéis (Revisor e Aprovador) com permissões diferenciadas.
- Dashboard como página inicial com números gerais, gráficos de status, tarefas por mês e prazos próximos (menos de 15 dias, excluindo vencidas).
- Alertas como cards sobrepostos com navegação por setas.
- Exportação com cards contextuais (bloqueadas ou prontas) e barra de progresso.
- Histórico com abas de filtro (Todos, Aprovações, Revisões).
- Prazos com menos de 5 dias em vermelho e negrito; vencidas com tag "Vencido" em vermelho com ícone de relógio.
- Base de Conhecimento com coluna "Ações" (só ícones com label ao passar ponteiro) incluindo toggle ativo/inativo que marca documento como "Inativo".
- Coluna "Subiu" renomeada para "Enviado por".

**Atual:**

Oito tarefas de exemplo: Cordel Seguros (vencida, 70% de 100), Orbis Energia (falha no carregamento, 0%), Banco Meridian (pronta), Helios Logística (pronta), Nimbus Telecom (em revisão, 75% de 60), Solaris Energia (em revisão, 60% de 150), Atlas Saúde (pronta, 32 de 32). Cada tarefa em revisão tem itens, perguntas, respostas e fontes próprios. Toggle de switch em tamanho exato do design system (44×26 px). Verificador rodou e encontrou um erro em `exportCount` (não utilizado) e alguns usos de variável `c` que já foram contextualizados. Cartão do Banco Meridian na Exportação agora lê contagens certas.

**Pendente:**

Versão responsiva da tela de Revisão para telas abaixo de 1280 px. P1 e P2 (busca avançada, auditoria detalhada, "Reaprovar") fora do escopo.

**Arquivo:** Tendra.ai App.dc.html

