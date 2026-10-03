# Aplicar correções de design

_Started 2026-09-30 18:08 UTC_

---

## User

Continuing from "Desenvolvimento front Tendra.ai".

## Assistant

Trabalhamos no front do Tendra.ai seguindo o PRD, montando um protótipo navegável com as nove telas (T1–T9) em `Tendra.ai App.dc.html`.

**Decisões tomadas:**

- Sistema de papéis (Revisor e Aprovador) com permissões diferenciadas no rodapé da barra lateral. Apenas o Aprovador aprova e exporta; botões desabilitados mostram motivo.
- Revisão (T6) e fonte (T7) com layout de lista à esquerda e detalhe à direita. Alertas empilhados com ícone e rótulo; conflitos exigem escolher fonte ou escrever manual.
- Fonte acessível via gaveta lateral ao clicar no marcador; Esc fecha. Editar item aprovado pede confirmação e devolve para "Em revisão".
- Atalhos J e K para navegação entre itens.
- Exportação (T8) bloqueada até 100% aprovado, com lista de pendentes e links. Botão "Demo: 100% aprovado" na sidebar simula estado liberado.
- Upload simulado com três estados: pronto, formato não aceito, tratamento pelo suporte.

**Problemas corrigidos:**

Tabelas (T2, T3, T5, T8, T9) agora têm largura mínima 980 px com scroll horizontal. Barra lateral fixada em 200 px, sem scroll horizontal. Lista de revisão (T6) encolhe entre 260–320 px em telas estreitas.

**Atual:**

Prototipo funcional com navegação entre telas, gestão de estado, alertas e simulação de papéis. Sem erros de console ou layout reportados. Dados fictícios incluem 12 itens na tarefa principal.

**Pendente:**

Versão em duas etapas da T6 para telas abaixo de 1280 px (exigido no PRD). Funcionalidades P1 e P2 (busca avançada, auditoria detalhada, "Reaprovar") foram deixadas de fora do escopo.

**Arquivos:** Tendra.ai App.dc.html, support.js

## User

Aplique as correções identificadas pela crítica de design anexa.

## Assistant

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Apliquei as correções da crítica em `Tendra.ai App.dc.html`. Ainda não conferi o resultado na tela. O verificador está rodando em segundo plano e só me avisa se achar problemas.

- **Sidebar:** os contadores voltam a caber dentro dela. Tirei o fundo cinza abaixo dos itens e removi "Nova RFP/RFI" da navegação. A altura dos itens continua 44 px, porque esse é o tamanho mínimo do sistema de design.
- **Demo:** Revisor, Aprovador e "Aprovar todos os itens" ficam num painel tracejado com o rótulo "Painel de demo".
- **Falha (Cordel):** a linha mostra a causa ("Arquivo ilegível ou protegido por senha") e o botão "Tentar de novo". O alerta do topo agora diz que a Cordel falhou e está atrasada, com os nomes das tarefas clicáveis.
- **Status:** "Em revisão" saiu do preto sólido. Só "Falha" mantém a cor de alerta, então é o que mais chama atenção.
- **Tabela de tarefas (T3):** removi a coluna "Tipo", que agora aparece junto da empresa. A coluna "Itens" mostra só números. Adicionei `lang="pt-BR"` e papéis de tabela para leitor de tela.
- **Vocabulário:** a legenda da barra no detalhe usa os mesmos estados e números das abas (sem rascunho, sugerida, em revisão, revisada, aprovada).
- **Mobile (abaixo de 900 px):** a sidebar vira menu lateral aberto por um botão. As linhas da T3 viram cards e o espaçamento das telas diminui.

**Não feito:**
- O tom verde-limão do badge "Aprovada" ficou como está. Ele vem do sistema de design.
- O layout responsivo só cobre a T3, a navegação e o espaçamento das telas. A T6 ainda precisa da versão em duas etapas.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Corrigi a causa dos contadores cortados na sidebar. O item de menu "Base de conhecimento" estava alargando a coluna da lista, e as colunas agora têm largura fixa. Os itens também ficaram mais baixos, com cerca de 40 px. Não conferi o resultado na tela, e o verificador está rodando de novo em segundo plano.

## User

Mude a cor da barra lateral de menus para o tom "papel"do system design. Deixe os itens da lista mais ligeiramente finos e próximos para que nao seja necessário utilizar uma "barra de rolagem".
Aumente o necessário na barra lateral de menus para que os botões de "revisor" e "aprovador" caibam lado a lado.

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Alterei a barra lateral de menus em `Tendra.ai App.dc.html`. Ainda não conferi na tela, e o verificador está rodando em segundo plano.

