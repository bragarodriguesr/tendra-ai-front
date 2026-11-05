---
feature: ciclo-de-vida-da-tarefa-e-base
status: approved
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_O.md (status approved)
constitution: 1.0.0
---

# Plano: ciclo de vida da tarefa, Exportação e Base

*Plano de 05/11/2026, com as decisões PO1 a PO12 e as fases O-a a O-c validadas no mesmo dia.*

## Objetivo

Implementar os cenários O1 a O17:
- situação da tarefa (em andamento, finalizada, arquivada) no banco e nas rotas, com só leitura garantido no backend;
- submenus de Tarefas, arquivar, reativar e o box de finalização;
- contadores só do trabalho em andamento;
- ordem, filtro e busca da Exportação;
- Base com Dica, tabela enxuta e detalhes do documento.

A geração, a classificação por área e a regra de download (fase J) não mudam.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `backend/migracoes/012_situacao_da_tarefa.sql` (novo) | `tarefas.situacao` (`em_andamento`, `finalizada`, `arquivada`), `situacao_por`, `situacao_em` | O16 |
| `backend/src/persistencia/tarefas.ts` | `Tarefa` com a situação; `mudarSituacao` com a condição da origem na própria consulta | O7, O10, O12 |
| `backend/src/http/rotasDeTarefas.ts` | `tarefaPublica` com a situação; rotas `finalizar`, `arquivar` e `reativar`; `DELETE` recusa finalizada; "Revisar com IA" recusa tarefa encerrada | O7, O10, O12, O13, O17 |
| `backend/src/revisao/revisao.ts` | `itemDaTarefa` recusa com 409 a tarefa encerrada, o que cobre todas as mudanças de item | O11 |
| `backend/src/fluxo/reclassificarAreas.ts` | Só reclassifica tarefas em andamento | O11 |
| `src/api.js` | `finalizarTarefa`, `arquivarTarefa`, `reativarTarefa` | O7, O10, O12 |
| `src/ds/components/navigation/SidebarNav.jsx` e `Sidebar.css` | Subitens (`items` dentro do item), recuados, sem ícone; no menu recolhido, só o item pai | O8 |
| `src/workspace/useWorkspace.js` | Ações de finalizar, arquivar e reativar; box depois do download; telas `finalizadas` e `arquivadas`; filtro e busca da Exportação; detalhes do documento e Dica | O1 a O13 |
| `src/workspace/viewModel.js` | Situação em cada tarefa; listas por situação; contadores; ordem, filtro e busca da Exportação; só leitura na Revisão; colunas da Base | O1 a O15 |
| `src/workspace/screens/Tasks.jsx`, `TaskDetail.jsx`, `Export.jsx`, `Review.jsx`, `Base.jsx`, `overlays.jsx` | Telas e painéis | O1 a O14 |
| `backend/test/`, `test/`, `e2e/` | Testes dos cenários, no PGlite e no Postgres, e jornadas no navegador | O1 a O17 |

## Etapas

### O1. Banco e rotas (fase O-a)
- Migração 012, situação na tarefa, rotas novas, só leitura em `itemDaTarefa` e no "Revisar com IA", `DELETE` de finalizada recusado.
- **Verificação:** testes de rota:
  - finalizar só a pronta, por Revisor e Aprovador;
  - arquivar e reativar só pelo Aprovador, não durante o processamento;
  - 409 nas mudanças de item de tarefa encerrada;
  - exclusão de arquivada e recusa da finalizada;
  - 404 para outra organização;
  - migração com dados de antes da fase.

### O2. Ciclo de vida no front (fase O-a)
- Submenus, telas Em andamento, Finalizadas e Arquivadas, botão "Arquivar", "Reativar" nos detalhes, box depois do download, faixa de só leitura na Revisão e contadores.
- **Verificação:** testes de unidade dos contadores e da ordem; teste de ponta a ponta com a API respondida pelo teste.

### O3. Exportação e limpezas (fase O-b)
- Ordem em três blocos, filtro por status, busca por empresa e título, sem cartão de alertas no Painel, sem download nos detalhes da tarefa.
- **Verificação:** testes de unidade da ordem e da busca; teste de ponta a ponta.

### O4. Base (fase O-c)
- Dica, tabela com Documento, Validade, Idade, Status e Ações, e detalhes do documento.
- **Verificação:** teste de ponta a ponta, com a tabela sem rolagem lateral a 1.024 px e no celular.

### O5. Publicação
- Merge pela conta dona do time na Vercel; deploy no Render e migração 012 conferida no Supabase. A RFP-04 da Pulse fica em andamento.
- **Verificação:** o grupo confere no ambiente publicado, com a situação das tarefas no banco.

## Situação (05/11/2026): implementada e conferida no ambiente publicado

- **O1 (banco e rotas):** migração 012, `mudarSituacao` numa transação com a linha da tarefa travada, rotas `finalizar`, `arquivar` e `reativar`, só leitura em `itemDaTarefa` e no "Revisar com IA", `DELETE` de finalizada recusado e reclassificação só das em andamento.
  - 386 testes no PGlite e no Postgres. Os novos cobrem finalizar (só a pronta, pelo Revisor), arquivar e reativar (só o Aprovador, não durante o processamento), as nove rotas de mudança de item recusadas com 409, exclusão da arquivada e recusa da finalizada, 404 para outra organização (também na suíte de isolamento) e a migração com dados de antes da fase.
