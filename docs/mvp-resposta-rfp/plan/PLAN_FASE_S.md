---
feature: alterar-exibicao-area-na-revisao
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_S.md (status approved em 08/11/2026)
constitution: 1.0.0
---

# Plano: exibição da área e das etiquetas do item na Revisão (fase S)

*Plano de 08/11/2026. A letra S foi a pedida; até esta data não existe fase R.*

## Objetivo

No cabeçalho do item na Revisão:
- a área da pergunta aparece igual para todos (ícone de prédio e nome), sem a lista suspensa sempre visível;
- quem pode trocar a área (PN7) ganha o lápis, que abre a lista de áreas por cima do nome, no padrão do "Painel de Usuários" (fase Q);
- "Editado" passa a usar o ícone `history`, e a resposta manual, `file-text`;
- o lápis fica só como a ação de trocar a área.

**Só front.** Nenhum arquivo do backend muda. A troca continua pela rota `PUT /api/tarefas/:id/itens/:numero/area` (fase N) e, no modo local, no navegador.

## Fora deste plano

- A área na lista de perguntas e na coluna de detalhes.
- As regras PN4 e PN7, a rota e as respostas 403 e 409.
- O texto, o tom e as regras das etiquetas; a exportação.
- Os botões "Editar resposta" e "Nenhuma, vou escrever", que continuam com o lápis.

## Pendências de confirmação

Nenhuma. A fase não depende de Supabase, Render ou banco.

A publicação na Vercel segue a mesma observação da fase Q (PQ5 em `PLAN_FASE_Q.md`): o deploy do front é bloqueado quando o merge é feito por quem não tem acesso ao projeto.

## O que existe hoje no código

| Onde | Hoje | Muda para |
|---|---|---|
| `src/workspace/screens/Review.jsx`, cabeçalho do item | `cur.canChangeArea` mostra um `Select` "Área da pergunta"; senão, `building-2` com o nome | Sempre o nome com `building-2`; com `cur.canChangeArea`, o lápis e a lista (S1 a S6) |
| `Review.jsx`, etiqueta "Editado" | `Badge` neutro com `pencil` | `history` (S7) |
| `Review.jsx`, etiqueta "Resposta manual" e linha "escrita por …" | `pencil` | `file-text` (S8) |
| `src/workspace/data.js`, alerta `manual` | `i: 'pencil'` | `i: 'file-text'` (S8) |
| `src/workspace/viewModel.js` | `area`, `areaOptions` (`AREAS_DOS_ITENS`) e `canChangeArea` no item aberto | Continua. Acrescenta `areaAberta` e `trocandoArea` |
| `src/workspace/useWorkspace.js`, `changeArea` | Chama a rota (ou atualiza no local) e mostra o aviso "Área alterada" | Continua. Passa a fechar a lista, ignorar a área atual e marcar a troca em andamento |
| `e2e/areas.spec.js` | Usa `getByLabel("Área da pergunta")` como lista suspensa (N10) | Abre pelo lápis e escolhe na lista |

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Estado da lista | `areaAberta` (id do item com a lista aberta) e `trocandoArea` (bool) no `useWorkspace`. `areaAberta` volta a `null` ao trocar de item, de tarefa ou de tela | Mesmo padrão de `painelAreasAbertas` da fase Q; a lista não fica aberta num item que não está na tela |
| Ações | `abrirAreaDoItem(id)` alterna a lista; `fecharAreaDoItem()`; `changeArea(id, area)` fecha a lista, ignora a área atual e liga `trocandoArea` até a resposta | S3 e S4 |
| Componente | `AreaDoItem` em `Review.jsx`, como o `Areas` de `Users.jsx`: nome da área e o botão "Alterar área" com o lápis (`Button variant="secondary"`, `size="sm"`, contorno cinza e fundo preto com o mouse por cima, `aria-haspopup="listbox"` e `aria-expanded`; proposta A de 08/11/2026) e a lista com `position: absolute; top: 0` sobre o nome | Mesmo padrão visual do "Painel de Usuários" |
| Lista | `role="listbox"` com nome "Área da pergunta" e uma opção por área (`role="option"`, `aria-selected` na atual, com o ícone `check`). Setas mudam a opção em foco; Enter escolhe; Esc fecha | S5. Uma área por pergunta (PN4), por isso opções e não `Checkbox` como no painel |
| Fechar | `mousedown` fora fecha; Esc fecha; em ambos o foco volta ao lápis | S3, como no painel |
| Durante a troca | Lista com `aria-busy` e opções desabilitadas | S4: sem segunda escolha enquanto grava |
| Celular | Largura da lista limitada a `min(260px, 100vw - 32px)` e alinhada para não passar da borda | S6 |
| Ícones | `history` e `file-text`, que já existem em `icon-paths.js` | Sem ícones novos |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### S0. Spec
- `SPEC_FASE_S.md` aprovado em 08/11/2026.
- **Verificação:** status `approved` no spec.

### S1. Ícones das etiquetas
- `Review.jsx`: "Editado" com `history`; "Resposta manual" e a linha "escrita por …" com `file-text`.
- `data.js`: alerta `manual` com `file-text`.
- **Verificação:** na Revisão do modo local, o item editado e o item do seguro cibernético mostram os ícones novos, e nenhum deles usa o lápis.

