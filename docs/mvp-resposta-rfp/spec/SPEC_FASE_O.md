---
feature: ciclo-de-vida-da-tarefa-e-base
status: draft
constitution: 1.0.0
---

# Ciclo de vida da tarefa (finalizar, arquivar, reativar) e ajustes da Base e da Exportação

*Spec de 05/11/2026, a partir do pedido do grupo do mesmo dia. Decisões PO1 a PO12 propostas, aguardando validação.*

## Problema

- **Uma tarefa não termina nunca.** Hoje a tarefa fica no Painel de tarefas para sempre:
  - a RFP entregue ao cliente continua em "Pronta";
  - a RFP que a empresa desistiu de responder fica em "Em revisão" ou "Vencido".
  - A única saída é excluir, o que apaga o histórico.
- **Efeitos disso:**
  - o painel, os contadores do menu e o Dashboard misturam trabalho em andamento com trabalho encerrado. "84 itens em aberto" pode ser quase tudo de uma RFP abandonada;
  - não há registro de quem concluiu uma RFP nem quando.
- **Exportação sem ordem nem busca.** As tarefas aparecem na ordem de envio, sem destaque para as prontas, sem filtro e sem busca. Com dez ou mais tarefas, achar a que precisa ser baixada exige rolar a lista.
- **A tela da Base explica demais e mostra colunas de menos uso.**
  - Um parágrafo longo sobre o formato do `.md` fica sempre visível, mesmo para quem já conhece as regras.
  - A tabela tem oito colunas e passa de 1.000 px, o que gera rolagem lateral em telas médias.
- **Redundâncias.**
  - O cartão de alertas do Painel de tarefas repete o sino da barra superior.
  - O botão "Baixar planilha preenchida" dos detalhes da tarefa repete a Exportação, que é onde a regra de download (fase J) está explicada.

## Objetivos

1. **Encerrar uma tarefa sem perder nada.** Toda RFP sai do trabalho em andamento de um de dois jeitos, ambos com quem e quando:
   - **finalizada:** entregue, 100% aprovada e baixada;
   - **arquivada:** abandonada, com itens, alertas e estágio preservados.
2. **Contadores que medem só o trabalho em andamento.** Nenhum contador de "em andamento" (menu, Painel, Revisão, Dashboard, sino) conta tarefas finalizadas ou arquivadas.
3. **Achar a tarefa a baixar em segundos.** Na Exportação:
   - as prontas vêm primeiro;
   - as encerradas vêm por último;
   - há filtro por status e busca por empresa ou título.
4. **Base mais enxuta.**
   - A tabela cabe sem rolagem lateral a partir de 1.024 px (hoje pede 1.040 px só para a grade).
   - As regras do formato ficam a um clique, organizadas em blocos.

## Não objetivos

- **Reabrir uma tarefa finalizada.** A finalizada é o registro do que foi entregue. Reabrir significaria editar uma resposta já enviada ao cliente; se precisar, a empresa envia a RFP de novo como uma tarefa nova. Pode voltar numa fase futura (P2).
- **Arquivamento automático por prazo vencido.** Arquivar é uma decisão da empresa, não do sistema. Uma tarefa vencida continua em andamento até alguém arquivá-la.
- **Mudar a regra de download da fase J.** O Revisor continua baixando só a tarefa pronta, e o Aprovador, em qualquer estado. Esta fase só acrescenta o que acontece depois do download.
- **Busca no conteúdo das perguntas na Exportação.** A busca da Exportação olha só a empresa e o título. A busca nas perguntas já existe na Revisão e nos detalhes da tarefa (fase L).
- **Editar o documento da base pelos detalhes.** O painel de detalhes do documento só mostra. Para mudar algo, envia-se uma nova versão do `.md`, como hoje.

## Decisões (propostas, aguardando validação)

