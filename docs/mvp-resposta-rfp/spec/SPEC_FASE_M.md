---
feature: filtro-pelo-progresso
status: approved
constitution: 1.0.0
---

# Filtro pela barra e pela legenda de estados nos detalhes da tarefa

## Contexto

- **Fluxo/local afetado:** tela de detalhes da tarefa (Tarefas → tarefa), em `src/workspace/screens/TaskDetail.jsx`, no cartão de progresso. Hoje o cartão mostra, de cima para baixo:
  - o número de itens aprovados ("2 de 12");
  - a barra de estados: um segmento colorido por estado com pelo menos um item, com dica ao passar o mouse;
  - a legenda: os cinco estados, mesmo os sem itens, cada um com a sua cor e a sua contagem.
- **Cores e estados:** sem rascunho (roxo), sugerida (âmbar), em revisão (petróleo), revisada (terracota) e aprovada (limão).
- **Comportamento atual:** a barra e a legenda só informam. O único jeito de reduzir a tabela por estado é o filtro "Todos" / "Filtrar", abaixo do cartão. Esse filtro é o mesmo da Revisão: escolher um estado numa tela vale na outra.
- **Comportamento esperado:**
  - Clicar num segmento da barra ou num item da legenda aplica o filtro daquele estado, como se ele tivesse sido escolhido em "Filtrar". Exemplo: clicar no roxo mostra só as perguntas "Sem rascunho".
  - Clicar de novo no estado já filtrado volta para "Todos".
  - Enquanto um estado está filtrado, os segmentos e os itens da legenda dos outros estados aparecem esmaecidos.
  - O número do cartão continua mostrando os itens aprovados como padrão ("2 de 12 itens aprovados"). Com um estado filtrado, ele passa a mostrar os itens desse estado (por exemplo, "1 de 12 itens sem rascunho").
- **Padrão do design system:** cores e componentes que já existem no cartão. Não entram cores, fontes nem componentes novos.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 02/11/2026, no código do front.

- **Nenhuma.** O filtro por estado é aplicado no navegador, sobre os itens que a tela já carrega. Não muda nada no backend, no banco, no armazenamento nem em serviços externos. O clique não faz nenhuma requisição nova.

## Acceptance Criteria

### Cenário M1: clicar num segmento da barra
- **Given** os detalhes de uma tarefa com itens, com o filtro em "Todos"
- **When** a pessoa clica no segmento roxo ("sem rascunho")
- **Then** a tabela mostra só as perguntas com o estado "Sem rascunho"
- **And** o filtro abaixo do cartão mostra o estado escolhido, com a sua contagem, como se ele tivesse sido escolhido em "Filtrar" (por exemplo, "Sem rascunho 1")
- **And** o mesmo vale para os outros segmentos:

  | Segmento | Filtro |
  |---|---|
  | âmbar | Sugerida |
  | petróleo | Em revisão |
  | terracota | Revisada |
  | limão | Aprovada |

### Cenário M2: clicar num item da legenda
- **Given** os detalhes de uma tarefa com itens
- **When** a pessoa clica num item da legenda (a bolinha, o número ou o nome do estado)
- **Then** o resultado é o mesmo do cenário M1 para o estado desse item

### Cenário M3: clicar de novo no estado filtrado
- **Given** um estado filtrado pela barra, pela legenda ou pelo menu "Filtrar"
- **When** a pessoa clica no segmento ou no item da legenda desse mesmo estado
- **Then** o filtro volta para "Todos" e a tabela mostra todas as perguntas (respeitando a busca, se houver)

### Cenário M4: trocar de estado
- **Given** um estado filtrado
- **When** a pessoa clica no segmento ou no item da legenda de outro estado
- **Then** o filtro passa para o novo estado, sem passar por "Todos"

### Cenário M5: estados esmaecidos
- **Given** um estado filtrado, escolhido pela barra, pela legenda ou pelo menu "Filtrar"
- **When** o cartão de progresso é exibido
- **Then** os segmentos da barra e os itens da legenda dos outros estados aparecem esmaecidos, mantendo as cores, e os do estado filtrado aparecem como hoje
- **And** com o filtro em "Todos", nada fica esmaecido

### Cenário M6: o mesmo filtro da tela e da Revisão
- **Given** um estado filtrado pela barra ou pela legenda
- **When** a pessoa abre a Revisão da mesma tarefa, pelo botão "Abrir revisão", pelo menu lateral ou clicando numa pergunta da tabela
- **Then** a lista de itens da Revisão está com o mesmo filtro, e o mesmo vale para um estado escolhido no menu "Filtrar"
- **And** ao clicar numa pergunta da tabela, a Revisão abre nesse item
- **And** escolher "Todos" ou outro estado no menu atualiza o destaque do cartão (M5)
- **And** o texto da busca, se houver, continua aplicado junto com o filtro