- **Cor:** a barra usa o tom papel do sistema de design (`#F5F6F1`).
- **Itens:** ficaram mais baixos (34 px) e mais próximos. Reduzi também o espaço do logo e do rodapé para que a lista caiba sem barra de rolagem.
- **Largura:** subi de 232 para 272 px. Com isso, "Revisor" e "Aprovador" devem caber lado a lado, e eles não quebram mais de linha.

## User

Mude a cor de fundom da barra e menus para o branco do design system (utilizado nos cards)

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

O fundo da barra lateral e dos menus agora é o branco dos cards do sistema de design (`--n-000`). Não conferi o resultado na tela; a página abre sem erros.

## User

Na tela de tarefas, no bloco de alertas - coloque os alertas em lista um abaixo do outro e adicione botões de ação de acordo com cada alerta, que direcionem para a página onde a ação é necessária (ex: "Revisar itens" ou "Conferir processamento")

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tela de tarefas, os alertas agora aparecem em lista, um abaixo do outro, cada um com seu botão de ação. Não conferi o resultado na tela, e o verificador está rodando em segundo plano.

- **Cordel Seguros:** o texto diz que falhou no processamento e está atrasada. O botão "Conferir processamento" abre o detalhe da tarefa. Depois de "Tentar de novo", o texto muda para "voltou para a fila".
- **Banco Meridian:** o texto diz que vence em 4 dias e quantos itens faltam aprovar. O botão "Revisar itens" abre a tela de revisão.

O alerta do Banco Meridian some quando a tarefa é exportada. Sem nenhum alerta, o bloco inteiro some.

## User

Na tela de revisão da lista de itens em uma RFP/tarefa, ao clicar em um item com alertas -  coloque os alertas como cartões sobrepostos, com uma seta para direita ou esquerda para ver o próximo alerta ou alerta anterior.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tela de revisão, os alertas de um item agora aparecem como cartões sobrepostos. Não conferi o resultado na tela, e o verificador está rodando em segundo plano.

- **Cartão:** só o alerta atual fica à vista. Até duas bordas de cartões aparecem atrás dele.
- **Setas:** quando o item tem mais de um alerta, o cabeçalho do cartão mostra as setas esquerda e direita e o contador "Alerta 1 de 3". A navegação é circular.
- **Ações:** "Reconhecer alerta" e "Nenhuma, vou escrever" continuam dentro do cartão, cada uma no alerta correspondente.
- **Item novo:** ao trocar de item, o cartão volta ao primeiro alerta.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Corrigi o cabeçalho do cartão de alerta na revisão. Não conferi o resultado na tela, e o verificador está rodando de novo em segundo plano.

- **Cartão de alerta:** o rótulo não quebra mais em três linhas. Em painel estreito, as setas e o "Alerta N de M" passam para a linha de baixo, sem ficar cortados.
- **Navegação entre itens:** a linha do cabeçalho do item também quebra sozinha. A dica "J próximo · K anterior" e os botões "Item anterior" e "Próximo item" não se empurram mais para fora da tela.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Os itens do menu lateral agora têm 36 px de altura (antes 44 px), o que deve eliminar a barra de rolagem da barra lateral. Não conferi o resultado na tela, e o verificador está rodando de novo em segundo plano.

## User

Inclua esta página de site como a página inicial deste Front. Ao clicar no botão "Produto - Workspace", o usuário deve ser direcionado para a página inicial do Tendra.ai "Tarefas".

## User

Inclua esta página de site como a página inicial deste Front. Ao clicar no botão "Produto - Workspace", o usuário deve ser direcionado para a página inicial do Tendra.ai "Tarefas".

## User

Found issues — fixing…

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

Corrigi a página em branco do site: o componente era montado antes de o arquivo do site terminar de carregar. Agora ele só monta depois que o arquivo carrega. Ainda não confirmei na tela que o botão "Produto · Workspace" aparece e abre as Tarefas; o verificador está checando isso em segundo plano.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Troquei a forma de carregar o site em `Tendra.ai Site.dc.html` para a que espera o arquivo registrar o componente, que deve resolver a página em branco. Ainda não conferi na tela. O verificador está checando em segundo plano se o botão "Produto · Workspace" aparece e abre as Tarefas.

## User

Found issues — fixing…

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

Mudei a forma de carregar o site em `Tendra.ai Site.dc.html` para esperar o arquivo do site terminar de carregar antes de montá-lo. Ainda não conferi na tela. O verificador está checando em segundo plano se a página aparece e se o botão "Produto · Workspace" abre as Tarefas.