| # | Tema | Proposta | Alternativa descartada |
|---|---|---|---|
| PO1 | Onde fica a situação da tarefa | Uma coluna nova, `tarefas.situacao`, com `em_andamento` (padrão), `finalizada` ou `arquivada`. Junto vêm `situacao_por` (nome da pessoa) e `situacao_em`. O `estado` técnico (`processando`, `pronta`, `falha`) não muda. Os status da tela (Processando, Em revisão, Pronta, Vencido, Falha) continuam calculados como hoje, só para as tarefas em andamento. | Novos valores em `estado`. Misturaria o processamento com a decisão da empresa e quebraria a rotina de reclassificação e a retomada do processamento, que leem `estado` |
| PO2 | Nome da ação no box da Exportação | O pedido diz "arquivar", mas a ação leva a "Finalizada". Para não confundir com o "Arquivar" do Painel, o botão do box se chama **"Finalizar RFP"** (ou "Finalizar RFI"). | "Arquivar" nos dois lugares, com efeitos diferentes |
| PO3 | Quando se pode finalizar | Só a tarefa **pronta** (100% aprovada e sem alerta pendente). Só pelo box que abre depois de baixar a planilha na Exportação. "Agora não" fecha o box, e a tarefa segue pronta e em andamento. Ao baixar de novo, o box aparece de novo. | Um botão "Finalizar" solto no Painel. Permitiria finalizar sem nunca ter baixado o que foi entregue |
| PO4 | Quem finaliza, arquiva, reativa e exclui | **Finalizar:** quem pode baixar a tarefa pronta, ou seja, Revisor e Aprovador (fase J). **Arquivar, reativar e excluir:** só o Aprovador, como a exclusão de hoje (cenário 60). Desistir de uma proposta é decisão de quem aprova. Sem login (modo local), todos podem tudo, como hoje. | Arquivar liberado também para o Revisor |
| PO5 | Finalizada é só leitura | Como a arquivada: abre normalmente, mas sem edição, aprovação, troca de área, alertas ou "Revisar com IA". O backend recusa com 409 qualquer mudança em item de tarefa finalizada ou arquivada. A planilha continua baixando ("Baixar novamente"). Não pode ser excluída: sem o botão, e o `DELETE` é recusado com 409. | Finalizada editável. Poderia mudar a resposta depois de entregue sem registro |
| PO6 | O que pode ser arquivado | Tarefa em andamento que **não** está em processamento: Em revisão, Pronta, Vencido ou Falha. Durante o processamento, o botão fica desabilitado com o motivo, como a exclusão. | Arquivar durante o processamento. O processamento ainda grava itens |
| PO7 | Estado ao reativar | A tarefa volta a "em andamento", com itens, aprovações e alertas como estavam. O pedido fala em "status em revisão". Como o status é calculado pelos itens, ela aparece "Em revisão", ou "Pronta" se já estava 100% aprovada, ou "Vencido" se o prazo passou. Não se apaga nenhuma aprovação para forçar "Em revisão". | Forçar "Em revisão" removendo aprovações |
| PO8 | Submenus de Tarefas | "Tarefas" vira um grupo com três itens: **Em andamento**, **Finalizadas** e **Arquivadas**, cada um com a sua contagem. As três telas têm o layout do Painel de hoje. "Tarefas" sozinho abre "Em andamento". No menu recolhido (ícones), o ícone de Tarefas abre "Em andamento", e os três aparecem na dica. | Abas dentro de uma tela só |
| PO9 | Ordem e filtro da Exportação | A lista tem três blocos: **Prontas**, depois **as demais em andamento**, depois **Finalizadas e Arquivadas**. Dentro de cada bloco, a ordem de envio de hoje (mais recente primeiro). Filtro "Status": Todos, Pronta, Em revisão, Vencido, Finalizada e Arquivada, com a contagem de cada um. A busca segue as regras da fase L (sem diferenciar maiúsculas, minúsculas nem acentos; todas as palavras), no nome da empresa e no título da RFP. O título é o nome dado na Nova RFP ou, sem ele, o nome do arquivo. | Ordem só por data |
| PO10 | O que entra nos contadores | Só as tarefas em andamento:<br>• contagem de Tarefas/Em andamento no menu e título do Painel;<br>• contador da Revisão;<br>• Dashboard: Itens em aberto, Tarefas por status e Prazos mais próximos;<br>• alertas do sino (prazo próximo, conflito, fonte vencida).<br>"RFPs e RFIs trabalhadas" e "Itens aprovados" continuam somando todas, porque medem o histórico. "RFPs concluídas por mês" passa a contar as **finalizadas** pelo mês da finalização. | "Concluídas por mês" contando as 100% aprovadas (regra de hoje) |
| PO11 | Revisão de tarefa encerrada | A Revisão abre itens de tarefa finalizada ou arquivada (pelos detalhes da tarefa), com uma faixa no topo: "RFP finalizada por X em dd/mm/aaaa: só leitura" (ou "arquivada"). Os botões de edição e aprovação somem. O seletor de tarefa da Revisão lista só as em andamento. | Bloquear a Revisão de tarefas encerradas |
| PO12 | Painel de detalhes do documento e da Dica | Os dois usam o mesmo painel lateral dos detalhes da tarefa ("Ver detalhes"), com título, blocos e botão de fechar. No celular, ocupa a tela. Os detalhes do documento usam só os campos que a rota da base já devolve. A Dica é texto fixo, tirado de `FORMATO_BASE_MD.md`. | Diálogo central (modal) |

