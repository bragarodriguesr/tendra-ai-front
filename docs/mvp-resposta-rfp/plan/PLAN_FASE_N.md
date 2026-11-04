---
feature: tratamento-de-area
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_N.md (status draft)
constitution: 1.0.0
---

# Plano: tratamento de área

*Plano de 04/11/2026, em rascunho. Ele segue as propostas de PN1 a PN9 do spec e muda se alguma decisão mudar. Nada é implementado antes da validação.*

## Objetivo

Implementar os cenários N1 a N14:
- áreas na pessoa e na pergunta;
- classificação das perguntas pela IA no processamento;
- aprovação restrita pela área, no backend e na tela;
- Revisão com "Minha área primeiro".

A geração das respostas não muda.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `backend/migracoes/011_areas.sql` (novo) | `perfis.areas text[] NOT NULL DEFAULT '{}'`; `itens.area text NOT NULL DEFAULT 'Geral'`; `eventos.acao` aceita `area`; Aprovadores atuais com `{C-Level}` | N1, N10, N12 |
| `backend/src/regras/areas.ts` (novo) | Lista de áreas (PN1), `C-Level`, validação e a regra `podeAprovar(areasDaPessoa, papel, areaDoItem)` | N5 a N7 |
| `backend/src/autenticacao/perfis.ts`, `sessoes.ts` | Perfil e sessão com `areas`; `cadastrar-perfil --areas` | N1 |
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
- Migração 011, `regras/areas.ts` com testes de unidade, perfil e sessão com áreas, `cadastrar-perfil --areas`.
- **Verificação:** testes da migração com dados de antes da fase (N12) e de cadastro (N1).

### N2. Aprovação restrita no backend
- `aprovarItem` usa `podeAprovar`. A rota de troca de área registra o evento `area`.
- **Verificação:** testes de rota para a própria área, outra área, C-Level, "Geral", item aprovado e outra organização (N5 a N7, N10, N13).

### N3. Classificação no processamento
- Instrução `classificacao-v1`, `classificarAreas.ts` e a etapa em `processarTarefa`. A API simulada ganha respostas de classificação.
- **Verificação:** testes com a API simulada, incluindo a resposta fora do formato, a área inválida, a falha da IA e a pergunta com instrução embutida (N2 a N4).

### N4. Avaliação da classificação
- Rotulação de três RFPs sintéticas (pendente do grupo) e o critério novo no `avaliar`.
- **Verificação:** relatório com concordância ≥ 85% numa execução real com o Haiku 5.5 (N14). Esse é o portão da fase: sem ele, a classificação não vai para o ambiente compartilhado.

### N5. Revisão e detalhes da tarefa
- Etiqueta, ordem "Minha área primeiro", item inicial, filtro "Minha área", botão com motivo, troca de área e coluna "Área".
- **Verificação:** jornada de ponta a ponta com dois perfis (Jurídico e C-Level) e conferência no navegador, no computador e no celular (N6, N8 a N11).

### N6. Publicação
- Merge pela conta dona do time na Vercel. Deploy no Render, migração 011 conferida no Supabase e áreas dos perfis definidas.
- **Verificação:** o grupo confere no ambiente publicado, com evidências no banco: eventos `aprovacao` e `area`, e itens por área.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| N1, N12 | Cadastrar um perfil com áreas e ver o menu do usuário; conferir os Aprovadores atuais como C-Level e os itens antigos como "Geral" |
| N2 a N4 | Enviar uma RFP sintética e ver a área de cada pergunta e a etapa nas métricas; repetir com a IA simulada falhando |
| N5 a N7 | Com um Aprovador do Jurídico, aprovar um item jurídico, tentar um de Tecnologia (botão desabilitado e 403 pela API) e aprovar um "Geral"; com C-Level, aprovar qualquer um |
| N8, N9, N11 | Abrir a Revisão com o perfil do Jurídico e ver as jurídicas primeiro; usar "Minha área" na Revisão e nos detalhes |
| N10 | Trocar a área de um item e ver o evento no histórico; tentar com quem não pode aprovar e num item aprovado |
| N13 | Repetir uma troca de área com a tarefa de outra organização (404) |
| N14 | Rodar o `avaliar` com o gabarito rotulado e conferir a concordância |
