---
feature: tratamento-de-area
status: approved
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_N.md (status approved)
constitution: 1.0.0
---

# Plano: tratamento de área

*Plano de 04/11/2026, com as decisões PN1 a PN9 validadas no mesmo dia (áreas só para o Aprovador; reclassificação das tarefas em aberto na migração).*

## Objetivo

Implementar os cenários N1 a N15:
- áreas no Aprovador e na pergunta (o Revisor segue sem área);
- classificação das perguntas pela IA no processamento;
- aprovação restrita pela área, no backend e na tela;
- Revisão com "Minha área primeiro".

A geração das respostas não muda.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `backend/migracoes/011_areas.sql` (novo) | `perfis.areas text[] NOT NULL DEFAULT '{}'`, com restrição de Revisor sem área; `itens.area text NOT NULL DEFAULT 'Geral'`; `tarefas.areas_classificadas_em timestamptz`, já preenchida nas tarefas com todos os itens aprovados; `eventos.acao` aceita `area`; Aprovadores atuais com `{C-Level}` | N1, N10, N12, N15 |
| `backend/src/fluxo/reclassificarAreas.ts` (novo) e `backend/src/http/servidor.ts` | Rotina chamada ao iniciar o servidor, em segundo plano: classifica as tarefas prontas sem `areas_classificadas_em` e as marca; falha deixa a tarefa para a próxima subida | N15 |
| `backend/src/regras/areas.ts` (novo) | Lista de áreas (PN1), `C-Level`, validação e a regra `podeAprovar(areasDaPessoa, papel, areaDoItem)` | N5 a N7 |
| `backend/src/autenticacao/perfis.ts`, `sessoes.ts`, `cli/cadastrarPerfil.ts` | Perfil e sessão com `areas`; `cadastrar-perfil --areas` só para o Aprovador | N1 |
| `backend/src/ia/instrucoes/classificacao-v1.md` (novo) e `backend/src/geracao/classificarAreas.ts` (novo) | Chamada ao Haiku 5.5 em lotes, uma linha `[Pn] Área` por pergunta; área inválida ou ausente vira "Geral" | N2 a N4 |
| `backend/src/fluxo/processarTarefa.ts` | Etapa `classificacao` entre `identificacao` e `contexto`, medida como as outras; contagem de perguntas que caíram em "Geral" por falha | N2, N3 |
| `backend/src/config/config.ts` | `modeloDeClassificacao` (`TENDRA_MODELO_CLASSIFICACAO`, padrão `claude-haiku-5-5`) | N2 |
| `backend/src/revisao/revisao.ts`, `backend/src/http/rotasDeRevisao.ts` | `aprovarItem` confere a área (403); rota nova `PUT /api/tarefas/:id/itens/:numero/area` (403 sem permissão, 409 se aprovado), com evento `area` | N6, N7, N10, N13 |
| `backend/src/avaliacao/` | Critério novo: concordância da classificação com o gabarito rotulado | N14 |
| `src/api.js`, `src/workspace/useWorkspace.js`, `viewModel.js` | Área do item e da pessoa; ordem "Minha área primeiro"; filtro `minha-area`; `canApprove` e o motivo por item | N8, N9 |
| `src/workspace/screens/Review.jsx`, `TaskDetail.jsx`, `UserMenu.jsx` | Etiqueta da área, botão de aprovar com motivo, troca de área, coluna "Área", áreas no menu do usuário | N1, N6, N8 a N11 |
| `backend/test/`, `e2e/` | Testes dos cenários, no PGlite e no Postgres, e jornada no navegador | N1 a N13 |

## Etapas

### N1. Banco e regra de área
- Migração 011, `regras/areas.ts` com testes de unidade, perfil e sessão com áreas, `cadastrar-perfil --areas` (recusado no Revisor).
- **Verificação:** testes da migração com dados de antes da fase (N12) e de cadastro (N1).

### N2. Aprovação restrita no backend
- `aprovarItem` usa `podeAprovar`. A rota de troca de área registra o evento `area`.
- **Verificação:** testes de rota para a própria área, outra área, C-Level, "Geral", item aprovado e outra organização (N5 a N7, N10, N13).

### N3. Classificação no processamento
- Instrução `classificacao-v1`, `classificarAreas.ts` e a etapa em `processarTarefa`. A API simulada ganha respostas de classificação.
- Rotina de reclassificação das tarefas em aberto ao iniciar o servidor.
- **Verificação:** testes com a API simulada, incluindo a resposta fora do formato, a área inválida, a falha da IA e a pergunta com instrução embutida (N2 a N4); reclassificação de uma tarefa em aberto, sem tocar na concluída nem na já marcada, e nova tentativa depois de uma falha (N15).

### N4. Avaliação da classificação
- Rotulação de três RFPs sintéticas (pendente do grupo) e o critério novo no `avaliar`.
- **Verificação:** relatório com concordância ≥ 85% numa execução real com o Haiku 5.5 (N14). Esse é o portão da fase: sem ele, a classificação não vai para o ambiente compartilhado.

### N5. Revisão e detalhes da tarefa
- Etiqueta, ordem "Minha área primeiro", item inicial, filtro "Minha área", botão com motivo, troca de área e coluna "Área".
- **Verificação:** jornada de ponta a ponta com dois perfis (Jurídico e C-Level) e conferência no navegador, no computador e no celular (N6, N8 a N11).