Como o site agora é montado por código, o editor não deixa clicar nele para editar. Dá para editar o conteúdo nos arquivos do site.

## User

Found issues — fixing…

## User

Found issues — fixing…

## User

Mantenha a barra superior presente na visualização do site em todas as páginas deste design para que seja possivel navegar/escolher entre as visões. 
Adicione um botão "Home" que volta para o site ao lado de "Produto - Workspace".

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Adicionei os botões "Home" e "Produto · Workspace" nas duas visões, em `Tendra.ai App.dc.html` e no site. Não conferi na tela, e o verificador está rodando em segundo plano.

- **Workspace:** ganhou uma barra fixa no topo, sempre visível, com "Home" (volta ao site) e "Produto · Workspace" (destacado, leva às Tarefas). Descontei a altura da barra nas telas, inclusive na revisão.
- **Site:** o cabeçalho já era fixo. Coloquei "Home" ao lado de "Produto · Workspace"; ele volta à home do site.

## User

Retire o botão "home" da pagina do site.
Transforme o item "Preços" no mesmo design como um botão, em substituição ao botão "Falar com vendas".

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

No cabeçalho do site, tirei o botão "Home". "Preços" virou botão, no lugar de "Falar com vendas", e abre a página de preços. O cabeçalho ficou com "Produto · Workspace" e "Preços". Não conferi na tela, e o verificador está rodando em segundo plano.

## User

Suba o logo do Tendra.ai do menu lateral dentro da visão de "Produto - Workspace" em substituição a palavra "Home" - ao clicar no logo/icone deve ser direcionado para a p' site.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na visão Workspace, o logo do Tendra.ai saiu do menu lateral e foi para a barra superior, no lugar do botão "Home". Clicar nele leva ao site. Não conferi na tela, e o verificador está rodando em segundo plano.

## User

Retive o sublinhado de hiperlink do logo

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Removi o sublinhado do logo na barra superior do Workspace, inclusive ao passar o mouse. Não conferi na tela; a página abre sem erros.

As advertências do sistema de design que apareceram são todas de `site-bundle.jsx`, o arquivo do site que você enviou, e não mexi nelas.

## User

Mantenha o botão de "Produto - Workspace"na mesma posição e todas as telas - à direita assim como esta na pagina principal do site,

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

O botão "Produto · Workspace" agora fica à direita na barra superior do Workspace, em todas as telas, como no site. Não conferi na tela; a página abre sem erros. Como a barra do Workspace ocupa a largura toda, a posição pode diferir alguns pixels da do site.

## User

Dentro da área do produto, deixe o botão "Produto - Workspace" no padrão da cor limão do system design para destacar que o usuário esta dentro desta área.

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

O botão "Produto · Workspace" agora usa a variante limão do sistema de design dentro da área do produto. Não conferi na tela; a página abre sem erros.

## User

Afaste um pouco os itens do menu lateral da extremidade superior, para que o usuario possa identificar e ler melhor a palavra "Trabalho".

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Aumentei o espaço entre o topo do menu lateral e o rótulo "Trabalho" de 4 px para 20 px. Não conferi na tela; a página abre sem erros.

## User

No painel de demo, no canto esquerdo inferior, ajuste os botões "revisor"e "aprovador" para ficarem harmonicos e com o mesmo tamanho

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

No painel de demo, os botões "Revisor" e "Aprovador" agora têm a mesma largura, em duas colunas iguais. "Aprovar todos os itens" também ocupa a largura inteira do painel. Não conferi na tela; a página abre sem erros.

## User

Os carregamento do site e da area do produto-workspace parecem separados. Ao navegar de um para outro a página parece necessitar de recarregamento. Veja o que pode estar causando este comportamento e unifique parta que a navegação fique suave entre todas as paginas do projeto.

## Assistant

_[tool: run_script]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

**Causa:** site e Workspace eram dois arquivos separados, e cada troca recarregava a página inteira.

**Correção:** criei `Tendra.ai.dc.html`, que reúne as duas visões numa única página e alterna entre elas sem recarregar. Esse agora é o arquivo de entrada. O site e o Workspace continuam montados em segundo plano, então a tela em que você estava é mantida ao voltar. Os botões "Produto · Workspace" e o logo usam essa troca.

Ainda não conferi na tela. O verificador está checando em segundo plano se as duas visões aparecem e se a troca funciona.

