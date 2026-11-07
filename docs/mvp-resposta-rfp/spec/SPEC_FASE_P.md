---
feature: cabecalho-detalhes-tarefa
status: approved
constitution: 1.0.0
---

# Cabeçalho com ordenação na tabela dos detalhes da tarefa

## Contexto

- **Fluxo/local afetado:** tela de detalhes da tarefa (Tarefas → tarefa), em `src/workspace/screens/TaskDetail.jsx`, na tabela de perguntas abaixo da busca e do filtro.
- **Comportamento atual:**
  - Desde a revisão de design de 05/11/2026, a tabela tem um cabeçalho fixo, só visual e sem ordenação: "Código", "Pergunta", "Área", "Estado" e "Alertas". Ele some quando a busca não encontra nada.
  - Cada linha tem cinco colunas: código ("REQ-001/012"), pergunta, área, estado e, numa coluna própria, os alertas pendentes ("2 alertas").
  - A ordem é a da planilha (número do requisito). Para o Aprovador com área, as perguntas da área dele vêm primeiro, cada bloco na ordem da planilha ("Minha área primeiro", fase N, cenário N8).
  - Não há como mudar a ordem.
- **Comportamento esperado:**
  - O cabeçalho passa a ter os títulos **Código**, **Pergunta**, **Área** e **Status**, no padrão das tabelas da Base de conhecimento e de Tarefas.
  - Clicar num título ordena a tabela por aquela coluna.
  - Os alertas deixam de ter coluna própria e passam a aparecer junto do estado, na coluna Status.
- **Padrão do design system:** o cabeçalho segue o das tabelas da Base de conhecimento e de Tarefas (`Base.jsx` e `Tasks.jsx`): fundo `--n-050`, borda inferior `--n-200`, texto em mono 11 px, maiúsculas e espaçamento entre letras. A cor do texto é `--n-500`, a mesma de Tarefas e do Histórico depois da revisão de design de 05/11/2026 (ajuste de 07/11/2026, ao trazer a `main`). O indicador de direção usa um ícone do DS. Não entram cores, fontes nem componentes novos.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 04/11/2026, no código do front.

- **Nenhuma.** A ordenação acontece no navegador, sobre os itens que a tela já carrega. Não muda nada no backend, no banco, no armazenamento nem em serviços externos, e nenhuma requisição nova é feita ao ordenar.

## Acceptance Criteria

### Cenário P1: cabeçalho da tabela
- **Given** os detalhes de uma tarefa com itens, no computador
- **When** a tabela de perguntas é exibida
- **Then** acima das linhas há um cabeçalho com os títulos "Código", "Pergunta", "Área" e "Status", alinhados às colunas
- **And** o cabeçalho segue o padrão visual do cabeçalho da tabela da Base de conhecimento
- **And** a coluna Código mostra o código de cada item no formato atual (por exemplo, "REQ-001/005")

### Cenário P2: alertas na coluna Status
- **Given** uma pergunta com alertas pendentes
- **When** a linha é exibida
- **Then** o aviso de alertas ("1 alerta", "2 alertas"), com o ícone de alerta e a cor atuais, aparece na coluna Status, junto da etiqueta do estado
- **And** não há mais uma coluna própria para os alertas
- **And** pergunta sem alerta pendente mostra só a etiqueta do estado

### Cenário P3: ordem padrão
- **Given** os detalhes de uma tarefa, sem nenhuma ordenação escolhida
- **When** a tabela é exibida
- **Then** as perguntas aparecem pelo número do requisito, do menor para o maior
- **And** para o Aprovador com área (fase N, cenário N8), as perguntas da área dele vêm primeiro, e cada bloco segue o número do requisito
- **And** nenhum título do cabeçalho aparece como ordenado

### Cenário P4: ordenar por uma coluna
- **Given** a tabela na ordem padrão
- **When** a pessoa clica num título do cabeçalho
- **Then** a tabela é ordenada por aquela coluna, em ordem crescente, e o título mostra o indicador de ordem crescente
- **When** a pessoa clica de novo no mesmo título
- **Then** a ordem passa a ser decrescente, e o indicador muda
- **When** a pessoa clica uma terceira vez
- **Then** a tabela volta para a ordem padrão (P3), e nenhum título aparece como ordenado
- **And** clicar em outro título ordena por ele, em ordem crescente

