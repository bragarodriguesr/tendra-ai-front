---
feature: cabecalho-detalhes-tarefa
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_P.md (status approved)
constitution: 1.0.0
---

# Plano: cabeçalho com ordenação na tabela dos detalhes da tarefa

*Plano de 04/11/2026, derivado do spec aprovado. Só front; nenhum arquivo do backend é alterado.*

## Objetivo

Implementar os cenários P1 a P11 do spec numa mudança pequena:
- uma função pura de ordenação;
- um estado novo no `useWorkspace`, só dos detalhes da tarefa;
- as linhas ordenadas no `viewModel`;
- o cabeçalho e a coluna Status com os alertas na `TaskDetail.jsx`.

A ordem da Revisão, a navegação anterior/próximo e o "Minha área primeiro" (fase N) não mudam.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `src/workspace/ordenacaoDaTabela.js` (novo) | Funções puras: próxima ordenação a cada clique e comparação das linhas por coluna | P4, P5 |
| `src/workspace/useWorkspace.js` | Estado `ordenacaoDetalhes` (`null` ou `{ coluna, direcao }`) e ação `setOrdenacaoDetalhes`; volta a `null` nos pontos que trocam ou esvaziam os itens (`swapTo`, carga das tarefas do servidor e exclusão da tarefa aberta), os mesmos da busca | P3, P7 |
| `src/workspace/viewModel.js` | Cada linha ganha os dados da ordenação (número do requisito, texto completo da pergunta, área e estado). Lista nova, `linhasDosDetalhes`: `rowsDaBusca` ordenada quando há ordenação, senão `rowsDaBusca` como está. `rows` e `rowsDaBusca` não mudam | P3, P5, P6, P7 |
| `src/workspace/screens/TaskDetail.jsx` | Cabeçalho no computador; tabela sobre `linhasDosDetalhes`; alertas dentro da coluna Status; 4 colunas em vez de 5 | P1, P2, P4, P8 a P10 |
| `test/ordenacaoDaTabela.test.js` (novo) | Testes unitários da função pura | P4, P5 |
| `e2e/ordenacaoDosDetalhes.spec.js` (novo) | Jornada no navegador com os itens de exemplo e a API desligada | P1 a P11 |

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde a ordenação acontece | No navegador, sobre as linhas da busca e do filtro (`rowsDaBusca`) | P11; P6 (busca e filtro continuam valendo) |
| Ciclo do clique | `proximaOrdenacao(atual, coluna)`: outra coluna ou nenhuma → `{ coluna, "asc" }`; a mesma em `asc` → `desc`; a mesma em `desc` → `null` (ordem padrão) | P4 |
| Ordem padrão | Sem ordenação, a lista fica como `ws.visible` já devolve: número do requisito, com "Minha área primeiro" para o Aprovador com área | P3; fase N, N8 |
| Número do requisito | O mesmo número do código (`parseInt(i.id.slice(1))`, a regra de `code` em `data.js`), comparado como número | P5 (10 depois de 9) |
| Pergunta e Área | `localeCompare` em português com `sensitivity: "base"`, que ignora maiúsculas, minúsculas e acentos. Pergunta pelo texto completo (`i.q`), não o cortado da lista. Área pela regra de `areaDoItem` | P5 |
| Status | Comparação pela chave do estado (`aprovada`, `em-revisao`, `revisada`, `sem-rascunho`, `sugerida`), que já está na ordem alfabética do filtro (M13). Alertas não entram | P5 |
| Empate | Desempate pelo número do requisito, sempre crescente | P5 |
| Escopo do estado | `ordenacaoDetalhes` só é lido pela `TaskDetail`. A Revisão usa `rows` e `ws.visible`, que não mudam. Trocar de tarefa limpa, como a busca | P7 |
| Cabeçalho | Mesmo estilo dos cabeçalhos da Base e de Tarefas (`n-050`, borda `n-200`, mono 11 px, maiúsculas, `letterSpacing .1em`, texto `n-500` como em Tarefas), no mesmo grid das linhas. Substitui o cabeçalho fixo da revisão de design de 05/11/2026. Cada título é um `button` sem estilo próprio dentro de um `role="columnheader"` com `aria-sort` (`ascending`, `descending` ou `none`); a linha do cabeçalho tem `role="row"` | P1, P8 |
| Indicador de direção | Ícone `chevron-down` do DS, girado 180° para a ordem crescente; sem ícone quando a coluna não está ordenada. O DS não tem seta para cima, e girar evita ícone novo | P4; fora de escopo (ícones novos) |
| Colunas | `120px minmax(0,1fr) 170px 240px` (Código, Pergunta, Área, Status), com `minWidth` 980 como hoje | P1, P2 |
| Status com alertas | Na mesma célula: a etiqueta do estado e, ao lado, o aviso de alertas com o ícone e a cor atuais; quebra de linha se não couber | P2 |
| Busca sem resultado | O cabeçalho continua visível e o `EmptyState` fica abaixo dele | P10 |
| Celular | Sem cabeçalho; os cartões seguem `rowsDaBusca` (ordem padrão), sem mudança de layout | P9 |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### Etapa 1: funções puras e testes unitários
- `src/workspace/ordenacaoDaTabela.js`: `proximaOrdenacao` e `ordenarLinhas`, no padrão de `buscaDePerguntas.js` e `filtroPeloProgresso.js`.
- `test/ordenacaoDaTabela.test.js`.
- **Verificação:** `npm test` passa, com testes nomeados pelos cenários:
  - ciclo crescente, decrescente e padrão;
  - código como número;
  - pergunta e área sem acento;
  - status na ordem do filtro;
  - empate pelo número.