## Usuários e histórias

**Responsável pela proposta (Aprovador)**
- Quero arquivar uma RFP que a empresa desistiu de responder, para tirá-la do trabalho em andamento sem perder as respostas já feitas.
- Quero reativar uma RFP arquivada, para retomar de onde parou se o cliente reabrir a concorrência.
- Quero excluir uma RFP arquivada que não serve nem como histórico, para manter a lista limpa.
- Quero ver as finalizadas com quem concluiu e quando, para ter o registro das propostas entregues.

**Quem baixa a planilha (Revisor ou Aprovador)**
- Quero ver as prontas primeiro na Exportação, para baixar o que já pode ser entregue sem procurar.
- Quero buscar pela empresa ou pelo título da RFP, para achar uma tarefa numa lista longa.
- Quero, ao baixar uma RFP pronta, marcar que o trabalho terminou, para que ela saia do que está em andamento.

**Quem mantém a base**
- Quero consultar as regras do `.md` quando precisar, sem um parágrafo fixo na tela, para a tabela ganhar espaço.
- Quero ver todos os dados de um documento (tipo, versão, quem enviou, datas, arquivo) num painel, para a tabela mostrar só o que decido no dia a dia: nome, validade, idade e status.

**Qualquer pessoa da organização**
- Quero que os contadores mostrem só o trabalho em andamento, para saber quanto falta de verdade.
- Quero abrir uma RFP finalizada ou arquivada e ler tudo, sem risco de mudar algo sem querer.

## Dependências de infraestrutura

- **Banco (Supabase):** uma migração nova, `012_situacao_da_tarefa.sql`:
  - `tarefas.situacao text NOT NULL DEFAULT 'em_andamento' CHECK (situacao IN ('em_andamento', 'finalizada', 'arquivada'))`;
  - `tarefas.situacao_por text` e `tarefas.situacao_em timestamptz`.
  - Todas as tarefas existentes ficam em andamento, inclusive a RFP-04 já 100% aprovada (O16). Planos gratuitos sem mudança.
- **Rotas novas:**
  - `POST /api/tarefas/:id/finalizar`;
  - `POST /api/tarefas/:id/arquivar`;
  - `POST /api/tarefas/:id/reativar`.
  - As três seguem a proteção da fase K: 404 para tarefa de outra organização.
- **Rotas existentes que mudam:**
  - `GET /api/tarefas` devolve `situacao`, `situacaoPor` e `situacaoEm`;
  - as rotas de mudança de item (editar, restaurar, revisar, aprovar, remover aprovação, avaliar, reconhecer alerta, escolher fonte, trocar área, "Revisar com IA") recusam com 409 em tarefa encerrada;
  - o `DELETE` recusa com 409 em tarefa finalizada.
- **IA:** nenhuma chamada nova.
- **Render e Vercel:** sem mudança de configuração. Os merges precisam ser feitos pela conta dona do time na Vercel (fases L a N).
- **Base:** só front. A rota `GET /api/base/documentos` já devolve tudo o que os detalhes precisam:
  - título, nome do arquivo, tipo e versão;
  - atualizado em e validade;
  - se está vencido ou ativo;
  - enviado por e carregado em.

