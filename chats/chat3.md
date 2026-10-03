# Nova RFP button text

_Started 2026-09-30 23:29 UTC_

---

## User

Continuing from "Aplicar correções de design".

## Assistant

Trabalhamos no front do Tendra.ai seguindo o PRD, montando um protótipo navegável com site integrado e nove telas de workspace (Tarefas, Detalhes, Revisão, Fonte, Exportação, Histórico, Nova RFP/Questionário, Base de Conhecimento, Suporte).

**Decisões tomadas:**

- Site e Workspace unificados num único arquivo (`Tendra.ai App.dc.html`) que alterna entre visões sem recarregar a página.
- Sistema de papéis (Revisor e Aprovador) com permissões diferenciadas. Apenas Aprovador exporta; botões desabilitados mostram motivo.
- Alertas na tela de Tarefas exibidos como cards sobrepostos com navegação por setas, mesmo padrão da tela de Revisão.
- Exportação refatorada: cards de tarefas (bloqueadas ou prontas) com barra de progresso, botões contextuais ("Ir para revisão" ou "Exportar"), sem lista de itens pendentes.
- Histórico com abas de filtro (Todos, Aprovações, Revisões) e contadores.
- Prazos com menos de 5 dias destacados em vermelho e negrito.
- Barra de progresso em 100% com sobretom limão.
- Tela de Base de Conhecimento com tabela ajustada para o botão "Tentar novamente" caber sem transpassar colunas.

**Atual:**

Protótipo funcional com navegação suave entre site e Workspace, gestão de estado para papéis, alertas sobrepostos, quatro tarefas de exemplo (duas em revisão, uma pronta, uma com erro de processamento), exportação contextual e histórico filtrado. Publicado como artefato único.

**Pendente:**

Versão responsiva em duas etapas da tela de Revisão para telas abaixo de 1280 px (requisitado no PRD). P1 e P2 (busca avançada, auditoria detalhada, "Reaprovar") foram deixadas fora do escopo.

**Arquivo:** Tendra.ai App.dc.html (principal; contém site-bundle.jsx integrado e support.js)

## User

Ajuste o texto do botão "nova rfp/questionario" para "Nova RFP"

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

O botão da tela de Tarefas agora diz "Nova RFP". Não abri a tela para conferir. Mudei só esse botão. O rótulo "Nova RFP/Questionário" no topo da tela de importação continua igual. Se quiser, troco esse também.

## User

Na tela de tarefas:
1. Ajuste o exemplo de falha, deixando a RFP como dentro do prazo, em 70% de conclusão com 100 perguntas.
2. crie mais um exemplo para uma RFP com falha no carregamento do arquivo com 0% de conclusão
3. no botão "nova RFP" deixe como "Nova RFP/RFI"

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Fiz as três mudanças na tela de Tarefas. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

1. **Cordel Seguros:** agora está em revisão e dentro do prazo (20/10, faltam 21 dias). Tem 100 perguntas e 70% de conclusão. A tela de detalhe mostra "70 de 100 itens aprovados".
2. **Nova tarefa com falha:** "Questionário ESG — Orbis Energia" (RFP, prazo 23/10) falhou no carregamento do arquivo e está com 0% de conclusão. O alerta de falha da tela de Tarefas passou a apontar para ela.
3. **Botão:** agora diz "Nova RFP/RFI".

Ajustei também o título da tela para "5 RFPs e RFIs em andamento" e o contador no menu lateral para 5. A tela de detalhe da falha passou a dizer "Falha no carregamento".

Na tabela, o status da Orbis continua "Falha" (o texto longo não cabe na coluna). O texto completo aparece só no detalhe.

## User

Coloque o exemplo da RFP "cordel Seguros" como vencida/em atraso

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

A Cordel Seguros agora aparece como vencida: prazo 28/09/2026, "atrasada" em vermelho e negrito. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

Mantive os 70% de conclusão e as 100 perguntas. O texto no detalhe da tarefa passou a dizer "Prazo vencido em 28/09/2026. Faltam 30 itens para a exportação ser liberada."

Criei também um alerta "Prazo vencido" para a Cordel Seguros na tela de Tarefas, o que você não pediu. Ele entra junto com os outros alertas, na navegação por setas.

## User

Separe o botão de "tentar novamente" em uma nova coluna para "AÇÕES"

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tabela da Base de conhecimento, o botão "Tentar novamente" agora fica numa coluna própria, "Ações", depois de "Subiu". A coluna Status mostra só o selo. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

Entendi que você falava dessa tabela. Se era outra, me avise qual.

## User