### Cenário M7: número do cartão segue o filtro
- **Given** os detalhes de uma tarefa com 12 itens, 2 aprovados e 1 sem rascunho
- **When** o filtro está em "Todos"
- **Then** o cartão mostra "2 de 12" e "itens aprovados", como hoje
- **When** a pessoa filtra "Sem rascunho" pela barra, pela legenda ou pelo menu "Filtrar"
- **Then** o cartão mostra "1 de 12" e "itens sem rascunho"
- **And** os textos dos outros estados são:
  - "itens sugeridos";
  - "itens em revisão";
  - "itens revisados";
  - "itens aprovados".
- **And** ao voltar para "Todos", o cartão volta a mostrar os itens aprovados
- **And** o número não muda com a busca: conta todos os itens da tarefa no estado, não só as linhas exibidas

### Cenário M8: demais números não mudam
- **Given** qualquer estado filtrado
- **When** o filtro é aplicado
- **Then** continuam iguais:
  - as contagens da legenda;
  - a largura dos segmentos da barra;
  - os números do menu "Filtrar".

### Cenário M9: estado sem itens na legenda
- **Given** um estado com 0 itens, que aparece na legenda mas não na barra
- **When** a pessoa clica no item da legenda desse estado
- **Then** nada acontece: o item da legenda desse estado não é clicável e o filtro não muda
- **And** o cursor e o teclado não o tratam como clicável (não recebe foco com Tab)
- **And** se esse estado estiver filtrado pelo menu "Filtrar", o item da legenda continua sem clique e os demais seguem o cenário M5

### Cenário M10: teclado e leitores de tela
- **Given** os detalhes de uma tarefa com itens
- **When** a pessoa navega com Tab até um segmento da barra ou um item da legenda e pressiona Enter ou Espaço
- **Then** o resultado é o mesmo do clique (M1 a M4)
- **And** cada segmento e cada item da legenda informam aos leitores de tela o estado e a contagem (por exemplo, "sem rascunho: 1 de 12 itens") e se estão filtrados no momento
- **And** a dica ao passar o mouse sobre o segmento continua como hoje
- **And** o cursor indica que o segmento e o item da legenda são clicáveis

### Cenário M11: celular
- **Given** os detalhes da tarefa no celular
- **When** a pessoa toca num segmento da barra ou num item da legenda
- **Then** o comportamento é o mesmo dos cenários M1 a M9, sem rolagem lateral

### Cenário M12: sem requisição ao servidor
- **Given** os detalhes de uma tarefa com itens
- **When** a pessoa aplica ou retira o filtro pela barra ou pela legenda
- **Then** nenhuma requisição é feita ao backend

### Cenário M13: ordem alfabética no filtro, na barra e na legenda
- **Given** os detalhes de uma tarefa com itens, ou a Revisão
- **When** a pessoa abre o menu "Filtrar"
- **Then** "Todos" continua como botão fixo, e as opções do menu aparecem em ordem alfabética: Alerta pendente, Aprovada, Em revisão, Revisada, Sem rascunho e Sugerida
- **And** nos detalhes da tarefa, os segmentos da barra (da esquerda para a direita) e os itens da legenda seguem a mesma ordem, sem "Alerta pendente", que não é um estado da tarefa: aprovada, em revisão, revisada, sem rascunho e sugerida
- **And** as cores de cada estado não mudam

## Fora de escopo

- A barra e a legenda do Dashboard (tarefas por estado), que usam o mesmo componente de barra mas continuam só informativas.
- Os outros cartões dos detalhes da tarefa: processando, falha no carregamento e pronta para exportar.
- O menu "Todos" / "Filtrar", seus rótulos e seus números (só a ordem das opções muda, M13); a busca; a tabela de perguntas e a aparência das linhas.
- Qualquer alteração na tela de Revisão além do efeito do filtro compartilhado (M6).
- O filtro "Alerta pendente": alerta não é um estado de revisão e não tem segmento na barra nem item na legenda, então fica fora do comportamento do cartão.
- Filtrar por mais de um estado ao mesmo tempo.
- Rolar a tela até a tabela depois do clique.
- Novas cores, fontes, ícones ou componentes fora do design system.
- Qualquer mudança no backend, na API ou no banco.
