---
feature: filtro-pelo-progresso
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_M.md (status approved)
constitution: 1.0.0
---

# Plano: filtro pela barra e pela legenda de estados nos detalhes da tarefa

*Plano de 02/11/2026, derivado do spec aprovado. Só front; nenhum arquivo do backend é alterado.*

## Objetivo

Implementar os cenários M1 a M12 do spec numa mudança pequena:
- a barra de estados e a legenda do cartão de progresso dos detalhes da tarefa passam a acionar o filtro por estado que já existe (`state.filter` e `ws.setFilter`);
- os outros estados esmaecem enquanto um estado está filtrado;
- o número do cartão passa a seguir o filtro.

A barra do Dashboard, que usa o mesmo componente, não muda.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `src/workspace/filtroPeloProgresso.js` (novo) | Funções puras: alternância do filtro (`filtroAoClicar`) e número do cartão (`numeroDoCartao`) | M3, M4, M7 |
| `src/workspace/viewModel.js` | Cada item de `segs` ganha o valor do filtro correspondente (`sem-rascunho`, `sugerida`, `em-revisao`, `revisada`, `aprovada`) e o texto do número do cartão ("itens sem rascunho" etc.). Um objeto novo, `destaqueDoCartao`, com o número e o texto do estado filtrado, ou dos aprovados quando o filtro não é um estado | M1, M7 |
| `src/workspace/ui.jsx` | `SegmentBar` aceita duas propriedades opcionais: `selected` (valor filtrado) e `onSelect`. Sem `onSelect`, o componente fica exatamente como hoje (Dashboard) | M1, M3 a M5, M10, fora de escopo |
| `src/workspace/screens/TaskDetail.jsx` | Liga a barra e a legenda ao filtro; a legenda vira uma lista de botões; o número do cartão usa `destaqueDoCartao` | M1 a M11 |
| `test/filtroPeloProgresso.test.js` (novo) | Testes unitários das funções puras: alternância do filtro e número do cartão | M3, M4, M7 |
| `e2e/filtroPeloProgresso.spec.js` (novo) | Jornada no navegador com os itens de exemplo e a API desligada | M1 a M12 |

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Estado do filtro | O mesmo `state.filter` do menu "Filtrar" e da Revisão; nada de estado novo | M6: um filtro só nas duas telas e no menu |
| Alternância | Uma função pura, `filtroAoClicar(atual, clicado)`, devolve `"todos"` quando `clicado === atual`, senão `clicado`. A tela chama `ws.setFilter(filtroAoClicar(state.filter, g.value))` | M3, M4 |
| Número do cartão | Uma função pura monta `{ n, texto }`. Com o filtro num dos cinco estados, `n` é a contagem do estado, sobre todos os itens (`counts`, não as linhas da busca). Com "Todos" ou "Alerta pendente", `n` são os aprovados e o texto é "itens aprovados" | M7 e fora de escopo (alerta) |
| Segmento clicável | O `span` focável que já existe ganha `role="button"`, `aria-pressed`, `onClick` e Enter/Espaço (mesmo padrão de `ClickRow`), além de `cursor: pointer`. O `aria-label` atual ("sem rascunho: 1 de 12 itens") é mantido. A dica (`Tooltip`) continua envolvendo o segmento | M1, M10 |
| Legenda clicável | Cada item vira um `button` sem estilo próprio de cor (fundo transparente, sem borda, fonte herdada), com `aria-pressed` e o mesmo conteúdo de hoje (bolinha, número e nome) | M2, M10 |
| Estado com 0 itens | O item da legenda é renderizado como hoje (`div`, sem `button`), então não recebe clique nem foco. A barra já não mostra o segmento | M9 |
| Esmaecer | `opacity: 0.42` nos segmentos e itens da legenda que não são o estado filtrado, o mesmo valor que o DS usa em `Button` e `IconButton` desativados, com `transition: opacity var(--duration-fast) var(--ease-out)`. Nenhuma cor nova. Só quando o filtro é um dos cinco estados | M5 |
| Dashboard | Chama `SegmentBar` sem `onSelect`: sem `role="button"`, sem cursor, sem esmaecer | Fora de escopo |
| Celular | Sem mudança de layout; a legenda já quebra linha (`flexWrap`) | M11 |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### Etapa 1: funções puras e testes unitários
- `filtroAoClicar` e a função do número do cartão, exportadas de um módulo do `workspace` (por exemplo, `src/workspace/filtroPeloProgresso.js`), no padrão de `buscaDePerguntas.js`.
- `test/filtroPeloProgresso.test.js`.
- **Verificação:** `npm test` passa, com testes nomeados pelos cenários M3, M4 e M7, incluindo "Todos" e "Alerta pendente" mostrando os aprovados.