Os arquivos `Tendra.ai Site.dc.html` e `Tendra.ai App.dc.html` ainda abrem sozinhos. Se abrir um deles direto, a troca volta a recarregar a página.

## User

Ao publicar o artefato, ao acessar-lo a p

## Assistant

A mensagem chegou cortada em "Ao publicar o artefato, ao acessá-lo a p…". O que você queria dizer? Por exemplo: qual página deve abrir primeiro ao acessar o artefato publicado?

## User

O artefato após publicado fica completamente em branco e não carrega os elementos para navegar

## Assistant

_[tool: dc_write]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: super_inline_html]_

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

Testei a versão empacotada e ela carrega sem erros. Não testei a troca para o Workspace nessa versão. Pode levar uns segundos para abrir.

**Causa:** o site dependia de scripts externos (tradutor de código da internet e arquivo separado). Ao publicar, eles não carregavam e a página ficava em branco.

**Correção:** em `Tendra.ai.dc.html`, o site agora usa só arquivos do próprio projeto. Adicionei uma miniatura de carregamento, exigida pelo empacotador. Gerei o arquivo único `Tendra.ai (standalone).html`.

Publique a partir de `Tendra.ai.dc.html`.

## User

Inclua mais um item de exemplo na tela de tarefas, com uma RFP 100% completa, com todas as perguntas aprovadas e pronta para ser exportada.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Adicionei a quarta tarefa na tela de tarefas: "Questionário LGPD — Helios Logística". Ainda não conferi na tela, e o verificador está rodando em segundo plano.

- **Linha:** RFP com 24 itens, 100% aprovados, status "Pronta para exportar" (verde) e prazo em 11 dias.
- **Detalhe:** abre um cartão "24 de 24 itens aprovados" com o botão "Ir para exportação".
- **Exportação:** a tela já vem liberada. Só o Aprovador exporta, e o status vira "Exportada" depois.
- **Contagens:** o título passou a "4 RFPs e RFIs em andamento", e o contador do menu Tarefas também subiu para 4.

Publique de novo para levar a mudança ao artefato publicado.

## User

o botão "pronta para exportar"ficou com a visualização cortada. Mude o texto para algo que caiba na visualização e ainda passe a ideia de estar "pronta".

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

O status da quarta tarefa agora diz só "Pronta", que cabe na coluna. O selo verde com o ícone de check duplo continua o mesmo. Não conferi na tela; a página abre sem erros. Publique de novo para levar a mudança ao artefato publicado.

## User

A tela/menu de "Exportacão"deve trazer os cards das tarefas/RFPs principais em revisão (avisando que estao bloqueadas para exportar) e das prontas para exportar (com o botão desbloqueado e acionável). Mantenha o mesmo modelo do card atual de exemplo do Banco Meridiam, mas traga o nome do cliente e da tarefa para dentro do card.
Exclua esta visão de "itens pendentes". Ao invés disso, a tarefa que tiver bloqueada para exportar deve ter um botão adicional "Ir para revisão".

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Refiz a tela de Exportação em `Tendra.ai App.dc.html`. Ainda não conferi na tela, e o verificador está rodando em segundo plano.

- **Cards:** uma lista com Banco Meridian (em revisão) e Helios Logística (pronta). Cada card traz cliente e tarefa no topo, selo de status, contagem, barra de progresso e o texto do arquivo.
- **Bloqueada:** o selo é "Bloqueada" e o botão de exportar fica desabilitado, com o motivo e quantos itens faltam aprovar. Ganhou o botão "Ir para revisão", que abre o primeiro item pendente.
- **Pronta:** o botão fica liberado para o Aprovador. Depois de exportar, o selo vira "Exportada" e o botão passa a "Baixar novamente".
- **Itens pendentes:** essa lista saiu.

Publique de novo para levar a mudança ao artefato publicado.

## User

A tela de historico deve trazer registros de aprovações e revisões. E um filtro para escolher qual tipo deseja ser visualizado ou ambos.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

O Histórico agora mostra aprovações e revisões, com abas para filtrar. Ainda não conferi na tela, e o verificador está rodando em segundo plano.

- **Filtro:** abas "Todos", "Aprovações" e "Revisões", cada uma com a contagem. O título passou a mostrar o total de registros da aba escolhida.
- **Registros:** cada linha tem um selo "Aprovada" ou "Revisada", a pessoa e a data. O item abre com o texto completo e as fontes, como antes.
- **Revisões:** marcar um item como revisado na tela de revisão cria um registro novo no histórico. Incluí também alguns registros de exemplo de revisões antigas.

Publique de novo para levar a mudança ao artefato publicado.

## User