### Cenário P5: critério de cada coluna
- **Given** a tabela ordenada por uma coluna
- **When** as linhas são comparadas
- **Then** cada coluna usa este critério:

  | Coluna | Ordem crescente |
  |---|---|
  | Código | Pelo número do requisito (1, 2, …, 10), não pelo texto |
  | Pergunta | Alfabética pelo texto completo da pergunta, sem diferenciar maiúsculas, minúsculas nem acentos |
  | Área | Alfabética pelo nome da área, sem diferenciar maiúsculas, minúsculas nem acentos |
  | Status | Alfabética, a mesma ordem do filtro e da barra (fase M, M13): aprovada, em revisão, revisada, sem rascunho, sugerida |

- **And** perguntas empatadas na coluna escolhida seguem o número do requisito
- **And** os alertas não entram no critério da coluna Status

### Cenário P6: ordenação junto com a busca e o filtro
- **Given** uma ordenação escolhida
- **When** a pessoa digita na busca ou escolhe um filtro (pelo menu, pela barra ou pela legenda)
- **Then** a tabela mostra só as perguntas da busca e do filtro, na ordenação escolhida
- **And** trocar a busca ou o filtro mantém a ordenação

### Cenário P7: ordenação só nesta tela
- **Given** uma ordenação escolhida nos detalhes da tarefa
- **When** a pessoa abre a Revisão (pelo botão "Abrir revisão", pelo menu lateral ou clicando numa pergunta)
- **Then** a lista da Revisão e a navegação anterior/próximo continuam na ordem de hoje (P3), sem a ordenação dos detalhes
- **And** clicar numa pergunta abre a Revisão nesse item, como hoje
- **And** ao voltar para os detalhes da mesma tarefa, a ordenação escolhida continua aplicada
- **And** ao abrir outra tarefa, a tabela volta para a ordem padrão

### Cenário P8: teclado e leitores de tela
- **Given** os detalhes de uma tarefa com itens, no computador
- **When** a pessoa navega com Tab até um título do cabeçalho e pressiona Enter ou Espaço
- **Then** o resultado é o mesmo do clique (P4)
- **And** o título ordenado informa aos leitores de tela a direção da ordem (crescente ou decrescente), e os demais informam que não estão ordenados
- **And** o cursor indica que os títulos são clicáveis

### Cenário P9: celular
- **Given** os detalhes da tarefa no celular, em que as perguntas aparecem como cartões
- **When** a lista é exibida
- **Then** não há cabeçalho nem ordenação por coluna, e os cartões seguem a ordem padrão (P3)
- **And** os cartões continuam como hoje, inclusive o aviso de alertas
- **And** a tela não tem rolagem lateral

### Cenário P10: nenhuma pergunta encontrada
- **Given** uma busca ou um filtro sem nenhuma pergunta
- **When** a tabela é atualizada
- **Then** o estado vazio da fase L ("Nenhuma pergunta encontrada.") aparece abaixo do cabeçalho, e a ordenação escolhida é mantida para quando a busca mudar

### Cenário P11: sem requisição ao servidor
- **Given** os detalhes de uma tarefa com itens
- **When** a pessoa ordena por qualquer coluna, inverte ou volta para a ordem padrão
- **Then** nenhuma requisição é feita ao backend

## Fora de escopo

- A ordem da lista da Revisão, a navegação anterior/próximo e o "Minha área primeiro" da Revisão (fase N, N8).
- O cartão de progresso, a busca, o filtro e seus números.
- Os cartões do celular, além de seguirem a ordem padrão.
- A tabela e a ordenação da Base de conhecimento.
- Ordenar por mais de uma coluna ao mesmo tempo ou pelos alertas.
- Guardar a ordenação ao recarregar a página ou entre sessões.
- Novas cores, fontes, ícones ou componentes fora do design system.
- Qualquer mudança no backend, na API ou no banco.