### S2. Estado e ações
- `areaAberta`, `trocandoArea`, `abrirAreaDoItem` e `fecharAreaDoItem` no `useWorkspace`; `changeArea` fecha a lista, ignora a área atual e liga e desliga `trocandoArea`.
- `areaAberta` volta a `null` ao trocar de item, de tarefa ou de tela.
- `viewModel`: `areaAberta` e `trocandoArea` no item aberto.
- **Verificação:** `npm test` passa.

### S3. Área no cabeçalho
- `AreaDoItem` em `Review.jsx` no lugar do `Select`, com o lápis só quando `cur.canChangeArea`.
- Lista com clique fora, Esc, setas e Enter, e o foco de volta ao lápis.
- **Verificação:** no navegador, como Aprovador no modo local:
  - a área aparece igual à do Revisor;
  - o lápis abre a lista, a troca mostra "Área alterada";
  - o item aprovado não tem lápis;
  - no celular, a lista cabe na tela.

### S4. Testes de ponta a ponta
- `e2e/areas.spec.js`: N10 passa a abrir a lista pelo lápis "Trocar a área da pergunta" e escolher "Comercial"; N6 confere que não há lápis na pergunta de outra área.
- Novo `e2e/areaNaRevisao.spec.js`, um teste por cenário:
  - S1: a área aparece como texto para o Revisor e para o Aprovador, sem lista suspensa;
  - S2: sem lápis para o Revisor, a outra área, o item aprovado e a tarefa só para leitura;
  - S3 e S5: abrir pelo clique e pelo teclado, fechar com Esc e com clique fora, foco de volta ao lápis;
  - S4: troca com a API simulada, a área atual só fecha a lista, e a recusa 409 mantém a área e mostra o aviso;
  - S6: lista sem rolagem lateral no celular;
  - S7 a S9: ícones das etiquetas e o lápis só na área.
- `e2e/jornada.spec.js` continua passando (textos "Editado" e "Resposta manual" não mudam).
- **Verificação:** `npm run e2e` passa, inclusive os testes que já existiam.

### S5. Publicação e conferência
- Merge e deploy do front na Vercel (ver a observação da PQ5).
- No publicado, com um Aprovador de uma área e um Revisor, conferir o checklist abaixo.
- **Verificação:** checklist conferido no publicado.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| S1 | Revisor e Aprovador veem a área com o ícone de prédio, sem lista suspensa |
| S2 | O lápis aparece só para quem pode trocar a área; não aparece no item aprovado nem na tarefa arquivada |
| S3 | O lápis abre a lista por cima da área, com a atual marcada; Esc e clique fora fecham |
| S4 | Trocar a área mostra "Área alterada" e o evento no Histórico; a recusa mantém a área |
| S5 | Tab até o lápis, Enter abre, setas e Enter escolhem |
| S6 | No celular, a lista cabe na tela |
| S7, S8 | "Editado" com `history`; "Resposta manual" e a linha "escrita por …" com `file-text` |
| S9 | Nenhum lápis no cabeçalho do item, fora o de trocar a área |

## Riscos

| Risco | Mitigação |
|---|---|
| Lista aberta presa num item que saiu da tela | `areaAberta` guarda o id do item e é limpa ao trocar de item, tarefa ou tela |
| Lista cortada pelo painel com rolagem do item | Conferir no navegador (S3); se cortar, abrir a lista para baixo do nome, ainda dentro do cabeçalho |
| Testes antigos presos ao `Select` | `e2e/areas.spec.js` atualizado na etapa S4 |
| Duas trocas seguidas | `trocandoArea` desabilita as opções até a resposta |

## Apêndice: lápis das áreas no Painel de Usuários (SA1)

Pedido de 08/11/2026, depois da validação manual da Revisão.

- `src/workspace/screens/Users.jsx`: o `IconButton` de lápis do componente `Areas` ganha o contorno cinza (`--action-secondary-border`) e, com o mouse por cima, o fundo preto (`--action-primary-bg`) com o ícone claro (`--action-primary-fg`). As novas propriedades ficam em linhas próprias, sem mexer na linha do `onClick`, que o PR da fase Q (#102) altera (`u.email` para `u.id`).
- `src/workspace/useWorkspace.js`: o fechamento da lista de áreas ao trocar de tela (S2) passou para antes do `setState` de `go()`, porque o PR da fase Q acrescenta uma linha logo depois dele.
- Teste em `e2e/areaNaRevisao.spec.js` (modo local, dados de exemplo): contorno sem o mouse, fundo preto com o mouse por cima, volta ao sair e o clique abre a lista. Fica fora de `e2e/painelDeUsuarios.spec.js`, que o PR da fase Q também altera.
- **Conflitos com a fase Q (simulados em 08/11/2026):** `Users.jsx`, `useWorkspace.js`, `viewModel.js` e `Review.jsx` se juntam sem conflito; só o `PLAN.md` conflita, como já previsto no PR #103.
- **Verificação:** no navegador, o lápis com contorno e o fundo preto com o mouse por cima; `e2e/areaNaRevisao.spec.js` e `e2e/painelDeUsuarios.spec.js` passando.