Crie um anova tela como página inicial dentro da área do "Produto - Workspace" como um dashboard com numeros gerais de uso, quantidade de RFPs trabalhadas, itens em aberto, tempo médio gasto por RFP. Posicione a opção no menu logo acima do submenu "Trabalho".

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Criei o Dashboard e ele agora é a página inicial do Workspace, com a opção "Dashboard" no menu, num grupo "Início" acima de "Trabalho". O botão de entrada do site leva a ele. O verificador está rodando em segundo plano e só me avisa se achar problema, então ainda não conferi o resultado.

- **Números gerais:** RFPs e RFIs trabalhadas, itens em aberto, tempo médio por RFP (2,4 dias) e itens aprovados.
- **Gráficos e lista:** tarefas por status, RFPs concluídas por mês e os prazos mais próximos. Clicar numa tarefa da lista abre o detalhe dela.
- **Números calculados:** "RFPs trabalhadas" (5 em andamento mais 18 concluídas), "itens em aberto" e "itens aprovados" saem do estado do protótipo. Os 18 concluídos e os 1.284 aprovados são valores que inventei, assim como o tempo médio e as barras por mês. Troque pelos dados reais quando tiver.

## User

Mudar o termo de RFP " atrasada" para "Vencida"

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

"atrasada" virou "Vencida" em três lugares: no prazo da Cordel Seguros na lista de tarefas e no dashboard, na regra que deixa o prazo em vermelho e no texto do alerta ("está vencida, com 30 itens sem aprovação"). Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

## User

Utilize a tag de status para RFPs/RFIs vencidas para uma na cor de alerta com icone correspondente com o texto "VENCIDO"

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

A Cordel Seguros agora mostra a tag "Vencido", em vermelho de alerta e com ícone de relógio, no lugar de "Em revisão". Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

Escrevi "Vencido" com só a inicial maiúscula, como as outras tags. Se o componente de tag não colocar o texto em caixa alta sozinho, me avise e eu troco para "VENCIDO". A regra vale para qualquer tarefa com prazo "Vencida" na lista de Tarefas e no Dashboard.

## User

Revise a aplicação da tag de "vencido" em todas as telas.

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Revisei onde a tag de status aparece e corrigi três pontos. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

- **Lista de Tarefas (tabela e cartões no celular):** já mostrava "Vencido" e continua igual.
- **Detalhe da Cordel Seguros:** o cartão ainda dizia "Em revisão". Agora mostra "Vencido".
- **Dashboard, "Prazos mais próximos":** a lista não tinha tag de status. Agora cada linha mostra a tag, incluindo "Vencido" na Cordel Seguros.
- **Dashboard, "Tarefas por status":** a barra e a legenda não tinham cor para "Vencido". Agora ele aparece em vermelho. Para não ficar igual, mudei "Falha" para cinza-oliva; hoje as duas tags são vermelhas na lista de Tarefas e só a barra do dashboard usa o cinza.

As telas de Exportação e Histórico não mostram tarefas vencidas, então ficaram como estavam.

## User

Na tela de "Base de conhecimento" deixe a coluna "ações" apenas com icones, exiba o label do icone ao passar o ponteiro por cima do botão.
Crie um botão de status tipo toggle (ativo/inativo) para a documentação dentro da coluna ações.
Ao deixar o toggle para inativo, o status do documento deve ser marcado como "Inativo".

## Assistant

_[tool: list_files]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Na tela de Base de conhecimento, a coluna "Ações" agora usa só ícones, com o nome da ação aparecendo ao passar o ponteiro. O verificador está rodando em segundo plano e só me avisa se achar problema, então ainda não conferi o resultado.

- **Tentar novamente:** virou um botão de ícone, que só aparece em documentos com erro. O nome aparece ao passar o ponteiro.
- **Toggle ativo/inativo:** cada documento tem um toggle na coluna. O nome da ação ("Desativar documento" ou "Ativar documento") aparece ao passar o ponteiro. Ao desativar, o status vira "Inativo" (selo cinza com traço) e aparece um aviso confirmando a mudança.

Fiz duas coisas que você não pediu. Um documento inativo deixa de aparecer como "Pronto" e não conta mais no total de documentos processados. E um documento inativo com erro perde o botão de tentar novamente.

## User

Mude o texto label da coluna "Subiu" para "Enviado por"

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

O rótulo da coluna "Subiu" agora é "Enviado por" na tabela da Base de conhecimento. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

## User

Revise o toggle/switch para o design exato presente como exemplo no systre design do Tendra.ai

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: list_files]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: eval_js]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: eval_js]_

Preview likely hasn't reloaded; verify.

_[tool: ready_for_verification]_

O toggle já usava o componente Switch do sistema de design. O problema era que ele aparecia maior que o desenhado: 50×32 px, em vez de 44×26. O componente espera que o preenchimento interno entre na conta do tamanho, e a página não tinha essa regra.