## Acceptance Criteria

### Base de conhecimento

**Cenário O1: Dica do formato**
- **Given** a tela da Base, com ou sem documentos
- **When** a pessoa clica em "Dica", ao lado de "Subir documentos"
- **Then** abre o painel lateral "Como preparar os arquivos", com estes blocos:
  - **Formatos aceitos:** só `.md`, em UTF-8; até 10 MB e 100 arquivos por envio;
  - **Cabeçalho:** os cinco campos, `titulo`, `tipo` (`documento` ou `rfp-passada`), `atualizado_em`, `versao` e `validade`, com obrigatoriedade, regra e um exemplo;
  - **Datas:**
    - formato AAAA-MM-DD;
    - `atualizado_em` é a data em que o conteúdo foi conferido e não pode ser futura;
    - o aviso aparece com mais de 120 dias;
    - na validade, o documento vence e fica inativo;
  - **Como a base trata os arquivos:**
    - o mesmo nome de arquivo atualiza o documento;
    - conteúdo igual é ignorado;
    - campos desconhecidos geram aviso;
    - ativar e desativar é pela chave;
    - um vencido só volta com uma nova versão;
    - o tipo vem do cabeçalho.
- **And** o parágrafo fixo "Aceita arquivos .md com o cabeçalho…" não aparece mais na tela
- **And** o painel fecha pelo X, por Esc e pelo clique fora, e no celular ocupa a tela

**Cenário O2: tabela da Base**
- **Given** a Base com documentos
- **When** a tabela é exibida no computador
- **Then** as colunas são Documento (título, com versão e arquivo abaixo), Validade, Idade, Status e Ações
- **And** as colunas Tipo, Atualizado e Enviado por saem
- **And** em Ações há o botão "Ver detalhes" (ícone com dica), além de "Tentar novamente" quando houver e da chave Ativar/Desativar
- **And** a tabela não tem rolagem lateral com a janela de 1.024 px
- **And** no celular, cada cartão também tem "Ver detalhes"

**Cenário O3: detalhes do documento**
- **Given** um documento da base
- **When** a pessoa clica em "Ver detalhes"
- **Then** abre o painel lateral com:
  - nome do documento (título) e nome do arquivo;
  - tipo ("Documento" ou "RFP passada") e versão ("Sem versão" se não houver);
  - atualizado em e idade em dias, com o aviso de mais de 120 dias;
  - validade ("Indefinido" se não houver) e o status, incluindo vencido e inativo;
  - enviado por e enviado em (data e hora da carga).
- **And** o painel não tem nenhuma ação que mude o documento

### Exportação

**Cenário O4: ordem da lista**
- **Given** tarefas prontas, em revisão, finalizadas e arquivadas
- **When** a pessoa abre a Exportação
- **Then** a lista mostra as prontas, depois as demais em andamento, depois as finalizadas e arquivadas, cada bloco na ordem de envio de hoje
- **And** o título continua no formato "N tarefas para baixar · P prontas", contando só as em andamento

**Cenário O5: filtro e busca**
- **Given** a Exportação com várias tarefas
- **When** a pessoa escolhe um status no filtro ou digita na busca
- **Then** a lista mostra só as tarefas daquele status cuja empresa ou título contém todas as palavras, sem diferenciar maiúsculas, minúsculas nem acentos
- **And** o filtro mostra a contagem de cada status
- **And** sem resultado, aparece o EmptyState "Nenhuma tarefa encontrada." com "Confira as palavras ou limpe a busca."
- **And** Esc limpa a busca

**Cenário O6: box de conclusão**
- **Given** uma tarefa pronta e em andamento
- **When** a pessoa baixa a planilha
- **Then** o download acontece e abre o box "RFP concluída. Parabéns pelo trabalho!", com o texto "Quer finalizar esta RFP? Ela sai das tarefas em andamento e fica em Finalizadas, só para leitura." e os botões "Finalizar RFP" e "Agora não"
- **And** para uma RFI, o texto diz "RFI"
- **And** o box não aparece ao baixar uma tarefa que não está pronta, nem uma já finalizada ou arquivada

