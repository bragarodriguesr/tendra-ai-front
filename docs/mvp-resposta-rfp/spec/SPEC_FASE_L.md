---
feature: busca-perguntas-revisao
status: approved
constitution: 1.0.0
---

# Busca de perguntas por palavras na revisão e nos detalhes da tarefa

## Contexto

- **Fluxo/local afetado:** as duas telas que listam as perguntas de uma tarefa:
  - **Revisão**, no painel "Itens" (à esquerda no computador; tela de lista no celular), em `src/workspace/screens/Review.jsx`. Hoje o painel mostra, de cima para baixo: o título "Itens" com a contagem "X de Y", o nome da tarefa, o filtro por estado e a lista de perguntas (código, texto da pergunta e estado).
  - **Detalhes da tarefa** (Tarefas → tarefa), em `src/workspace/screens/TaskDetail.jsx`. Hoje a tela mostra o cabeçalho da tarefa, o cartão de progresso, a linha do filtro por estado ("Todos" e "Filtrar") e a tabela de perguntas (código, texto, estado e alertas). Clicar numa pergunta abre a Revisão nesse item.
- **Estado compartilhado:** as duas telas já usam o mesmo filtro por estado (escolher um filtro numa vale na outra). A busca segue o mesmo comportamento (decisão de 01/11/2026).
- **Comportamento atual:** a única forma de reduzir a lista é o filtro por estado (Todos, Sugerida, Aprovada etc.). Numa RFP com dezenas ou centenas de perguntas, achar uma pergunta específica exige rolar a lista e ler item por item. O texto da pergunta aparece cortado na lista a partir de 68 caracteres.
- **Comportamento esperado:** uma barra de busca, nas duas telas, reduz a lista às perguntas que contêm as palavras digitadas, no texto da pergunta ou no código do item. A busca funciona junto com o filtro por estado e é a mesma nas duas telas. Nenhum outro elemento das telas muda.
- **Padrão do design system:** campo de texto do DS (`Input`) com o ícone `search`, como no exemplo do próprio componente (`src/ds/components/forms/Input.prompt.md`). Foco com borda e halo sálvia; sem cores, fontes ou componentes novos. A mensagem de nenhum resultado usa o componente `EmptyState` do DS, o mesmo já usado na tela.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 01/11/2026, no código do front.

- **Nenhuma.** A busca acontece no navegador, sobre os itens da tarefa que a tela já carrega (`GET /api/tarefas/:id/itens`). Não há mudança no backend, no banco, no armazenamento nem em serviços externos, e nenhuma requisição nova é feita ao digitar.

## Acceptance Criteria

### Revisão

### Cenário B1: barra de busca no painel de itens
- **Given** a tela de revisão de uma tarefa aberta
- **When** o painel "Itens" é exibido
- **Then** há uma barra de busca entre o nome da tarefa e o filtro por estado, com o ícone de busca e o texto de exemplo "Buscar por palavras ou código"
- **And** o campo tem o rótulo acessível "Buscar perguntas"
- **And** a barra usa o componente de campo de texto do design system, sem estilo próprio de cor, fonte ou borda

### Cenário B2: busca por uma palavra
- **Given** uma tarefa com perguntas como "A empresa possui política de backup?" e "Descreva a criptografia em repouso"
- **When** a pessoa digita "backup"
- **Then** a lista mostra só as perguntas que contêm "backup" no texto ou no código
- **And** a comparação não diferencia maiúsculas, minúsculas nem acentos ("criptografia" encontra "Criptografia"; "politica" encontra "política")
- **And** trechos de palavra também valem ("cripto" encontra "criptografia")

### Cenário B3: busca pelo texto completo da pergunta
- **Given** uma pergunta com mais de 68 caracteres, que aparece cortada na lista
- **When** a pessoa busca uma palavra que está só na parte cortada
- **Then** a pergunta aparece no resultado

### Cenário B4: busca pelo código do item
- **Given** uma tarefa cujos itens exibem código na lista
- **When** a pessoa digita o código de um item, ou parte dele
- **Then** a lista mostra o item com esse código

### Cenário B5: várias palavras
- **Given** perguntas que contêm "backup", "criptografia" ou as duas palavras
- **When** a pessoa digita "backup criptografia" (ou "criptografia backup")
- **Then** a lista mostra só as perguntas que contêm as duas palavras, em qualquer ordem e posição
- **And** espaços repetidos entre as palavras são ignorados

### Cenário B6: busca junto com o filtro por estado
- **Given** um filtro por estado selecionado (por exemplo, "Sugerida")
- **When** a pessoa digita uma palavra na busca
- **Then** a lista mostra só os itens que passam no filtro e na busca ao mesmo tempo
- **And** a contagem "X de Y" no topo do painel mostra quantos itens aparecem na lista e o total da tarefa
- **And** os números exibidos nas opções do filtro por estado não mudam com a busca
- **And** trocar o filtro mantém o texto da busca e aplica os dois de novo