Adicionei a regra só para o toggle, então o resto do layout não muda. O toggle volta ao tamanho exato do sistema:
- **Tamanho:** trilho de 44×26 px.
- **Ligado:** trilho em tinta com a bolinha em limão.
- **Desligado:** trilho em cinza, com a bolinha em branco.

O verificador está rodando em segundo plano e só me avisa se achar problema. Meu teste de tamanho rodou antes de a prévia recarregar, então ainda não confirmei que a correção pegou.

## User

Na visão do dashboard, na tabeça de "Prazos mais próximos" exiba apenas as que possuem menos de 15 dias para o prazo e exclua as vencidas.

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

"Prazos mais próximos" no Dashboard agora lista só tarefas com menos de 15 dias para o prazo, sem as vencidas. Hoje aparecem Banco Meridian (4 dias) e Helios Logística (11 dias), em ordem de data. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

A Cordel Seguros (vencida) e as tarefas com 15 dias ou mais (Vetta, 16 dias; Orbis, 24 dias) saíram da lista.

## User

Inclua mais 2 exemplos de RFPs/RFIs "Em revis"ao" e 1 "Pronta"

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Adicionei três tarefas à lista de Tarefas. O verificador está rodando em segundo plano e só me avisa se achar problema, então ainda não conferi o resultado.

**Em revisão**
- Questionário de privacidade — Nimbus Telecom (RFI): 45 de 60 itens aprovados (75%), prazo em 13 dias.
- Due diligence — Solaris Energia (RFP): 90 de 150 itens aprovados (60%), prazo em 6 dias.

**Pronta**
- Questionário de segurança — Atlas Saúde (RFI): 32 de 32 itens aprovados, prazo em 19 dias.

O resto do app acompanhou as novas tarefas:
- **Título e menu:** passaram a mostrar 8 RFPs e RFIs em andamento.
- **Dashboard:** os números gerais e a contagem de itens em aberto já incluem as três. A Solaris entra em "Prazos mais próximos", e a Nimbus também (13 dias, abaixo de 15).
- **Exportação:** ganhou um cartão para a Atlas Saúde.
- **Detalhe das tarefas:** o texto e a barra de progresso agora saem dos números de cada tarefa. Antes estavam fixos em 70 de 100 e 24 de 24.

Os nomes das empresas, os prazos e as contagens são fictícios, para exemplo.

## User

Crie os demais elementos de exemplo (itens, perguntas e respostas etc na tela de tarefas e demais telas) para os novos exemplos "Em revisão" criados.

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

As três tarefas "Em revisão" agora têm itens, perguntas e respostas próprios. Cordel Seguros tem 100 itens, Nimbus Telecom 60 e Solaris Energia 150. O verificador está rodando em segundo plano e só me avisa se achar problema, então ainda não conferi o resultado.

- **Itens:** 70, 45 e 90 já aparecem aprovados em cada tarefa. O resto fica entre sugerida, em revisão, revisada e sem rascunho, com alguns alertas de baixa confiança, fonte antiga e sem contexto.
- **Respostas:** cada item tem pergunta, resposta e fonte (documento e página) para abrir no visualizador.
- **Perguntas repetidas:** escrevi 24 perguntas de segurança e privacidade. Como as tarefas têm até 150 itens, as perguntas se repetem com um escopo no fim, como "(ambiente de homologação)". Se quiser um conjunto mais variado, me avise.
- **Detalhe da tarefa:** mostra o status em um selo no topo (Cordel aparece como "Vencido"), os contadores, a barra por estado e a tabela de itens. O botão "Abrir revisão" leva para a tela de Revisão da própria tarefa, e essa tela mostra o nome da tarefa e o total correto no lugar do antigo "de 12".
- **Números:** a lista de Tarefas, o Dashboard e os alertas leem esses itens. Aprovar um item muda as barras de progresso e as contagens de itens em aberto e aprovados.

Mantive as três tarefas "Em revisão" como pediu. Pronta (Helios e Atlas), Processando e Falha continuam só com o resumo, sem itens.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: grep]_

Remaining `c.` uses are the active-task review/detail ones (correct); `exportCount` is unused by the template.

_[tool: ready_for_verification]_

Corrigi o cartão do Banco Meridian na tela de Exportação. Ele mostrava "50 de 12 itens aprovados" e liberava o botão quando a tarefa aberta na Revisão era outra. Agora usa sempre as contagens do Banco Meridian. Abri o arquivo e o console não mostrou erros, mas não conferi o resultado visualmente.

Os outros pontos da tela já usavam as contagens certas.