**Cenário O7: finalizar**
- **Given** o box do O6 aberto
- **When** a pessoa clica em "Finalizar RFP"
- **Then** a tarefa passa a "Finalizada", com quem finalizou e quando
- **And** o cartão da Exportação mostra o selo "Finalizada por Nome · dd/mm/aaaa" e vai para o fim da lista
- **And** o status é o mesmo em todas as telas que mostram a tarefa: Exportação, Finalizadas, detalhes da tarefa, Revisão e Dashboard
- **And** um pedido direto a `POST /api/tarefas/:id/finalizar` numa tarefa que não está pronta é recusado com 409
- **And** "Agora não" fecha o box sem mudar nada

### Tarefas

**Cenário O8: submenus**
- **Given** o menu lateral
- **When** a pessoa abre Tarefas
- **Then** aparecem Em andamento, Finalizadas e Arquivadas, cada um com a sua contagem, e "Tarefas" abre Em andamento
- **And** as três telas usam o layout do Painel de hoje, com títulos "N RFPs e RFIs em andamento", "N RFPs e RFIs finalizadas" e "N RFPs e RFIs arquivadas"
- **And** Finalizadas e Arquivadas mostram, em vez do prazo, quem finalizou ou arquivou e quando
- **And** a lista vazia mostra um EmptyState com uma explicação curta

**Cenário O9: Em andamento**
- **Given** a tela Em andamento
- **When** ela é exibida
- **Then** lista as tarefas em andamento: processando, em revisão, prontas, vencidas e com falha
- **And** o cartão de alertas do Painel não aparece mais (os alertas ficam no sino)
- **And** cada linha tem "Arquivar" (ícone com dica) ao lado de "Excluir", só para o Aprovador

**Cenário O10: arquivar**
- **Given** uma tarefa em andamento que não está processando
- **When** o Aprovador clica em "Arquivar" e confirma ("Arquivar Nome da RFP? Ela sai das tarefas em andamento e fica em Arquivadas, só para leitura. Você pode reativá-la depois.")
- **Then** a tarefa passa a "Arquivada", com quem arquivou e quando, e sai de Em andamento para Arquivadas
- **And** durante o processamento, o botão fica desabilitado com o motivo, e a rota recusa com 409
- **And** o Revisor não vê o botão, e a rota recusa com 403

**Cenário O11: tarefa encerrada é só leitura**
- **Given** uma tarefa finalizada ou arquivada
- **When** alguém a abre nos detalhes ou na Revisão
- **Then** vê todos os itens, respostas, fontes, alertas e áreas como estavam no encerramento
- **And** a Revisão mostra a faixa "só leitura" com quem e quando
- **And** não aparecem editar, restaurar, marcar como revisado, aprovar, trocar a área, tratar alertas, escolher fonte nem "Revisar com IA"
- **And** um pedido direto a qualquer rota de mudança de item é recusado com 409 ("A tarefa está finalizada/arquivada e é só para leitura."), sem mudar nada

**Cenário O12: reativar**
- **Given** uma tarefa arquivada
- **When** o Aprovador abre os detalhes e clica em "Reativar RFP" (ou "Reativar RFI"), ao lado de "Abrir revisão"
- **Then** a tarefa volta a Em andamento, com o status calculado pelos itens: Em revisão, Pronta ou Vencido
- **And** itens, aprovações e alertas ficam como estavam
- **And** o botão não aparece para o Revisor nem em tarefa finalizada

**Cenário O13: exclusão**
- **Given** uma tarefa arquivada
- **When** o Aprovador clica em "Excluir" em Arquivadas e confirma
- **Then** a tarefa é excluída como hoje (cenário 60)
- **And** em Finalizadas não há "Excluir", e `DELETE /api/tarefas/:id` numa finalizada é recusado com 409

**Cenário O14: detalhes da tarefa sem download**
- **Given** os detalhes de qualquer tarefa
- **When** a tela é exibida
- **Then** não há mais o botão "Baixar planilha preenchida". O download é só pela Exportação

