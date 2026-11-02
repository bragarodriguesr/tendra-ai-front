---
feature: busca-perguntas-revisao
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_L.md (status approved)
constitution: 1.0.0
---

# Plano: busca de perguntas por palavras na revisão e nos detalhes da tarefa

*Plano de 01/11/2026, derivado do spec aprovado, e atualizado no mesmo dia com a tela de detalhes da tarefa (cenários B13 a B17). Só front; nenhum arquivo do backend é alterado.*

## Objetivo

Implementar os cenários B1 a B17 do spec numa mudança pequena: uma função pura de correspondência, o estado da busca no `useWorkspace` (o mesmo nas duas telas, como o filtro por estado), a filtragem das linhas no `viewModel` e o campo no painel "Itens" da `Review.jsx` e na linha do filtro da `TaskDetail.jsx`, sem tocar em nenhum outro elemento das telas.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `src/workspace/buscaDePerguntas.js` (novo) | Funções puras: normalizar texto (sem acento, minúsculas), separar os termos e dizer se um item corresponde à busca | B2 a B5, B8 |
| `src/workspace/useWorkspace.js` | Estado `busca` (texto) e ação `setBusca`; a busca volta a vazio ao trocar de tarefa | B8, B10 |
| `src/workspace/viewModel.js` | Uma lista nova, `rowsDaBusca`, com as linhas que passam pelo filtro por estado **e** pela busca, usada pelas duas telas. `rows` não muda. O item aberto, a navegação e os números do filtro e do cartão de progresso continuam só com o filtro por estado | B6, B7, B9, B14 |
| `src/workspace/screens/Review.jsx` | No `ItemList`, o campo de busca entre o nome da tarefa e o `FilterMenu`; estado vazio do DS quando a busca não encontra nada | B1, B7, B8, B11 |
| `src/workspace/screens/TaskDetail.jsx` | O `FilterMenu` e o campo de busca na mesma linha; a tabela passa a usar `rowsDaBusca`; estado vazio do DS no lugar das linhas | B13 a B15, B17 |
| `test/buscaDePerguntas.test.js` (novo) | Testes unitários da função pura, com o executor de testes do próprio Node (`node --test`), sem dependência nova | B2 a B5, B8 |
| `e2e/buscaNaRevisao.spec.js` (novo) | Jornada no navegador com os itens de exemplo e a API desligada | B1 a B17 |
| `package.json` | Script `test` (`node --test "test/**/*.test.js"`) | — |

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde a busca acontece | No navegador, sobre `state.items` já carregados | O spec exige nenhuma requisição ao digitar (B12) |
| Correspondência | Texto completo da pergunta (`i.q`, não o cortado da lista) e código do item, normalizados com `normalize("NFD")`, sem marcas diacríticas e em minúsculas; cada termo precisa aparecer como trecho, e todos os termos precisam aparecer | B2 a B5 |
| Termos | Busca separada por espaços; espaços repetidos e nas pontas são ignorados; busca só com espaços equivale a vazia | B5, B8 |
| Efeito na tela | Só `rowsDaBusca` usa a busca. `rows`, `ws.visible`, o item atual (`it`), `step` (anterior/próximo) e `filterTabs` continuam como hoje | B6, B9 e a restrição de não mudar mais nada |
| Contagem | "X de Y" passa a usar `v.rowsDaBusca.length` | B6, B7 |
| Troca de tarefa | `swapTo` passa a devolver também `busca: ""`, como já faz com `filter: "todos"`; o mesmo nos dois pontos que esvaziam os itens ao carregar tarefas do servidor | B10 |
| Campo | `Input` do DS com `icon="search"`, `placeholder="Buscar por palavras ou código"`, `aria-label="Buscar perguntas"`, `value` controlado e `onKeyDown` para Esc; o `Input` já repassa as demais propriedades ao elemento (`...rest`) | B1, B8 |
| Sem resultado | `EmptyState` do DS, com `icon="search"`, no lugar da lista, só quando há texto na busca e nenhuma linha | B7 |
| Celular | O campo ocupa a largura do painel, como o `FilterMenu` | B11 |
| Linha do filtro nos detalhes | Um contêiner flexível com quebra de linha: o campo à esquerda, com largura de 320 px (pode encolher até 220 px), e o `FilterMenu` à direita (`margin-left: auto`). No celular (o mesmo limite `isMobile` da tela), o campo ocupa a largura da lista e o filtro fica abaixo | B13, B17 |
| Mesma busca nas duas telas | O estado `busca` é um só no `useWorkspace`, como `filter`. Abrir a Revisão pela tabela ou por "Abrir revisão" não troca de tarefa, então não limpa a busca; só `swapTo` (outra tarefa) limpa | B10, B16 |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### Etapa 1: função de correspondência e testes unitários
- Criar `buscaDePerguntas.js` com `termosDaBusca(texto)` e `correspondeABusca({ pergunta, codigo }, termos)`.
- Criar `test/buscaDePerguntas.test.js` e o script `npm test`.
- **Verificação:** `npm test` passa, com testes nomeados pelos cenários: acentos e maiúsculas, trecho de palavra, várias palavras em qualquer ordem, código do item, espaços repetidos e busca vazia.