### N6. Publicação
- Merge pela conta dona do time na Vercel. Deploy no Render, migração 011 e reclassificação conferidas no Supabase.
- Áreas do publicado ajustadas no banco depois do deploy (PN8): `userteste3@gmail.com` com Segurança e privacidade e Tecnologia; `antonio@vereda.com.br` com Jurídico; demais Aprovadores em C-Level. Antes, o grupo confirma o ponto em aberto do spec sobre as organizações ficarem sem C-Level.
- **Verificação:** o grupo confere no ambiente publicado, com evidências no banco: eventos `aprovacao` e `area`, e itens por área.

## Situação (04/11/2026): implementada e conferida no ambiente publicado, exceto a avaliação da classificação (N4)

- **N1 a N3 e N5:** implementadas.
  - Backend: 374 testes no PGlite e no Postgres. Os novos cobrem:
    - áreas no cadastro e na sessão;
    - classificação com falha da IA e com área fora da lista;
    - aprovação na própria área, em outra área, por C-Level e em "Geral";
    - troca de área (permissões, item aprovado, área inválida, histórico);
    - migração 011 com dados de antes da fase;
    - reclassificação das tarefas em aberto, com nova tentativa depois de falha.
  - Front: testes de unidade das regras de área e um teste de ponta a ponta com o Aprovador do Jurídico (ordem, "Minha área", motivo, troca de área). Suíte de ponta a ponta completa verde.
  - No navegador, com um backend de teste e a RFP-02 classificada pela API simulada, conferi:
    - Jurídico, Segurança e Tecnologia, C-Level e Revisor;
    - computador e celular, sem rolagem lateral.
- **N4 (avaliação da classificação):** pendente. Falta a rotulação das três RFPs do gabarito, que o grupo fará depois (spec, perguntas em aberto). Até lá, a classificação roda com a API real sem a medida de concordância.
- **N6 (publicação):** feita e conferida.
  - **Deploy:** merge do PR #86 às 13:33 UTC. Deploy no Render às 13:34 e na Vercel no mesmo minuto, com o merge pela conta dona do time, sem bloqueio.
  - **Migração 011 conferida no Supabase:**
    - Revisores sem área e Aprovadores em C-Level;
    - 135 itens em "Geral";
    - RFP-04 (todos os itens aprovados) já marcada como classificada.
  - **Primeira reclassificação (13:34):** falhou nas duas tarefas em aberto com `chave_recusada`. A chave da Anthropic do Render (e a local) estava inválida, com 401 "invalid x-api-key" em qualquer modelo. A rotina deixou as tarefas sem a marca, como previsto (N15).
  - **Chave nova e reclassificação (15:25 UTC):** com a chave nova no Render, o reinício reclassificou as duas tarefas da Pulse Benefícios, sem nenhuma pergunta em "Geral" por falha:
    - RFP-01, 46 itens: Produto 15, Tecnologia 10, Segurança e privacidade 8, Comercial 6, Jurídico 7;
    - RFP-02, 84 itens: Segurança e privacidade 51, Tecnologia 21, Jurídico 9, Comercial 2, Produto 1.
    - Custo de cerca de 5,7 mil tokens de entrada e 4,4 mil de saída, em uma chamada ao Haiku 5.5 por tarefa.
  - **As demais organizações** (Vereda Documental) não têm tarefas, então não havia o que reclassificar.
  - **Áreas ajustadas no banco depois do deploy (PN8):** `userteste3@gmail.com` com Segurança e privacidade e Tecnologia; `antonio@vereda.com.br` com Jurídico. Os Revisores seguem sem área.
  - **Teste manual do grupo (04/11/2026):** concluído com os perfis do publicado. Eventos gravados entre 15:54 e 16:14 UTC, todos do User Teste 3 (Aprovador, Segurança e privacidade e Tecnologia):
    - trocas de área: item 33 da RFP-02 de Tecnologia para Produto; item 20 da RFP-01 de Tecnologia para Segurança e privacidade e de volta;
    - aprovações dos itens 2 e 5 da RFP-02, ambos de Segurança e privacidade;
    - edição, restauração e revisão do item 3.
  - **Primeira tarefa nova classificada no processamento (05/11/2026, N2):** a RFP-04 da Pulse Benefícios, enviada às 17:22 UTC, ficou pronta em 15 s com as 5 perguntas classificadas (Produto 2, Tecnologia 2, Comercial 1) e a marca `areas_classificadas_em` no fim do processamento.
  - **Ponto em aberto mantido:** nenhuma das organizações publicadas tem C-Level. Na Pulse, as perguntas de Produto, Comercial e Jurídico (40 nas duas tarefas) não têm quem as aprove nem quem troque a área.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| N1, N12 | Cadastrar um Aprovador com áreas e ver o menu do usuário; tentar áreas num Revisor; conferir os Aprovadores atuais como C-Level |
| N15 | Depois do deploy, conferir no banco as áreas dos itens das tarefas em aberto e a marca `areas_classificadas_em` |
| N2 a N4 | Enviar uma RFP sintética e ver a área de cada pergunta e a etapa nas métricas; repetir com a IA simulada falhando |
| N5 a N7 | Com um Aprovador do Jurídico, aprovar um item jurídico, tentar um de Tecnologia (botão desabilitado e 403 pela API) e aprovar um "Geral"; com C-Level, aprovar qualquer um |
| N8, N9, N11 | Abrir a Revisão com o perfil do Jurídico e ver as jurídicas primeiro; usar "Minha área" na Revisão e nos detalhes |
| N10 | Trocar a área de um item e ver o evento no histórico; tentar com quem não pode aprovar e num item aprovado |
| N13 | Repetir uma troca de área com a tarefa de outra organização (404) |
| N14 | Rodar o `avaliar` com o gabarito rotulado e conferir a concordância |