- **O2 a O4 (front):** submenus no `SidebarNav` (subitens recuados; no menu recolhido, só o pai, com a contagem e os subitens na dica), três listas de Tarefas, "Arquivar" com confirmação, "Reativar" nos detalhes, box de conclusão, faixa de só leitura na Revisão e nos detalhes, contadores sem as encerradas, Exportação com ordem, filtro e busca, sem cartão de alertas no Painel e sem download nos detalhes, e Base com Dica, tabela de cinco colunas e detalhes do documento.
  - Ícones novos do Lucide: `archive`, `rotate-ccw` e `lightbulb`.
  - 19 testes de unidade e 80 de ponta a ponta verdes, com o novo `e2e/cicloDaTarefa.spec.js` (O1 a O15) e a jornada e o menu lateral ajustados.
  - Conferi no navegador, no computador (inclusive a 1.024 px e com o menu recolhido) e no celular: as três listas, a Revisão só para leitura, a Exportação com o box, a Dica e os detalhes do documento.
- **O5 (publicação):** feita e conferida.
  - **Deploy:** merge do PR #90 às 19:30 UTC, com a conta dona do time na Vercel, sem bloqueio. Vercel pronta e Render no ar às 19:31.
  - **Migração 012 conferida no Supabase:** as 4 tarefas em andamento, sem autoria, inclusive a RFP-04 da Pulse (O16).
  - **Teste manual do grupo (05/11/2026):** todas as mudanças feitas pelo User Teste 3 (Aprovador), na Pulse Benefícios, e registradas no log do backend e no banco:
    - 20:37 UTC: arquivou a RFP-04 enviada às 17:22 (5 itens, nenhum aprovado) (O10);
    - 20:38: finalizou pelo box da Exportação a RFP-04 de 24/10, com os 5 itens aprovados (O6, O7);
    - 20:39: reativou a RFP-04 arquivada (O12);
    - 20:40: arquivou a mesma RFP-04 de novo, que segue arquivada.
  - **Resultado no banco:** a RFP-01 e a RFP-02 em andamento; uma RFP-04 finalizada e a outra arquivada, ambas por User Teste 3.
  - **Só leitura (O11):** nenhum evento de item gravado depois do deploy, nem nas tarefas encerradas.
  - A RFP-04 de 24/10, que a migração deixou em andamento como pedido, foi finalizada pelo grupo no teste, pelo caminho normal do box.
  - A Base (Dica, tabela e detalhes do documento), a ordem, o filtro e a busca da Exportação e os contadores foram conferidos pelo grupo no teste manual. São mudanças de tela, sem registro no banco.

## Ajustes de 05/11/2026: Histórico das tarefas e coluna "Itens"

- **O18 e O19:** migração `013_eventos_de_tarefa.sql`, só de inclusão e sem chave estrangeira para `tarefas` (o registro da exclusão sobrevive), com o nome da tarefa e da empresa guardados na ação.
  - Gravam a importação (`POST /api/tarefas`), a finalização, o arquivamento e a reativação (na mesma transação da mudança de situação) e a exclusão.
  - Rota `GET /api/historico/tarefas`, na suíte de isolamento.
  - No front, o Histórico junta itens e tarefas, dos mais recentes para os mais antigos, com o filtro "Tarefas".
- **Coluna "Itens":** sai das três listas de Tarefas.
- **Menu Tarefas colapsável** (sugestão aprovada pelo grupo com as imagens):
  - uma seta à direita de "Tarefas" abre e recolhe Em andamento, Finalizadas e Arquivadas; aberto por padrão;
  - recolhido, "Tarefas" mostra a contagem de Em andamento e fica marcado quando a página é de um dos subitens;
  - o clique em "Tarefas" continua abrindo Em andamento, sem reabrir os subitens;
  - a escolha fica no navegador de cada pessoa; no menu reduzido a ícones, nada muda.
- **Testes:** 387 no backend, no PGlite e no Postgres; 81 de ponta a ponta.
- **Situação:** implementado, aguardando merge e publicação.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| O1 a O3 | Abrir a Dica e os detalhes de um documento; tabela sem rolagem lateral a 1.024 px |
| O4, O5 | Exportação com tarefas em vários status: ordem, filtro e busca |
| O6, O7 | Baixar uma tarefa pronta, finalizar pelo box e ver o selo em todas as telas |
| O8, O9, O15 | Submenus com contagens; contadores sem as encerradas |
| O10 a O13 | Arquivar, abrir só para leitura, tentar uma edição pela API (409), reativar, excluir arquivada |
| O14 | Detalhes da tarefa sem o botão de download |
| O18, O19 | Importar, finalizar, arquivar, reativar e excluir uma tarefa e ver cada ação no Histórico, com o filtro "Tarefas"; a excluída continua lá |
| O16 | Depois do deploy, todas as tarefas em andamento no banco |
| O17 | Finalizar ou arquivar a tarefa de outra organização (404) |