### Cenário B7: nenhuma pergunta encontrada
- **Given** um texto de busca que nenhum item (dentro do filtro atual) contém
- **When** a lista é atualizada
- **Then** no lugar da lista aparece o estado vazio do design system, com o título "Nenhuma pergunta encontrada." e o texto "Confira as palavras ou limpe a busca."
- **And** a contagem mostra "0 de Y"

### Cenário B8: limpar a busca
- **Given** uma busca com texto
- **When** a pessoa apaga todo o texto, ou pressiona Esc com o foco no campo
- **Then** o campo fica vazio e a lista volta a mostrar todos os itens do filtro atual
- **And** um texto só com espaços é tratado como busca vazia

### Cenário B9: item aberto durante a busca
- **Given** um item aberto no painel de resposta
- **When** a pessoa digita uma busca que não inclui esse item
- **Then** o item continua aberto no painel de resposta, sem mudança
- **And** escolher um item da lista filtrada o abre, como hoje
- **And** a navegação para o item anterior e o próximo continua funcionando como hoje, sem considerar a busca

### Cenário B10: troca de tarefa
- **Given** uma busca com texto na revisão ou nos detalhes de uma tarefa
- **When** a pessoa abre outra tarefa, na revisão ou nos detalhes
- **Then** a busca começa vazia, nas duas telas

### Cenário B11: celular
- **Given** a tela de revisão no celular, com a lista de itens visível
- **When** a pessoa usa a busca
- **Then** a barra aparece na mesma posição do painel de lista e se comporta como nos cenários B2 a B10
- **And** a barra ocupa a largura do painel sem causar rolagem lateral

### Cenário B12: sem requisição ao servidor
- **Given** a tela de revisão aberta
- **When** a pessoa digita, altera ou limpa a busca
- **Then** nenhuma requisição é feita ao backend
- **And** o mesmo vale para a tela de detalhes da tarefa

### Detalhes da tarefa

### Cenário B13: barra de busca na linha do filtro
- **Given** a tela de detalhes de uma tarefa com itens
- **When** a tela é exibida
- **Then** a barra de busca aparece na mesma linha do filtro por estado: a barra à esquerda e "Todos" e "Filtrar" à direita (decisão de 01/11/2026), com o mesmo ícone, texto de exemplo ("Buscar por palavras ou código") e rótulo acessível ("Buscar perguntas") da Revisão
- **And** a barra usa o componente de campo de texto do design system, sem estilo próprio de cor, fonte ou borda
- **And** quando a tela é estreita demais para os dois na mesma linha, a barra ocupa a largura da lista e o filtro passa para a linha de baixo

### Cenário B14: tabela filtrada pela busca
- **Given** a tela de detalhes de uma tarefa
- **When** a pessoa digita na busca
- **Then** a tabela mostra só as perguntas que atendem às mesmas regras dos cenários B2 a B5, junto com o filtro por estado (B6)
- **And** os números exibidos no filtro por estado e no cartão de progresso não mudam com a busca
- **And** apagar o texto ou pressionar Esc limpa a busca, como no cenário B8

### Cenário B15: nenhuma pergunta encontrada nos detalhes
- **Given** um texto de busca que nenhum item (dentro do filtro atual) contém
- **When** a tabela é atualizada
- **Then** no lugar das linhas da tabela aparece o mesmo estado vazio do cenário B7 ("Nenhuma pergunta encontrada." e "Confira as palavras ou limpe a busca.")

### Cenário B16: mesma busca nas duas telas
- **Given** uma busca com texto nos detalhes da tarefa
- **When** a pessoa clica numa pergunta da tabela
- **Then** a Revisão abre nesse item, com a mesma busca no campo e a lista de itens filtrada por ela
- **And** a busca feita na Revisão aparece aplicada ao voltar para os detalhes da mesma tarefa
- **And** abrir a Revisão pelo botão "Abrir revisão" também mantém a busca

### Cenário B17: detalhes da tarefa no celular
- **Given** a tela de detalhes no celular
- **When** a pessoa usa a busca
- **Then** a barra ocupa a largura da lista, acima do filtro, e se comporta como nos cenários B14 a B16, sem causar rolagem lateral

## Fora de escopo

- Qualquer outra alteração na tela de revisão: título, contagem (além do efeito do cenário B6), nome da tarefa, filtro por estado e seus números, aparência das linhas da lista, painel de resposta, fontes, alertas, ações e navegação anterior/próximo.
- Qualquer outra alteração na tela de detalhes da tarefa: cabeçalho, botões, cartão de progresso, filtro por estado e seus números e aparência das linhas da tabela.
- Destacar as palavras encontradas no texto das perguntas.
- Buscar no texto das respostas, nas fontes ou nos alertas.
- Busca por frase exata, operadores ("OU", "-palavra") ou correção de erros de digitação.
- Guardar a busca ao recarregar a página ou entre sessões.
- Busca em outras telas (lista de tarefas, base de conhecimento, histórico, exportação).
- Qualquer mudança no backend, na API ou no banco.
- Novos componentes, cores, fontes ou ícones fora do design system.