Na tela de tarefas, remova o texto "Arquivo ilegível ou protegido por senha", do exemplo com falha de carregamento. Coloque esta informação dentro do card de detalhe na página que aparece ao clicar no item.
Remova também o botão "Tentar de novo"e deixe no lugar a barra de completude em 0% com "0 de 0".

## User

Na tela de tarefas, remova o texto "Arquivo ilegível ou protegido por senha", do exemplo com falha de carregamento. Coloque esta informação dentro do card de detalhe na página que aparece ao clicar no item.
Remova também o botão "Tentar de novo"e deixe no lugar a barra de completude em 0% com "0 de 0".

## User

No card de detalhe do processamento com erro, adicione um botão ao lado de "Tentar de novo" com "Importar novo arquivo". Remova o e-mail do suporte.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

No card de falha do detalhe, o e-mail do suporte saiu. Ao lado de "Tentar de novo" ficou o botão "Importar novo arquivo", que abre a tela de Nova RFP/RFI. Não conferi na tela; a página abre sem erros.

## User

Na tela de Tarefas, faca os alertas serem exibidos como cards sobrepostos no mesmo modelo dos que estão presentes na tela de revisão de itens.

## User

Na tela de Tarefas, faca os alertas serem exibidos como cards sobrepostos no mesmo modelo dos que estão presentes na tela de revisão de itens.

## User

Deixe a barra de completude em um sobretom tom do limão quando estiver em 100%

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Toda barra de progresso em 100% agora é limão, em todo o Workspace. Isso vale para a linha da tarefa "Pronta", o detalhe e o card de exportação. Não conferi na tela; a página abre sem erros. Publique de novo para levar a mudança ao artefato publicado.

## User

Mude o texto do botão "Nova RFP/RFI" para "Nova RFP/Questionário". Ajuste o tamanho do botão para caber o texto.

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

O botão da tela de Tarefas agora diz "Nova RFP/Questionário" e não quebra o texto em duas linhas. Mudei também o rótulo da tela de importação para o mesmo nome. Não conferi na tela; a página abre sem erros.

## User

Adicione destaque nos itens que possuem menos de 5 dias para finalizar o prazo. Este destaque pode ser no texto/informação do prazo.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tela de Tarefas, o texto de prazo dos itens com menos de 5 dias agora aparece em vermelho e em negrito. Hoje isso vale para "faltam 4 dias" (Banco Meridian) e "atrasada" (Cordel Seguros). Não conferi na tela; a página abre sem erros. Publique de novo para levar a mudança ao artefato publicado.

## User

Fix this design so it publishes cleanly: `Tendra.ai App.dc.html`

What looks wrong: Ao ir para a visualização da pagina do site não carrega. informa "file not found"

## Assistant

_[tool: run_script]_

_[tool: delete_file]_

_[tool: ready_for_verification]_

Corrigi o "file not found" em `Tendra.ai App.dc.html`. Ainda não conferi na tela. O verificador está rodando em segundo plano.

**Causa:** o botão "Home" e o logo abriam outro arquivo (`Tendra.ai.dc.html`), que não existe no artefato publicado.

**Correção:** o site agora está dentro de `Tendra.ai App.dc.html`. O arquivo abre na home do site. "Produto · Workspace" leva às Tarefas e o logo volta ao site, sem sair da página. Também adicionei a miniatura de carregamento que o publicador exige.

Apaguei os arquivos que não servem mais: `Tendra.ai.dc.html`, `Tendra.ai (standalone).html` e `Tendra.ai Site.dc.html`.

Clique em **Publicar como artefato** de novo no menu Compartilhar para reconferir.

## User

Ajuste o design do botão "Tentar novamente" na tela da base de conhecimento.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tela da base de conhecimento, o botão "Tentar novamente" deixou de ser um botão discreto. Agora tem contorno, o ícone de atualizar e o texto em uma linha só, igual ao dos outros botões de repetir. Não conferi na tela; a página abre sem erros.

Como a mensagem não dizia o que ajustar, mudei só o estilo. Se quiser outra coisa, como posição, tamanho ou cor, me diga.

## User

Ajuste o tamanho do botão para caber no espaço sem transpassar a coluna ao lado.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tabela da base de conhecimento, a coluna Status ficou mais larga, com no mínimo 280 px. O selo "Erro" e o botão "Tentar novamente" cabem nela, e o botão passa para a linha de baixo se faltar espaço. A tabela ganhou largura mínima de 1100 px, com rolagem horizontal em telas menores. Não conferi na tela; a página abre sem erros.