### Etapa 2: estado
- `ordenacaoDetalhes: null` no estado inicial, `setOrdenacaoDetalhes` e o reinício nos pontos que trocam de tarefa.
- **Verificação:** coberta pelos testes de ponta a ponta do P7.

### Etapa 3: `viewModel`
- Dados da ordenação em cada linha e `linhasDosDetalhes`.
- **Verificação:** sem ordenação, a tabela fica idêntica à de hoje na ordem.

### Etapa 4: cabeçalho e coluna Status
- Cabeçalho no computador, tabela sobre `linhasDosDetalhes`, alertas na coluna Status.
- **Verificação:** no navegador, o cabeçalho aparece no padrão da Base; clicar em "Pergunta" ordena de A a Z, de novo de Z a A, e uma terceira vez volta para a ordem padrão.

### Etapa 5: testes de ponta a ponta
- `e2e/ordenacaoDosDetalhes.spec.js`, no padrão de `e2e/filtroPeloProgresso.spec.js`, com a tarefa "Questionário de segurança — Banco Meridian" e a API desligada.
- Um teste por cenário (P1 a P11):
  - P7 abre a Revisão e confere a ordem da lista;
  - P8 usa só o teclado;
  - P9 usa o viewport de celular;
  - P11 conta as requisições a `/api/` (devem ser zero).
- Testes existentes que contam colunas ou leem o aviso de alertas nos detalhes são ajustados para a coluna Status.
- **Verificação:** `npm run e2e` passa, inclusive os testes que já existiam.

### Etapa 6: conferência visual e pull request
- Capturas da tabela na ordem padrão, ordenada por uma coluna e no celular.
- Pull request com o spec, o plano e o código.
- **Verificação:** checklist abaixo conferido e integração contínua verde (exceto o Vercel, bloqueado pela permissão do autor).

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| P1 | Cabeçalho com "Código", "Pergunta", "Área" e "Status", no visual da Base |
| P2 | REQ-002/012 mostra "1 alerta" ao lado de "Sugerida", na coluna Status; não há quinta coluna |
| P3 | Abrir a tarefa e ver REQ-001 a REQ-012 em ordem |
| P4 | Clicar três vezes em "Pergunta": A a Z, Z a A e ordem padrão; clicar em "Área" depois de "Pergunta" |
| P5 | Ordenar por cada coluna; por Código, REQ-010 depois de REQ-009 |
| P6 | Ordenar, buscar e filtrar; a ordenação continua |
| P7 | Ordenar, abrir a Revisão e ver a lista na ordem de hoje; voltar e ver a ordenação; abrir outra tarefa e ver a ordem padrão |
| P8 | Tab até um título, Enter e Espaço; leitor de tela anuncia a direção |
| P9 | No celular, cartões sem cabeçalho, na ordem padrão, sem rolagem lateral |
| P10 | Buscar um texto inexistente: cabeçalho visível e "Nenhuma pergunta encontrada." abaixo |
| P11 | Na aba de rede do navegador, nenhuma chamada a `/api/` ao ordenar |

## Definição de pronto

Segue a definição de pronto do `plan/PLAN.md` (7 itens): cenários com testes automáticos e integração contínua verde; verificação de cada etapa feita; estados de erro tratados (aqui, só a busca sem resultado); nenhuma regra de negócio no front além da ordenação de exibição; spec e plano atualizados; nenhuma alteração fora do escopo do spec.

## Riscos

| Risco | Mitigação |
|---|---|
| Mudar sem querer a ordem da Revisão ou a navegação | A ordenação entra só em `linhasDosDetalhes`; o teste do P7 confere a lista da Revisão |
| Quebrar o "Minha área primeiro" dos detalhes | Sem ordenação, a lista é a de `ws.visible`, sem reordenar. Os itens de exemplo não têm área, então o teste do P3 usa um Aprovador do Jurídico numa API respondida pelo teste, como `e2e/areas.spec.js` |
| Testes atuais dependerem da coluna de alertas | Rodar a suíte completa na etapa 5 e ajustar só o que ler a posição dos alertas |
| Cabeçalho e linhas desalinharem | Mesmo `gridTemplateColumns` e o mesmo `padding` horizontal nos dois |