### Etapa 2: estado da busca
- Acrescentar `busca: ""` ao estado inicial, a ação `setBusca` e o reinício da busca na troca de tarefa.
- **Verificação:** coberta pelos testes de ponta a ponta da etapa 5 (B10).

### Etapa 3: linhas filtradas no `viewModel`
- Aplicar a busca só ao montar `rows`; expor `busca` e um indicador de busca sem resultado.
- **Verificação:** com a busca vazia, a lista, a contagem, o item aberto e a navegação ficam idênticos aos de hoje.

### Etapa 4: campo e estado vazio na tela
- Inserir o `Input` no `ItemList`, entre o nome da tarefa e o `FilterMenu`, e o `EmptyState` quando não houver resultado.
- **Verificação:** no navegador, a barra aparece na posição do spec, com o foco sálvia do DS, no computador e no celular.

### Etapa 4b: campo e estado vazio nos detalhes da tarefa
- Pôr o `FilterMenu` e o `Input` na mesma linha, a tabela sobre `rowsDaBusca` e o `EmptyState` no lugar das linhas quando não houver resultado.
- **Verificação:** no navegador, a barra aparece à esquerda do filtro no computador e acima dele no celular; buscar nos detalhes e abrir um item mostra a mesma busca na Revisão.

### Etapa 5: testes de ponta a ponta
- `e2e/buscaNaRevisao.spec.js`, no padrão de `e2e/baseNaRevisao.spec.js`: API desligada por `page.route`, entrada no Workspace e tela de Revisão com os itens de exemplo.
- Um teste por cenário (B1 a B17), com o número no nome. No B12, contar as requisições a `/api/` feitas enquanto se digita: devem ser zero. No B11, viewport de celular, conferindo a ausência de rolagem lateral.
- **Verificação:** `npm run e2e` passa, inclusive os testes que já existiam.

### Etapa 6: conferência visual e pull request
- Capturas da barra vazia, de uma busca com resultado, de uma busca sem resultado e no celular.
- Pull request com o spec, o plano e o código.
- **Verificação:** checklist abaixo conferido e integração contínua verde.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| B1 | A barra aparece entre o nome da tarefa e o filtro, com o ícone de busca e o texto "Buscar por palavras ou código" |
| B2 | Buscar "backup", "BACKUP" e "cripto" nos itens de exemplo |
| B3 | Buscar uma palavra que só aparece depois do corte de 68 caracteres de uma pergunta longa |
| B4 | Buscar o código de um item |
| B5 | Buscar duas palavras em ordens diferentes e com espaços repetidos |
| B6 | Escolher um filtro, buscar, conferir a contagem "X de Y" e que os números do filtro não mudam; trocar o filtro e ver a busca mantida |
| B7 | Buscar um texto inexistente e ver "Nenhuma pergunta encontrada." com "0 de Y" |
| B8 | Apagar o texto e usar Esc; digitar só espaços |
| B9 | Com um item aberto, buscar algo que não o inclui; usar anterior e próximo |
| B10 | Buscar, abrir outra tarefa e ver a busca vazia |
| B11 | Repetir B2 e B7 no celular |
| B12 | Na aba de rede do navegador, nenhuma chamada a `/api/` ao digitar, nas duas telas |
| B13 | Nos detalhes da tarefa, a barra aparece à esquerda e "Todos" e "Filtrar" à direita, na mesma linha |
| B14 | Buscar nos detalhes: a tabela reduz, e "Todos 12" e o cartão "2 de 12" não mudam; Esc limpa |
| B15 | Buscar um texto inexistente nos detalhes e ver "Nenhuma pergunta encontrada." |
| B16 | Buscar nos detalhes, clicar numa pergunta e ver a mesma busca na Revisão; buscar na Revisão e voltar aos detalhes da mesma tarefa |
| B17 | Repetir B14 e B15 no celular, com a barra acima do filtro |

## Definição de pronto

Segue a definição de pronto do `PLAN.md` (7 itens): cenários com testes automáticos e integração contínua verde; verificação de cada etapa feita; estados de erro tratados (aqui, só a busca sem resultado); nenhuma regra de negócio no front além da filtragem de exibição; spec e plano atualizados; nenhuma alteração fora do escopo do spec.

## Riscos

| Risco | Mitigação |
|---|---|
| Mudar sem querer o item aberto ou a navegação ao filtrar | A busca entra só em `rowsDaBusca`; o teste do B9 confere que o item aberto e a navegação continuam iguais |
| Busca "esquecida" ao passar dos detalhes para a Revisão confundir a pessoa | É o comportamento pedido (B16) e o mesmo do filtro por estado; o campo mostra o texto da busca nas duas telas |
| O `Input` do DS não repassar `aria-label` ou `onKeyDown` | Ele repassa as demais propriedades ao elemento (`...rest`); os testes do B1 e do B8 conferem |
| Lista longa ficar lenta ao digitar | A filtragem é linear sobre os itens já carregados (centenas, no máximo); se necessário, normalizar os textos uma vez por tarefa |