### Etapa 2: `viewModel`
- `value` e o texto do número em cada item de `segs`; `destaqueDoCartao` exportado.
- **Verificação:** com o filtro em "Todos", o cartão continua igual ao de hoje ("2 de 12", "itens aprovados").

### Etapa 3: `SegmentBar` com seleção opcional
- Propriedades `selected` e `onSelect`; sem `onSelect`, nenhuma diferença.
- **Verificação:** o Dashboard continua igual (sem cursor de clique na barra, sem esmaecer); coberto pelo teste de ponta a ponta.

### Etapa 4: cartão dos detalhes da tarefa
- Barra com `selected={state.filter}` e `onSelect`; legenda com botões e esmaecimento; número e texto do cartão a partir de `destaqueDoCartao`.
- **Verificação:** no navegador, clicar no roxo mostra só "Sem rascunho", o botão do filtro mostra "Sem rascunho 1", o cartão mostra "1 de 12 itens sem rascunho" e os outros estados ficam esmaecidos; clicar de novo volta para "Todos".

### Etapa 5: testes de ponta a ponta
- `e2e/filtroPeloProgresso.spec.js`, no padrão de `e2e/buscaNaRevisao.spec.js`: API desligada por `page.route`, entrada no Workspace e detalhes do "Questionário de segurança" com os itens de exemplo.
- Um teste por cenário (M1 a M12), com o número no nome:
  - M6 abre a Revisão e confere o filtro;
  - M9 usa um estado com 0 itens;
  - M10 usa só o teclado;
  - M11 usa o viewport de celular e confere a ausência de rolagem lateral;
  - M12 conta as requisições a `/api/` (devem ser zero);
  - um teste do Dashboard confere que a barra dele continua sem `role="button"`.
- **Verificação:** `npm run e2e` passa, inclusive os testes que já existiam.

### Etapa 6: conferência visual e pull request
- Capturas do cartão em "Todos", com um estado filtrado e no celular.
- Pull request com o spec, o plano e o código.
- **Verificação:** checklist abaixo conferido e integração contínua verde (exceto o Vercel, bloqueado pela permissão do autor).

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| M1 | Clicar em cada segmento e ver a tabela e o botão do filtro com o estado correspondente |
| M2 | Clicar na bolinha, no número e no nome de um item da legenda |
| M3 | Clicar duas vezes no mesmo segmento e ver "Todos" |
| M4 | Com um estado filtrado, clicar em outro |
| M5 | Ver os outros estados esmaecidos; escolher "Todos" e ver nada esmaecido; escolher um estado pelo menu "Filtrar" e ver o mesmo destaque |
| M6 | Filtrar pela barra, abrir a Revisão e ver o mesmo filtro; buscar e filtrar juntos |
| M7 | Ver "2 de 12 itens aprovados" em "Todos", "1 de 12 itens sem rascunho" no roxo e o número igual com uma busca ativa |
| M8 | Contagens da legenda, largura dos segmentos e números do menu iguais antes e depois do filtro |
| M9 | Item da legenda com 0 itens sem clique e fora da ordem do Tab |
| M10 | Tab até um segmento e um item da legenda, Enter e Espaço; leitor de tela anuncia estado, contagem e se está filtrado |
| M11 | Repetir M1, M3 e M7 no celular, sem rolagem lateral |
| M12 | Na aba de rede do navegador, nenhuma chamada a `/api/` ao clicar |

## Definição de pronto

Segue a definição de pronto do `plan/PLAN.md` (7 itens): cenários com testes automáticos e integração contínua verde; verificação de cada etapa feita; estados de erro tratados (aqui, só o estado sem itens); nenhuma regra de negócio no front além da filtragem de exibição; spec e plano atualizados; nenhuma alteração fora do escopo do spec.

## Riscos

| Risco | Mitigação |
|---|---|
| Mudar sem querer a barra do Dashboard | As propriedades novas são opcionais e o Dashboard não as passa; teste de ponta a ponta do Dashboard |
| Clique no segmento conflitar com a dica (`Tooltip`) | A dica continua no envoltório e o clique vai para o segmento; conferido no M10 com mouse e teclado |
| Esmaecido ficar fraco demais para quem enxerga pouco | O estado filtrado também aparece no botão do filtro e é anunciado com `aria-pressed`; a cor não é o único sinal |
| Testes que já leem "itens aprovados" no cartão quebrarem | Em "Todos" o texto não muda; a suíte completa roda na etapa 5 |