**Cenário O15: contadores**
- **Given** tarefas em andamento, finalizadas e arquivadas
- **When** a pessoa vê o menu, o Painel, a Revisão, o Dashboard e o sino
- **Then** as contagens de em andamento (PO10) somam só as tarefas em andamento
- **And** o Dashboard mostra "RFPs concluídas por mês" pelas finalizações
- **And** nenhum alerta do sino é de uma tarefa encerrada

**Cenário O16: migração**
- **Given** o banco publicado antes da fase O
- **When** a migração 012 roda
- **Then** todas as tarefas ficam em andamento, sem quem nem quando
- **And** nenhum item, aprovação, área ou evento muda

**Cenário O17: isolamento entre organizações**
- **Given** duas organizações
- **When** alguém de uma delas finaliza, arquiva, reativa ou exclui
- **Then** nada muda na outra. As rotas novas devolvem 404 para tarefa de outra organização (fase K)

## Requisitos

**P0 (sem eles a fase não resolve o problema):**
- situação da tarefa no banco, com a migração (O16);
- finalizar pelo box da Exportação (O6, O7);
- arquivar, reativar e excluir arquivada (O10, O12, O13);
- só leitura no backend e na tela (O11);
- submenus de Tarefas (O8, O9);
- contadores só do trabalho em andamento (O15);
- isolamento (O17).

**P1 (podem ir numa segunda entrega da fase):**
- ordem, filtro e busca da Exportação (O4, O5);
- Base: Dica, tabela enxuta e detalhes do documento (O1 a O3);
- remoção do cartão de alertas e do botão de download dos detalhes (O9, O14).
- *São independentes do ciclo de vida, e a parte da Base é só front.*

**P2 (o desenho deve permitir):**
- reabrir uma finalizada, com o registro de quem reabriu;
- eventos de finalização, arquivamento e reativação no Histórico (hoje os eventos são por item: `item_numero NOT NULL`);
- motivo do arquivamento (perdemos, desistimos, prazo);
- arquivamento em lote.

## Métricas de sucesso

- **Imediatas:**
  - depois do deploy, toda RFP entregue no ambiente compartilhado é finalizada pelo box, sem precisar de outro caminho;
  - zero mudanças de item em tarefa encerrada nos eventos;
  - a tabela da Base sem rolagem lateral a 1.024 px.
- **Ao longo do uso:**
  - a contagem de Em andamento fica estável ou cai à medida que as RFPs são entregues, em vez de só crescer;
  - "RFPs concluídas por mês" passa a refletir entregas reais;
  - menos exclusões de tarefa, trocadas por arquivamento, medidas no log do backend.

## Perguntas em aberto

- **[Grupo, bloqueia o início]** Validar PO1 a PO12, principalmente estas três:
  - o nome "Finalizar RFP" no box (PO2);
  - só o Aprovador arquiva e reativa (PO4);
  - a finalizada também é só leitura e não reabre (PO5).
- **[Grupo, não bloqueia]** Status ao reativar uma tarefa 100% aprovada: a proposta é mostrar "Pronta", calculado pelos itens (PO7), e não forçar "Em revisão".
- **[Grupo, não bloqueia]** A RFP-04 da Pulse Benefícios, 100% aprovada antes da fase, fica em andamento depois da migração. Para finalizá-la, alguém baixa a planilha e usa o box (O16). Alternativa: marcá-la como finalizada no banco depois do deploy.
- **[Design, não bloqueia]** Textos do box de conclusão, da confirmação de arquivar e dos estados vazios de Finalizadas e Arquivadas.

## Fases sugeridas

1. **O-a, ciclo de vida (P0):** migração 012, rotas, só leitura no backend, submenus, arquivar e reativar, box de finalização e contadores.
2. **O-b, Exportação e limpezas (P1):** ordem, filtro e busca, remoção do cartão de alertas e do download dos detalhes.
3. **O-c, Base (P1):** Dica, tabela enxuta e detalhes do documento. Só front; pode ir antes ou em paralelo, porque não depende das outras.

## Fora de escopo

- Reabrir finalizada, motivo do arquivamento e arquivamento em lote (P2).
- Arquivamento automático por prazo.
- Mudança na regra de download da fase J.
- Edição de documento pelos detalhes da Base.
- Mudanças na geração, na classificação por área ou na avaliação.
