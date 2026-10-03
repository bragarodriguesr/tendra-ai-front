# PRD Front-end — Tendra.ai (MVP)

Sep 29, 2026 · @Rafael Braga

## 1. Contexto e problema

Este PRD especifica **apenas o front-end do MVP**: a interface em que times de pré-vendas revisam, corrigem e aprovam respostas a RFPs e RFIs, cada uma com fonte rastreável. Bases de dados, APIs, modelos de IA e integrações estão fora deste documento; onde a tela depende de um dado, ele aparece como *entrada* que o front recebe.

**Problema.** Responder uma RFP mobiliza, em média, 8 pessoas e mais de 40 horas (pitch deck), porque a informação está pulverizada em e-mails, PDFs antigos, propostas anteriores e chats. Especialistas seniores viram "buscadores de arquivos" e o time convive com o risco de enviar resposta desatualizada ou fora de compliance.

**Job to be done (canvas do grupo).** "Quando recebo uma nova RFP complexa com prazo apertado, quero gerar uma primeira versão de respostas técnicas precisas e alinhadas ao compliance da empresa sem ter que procurar arquivos ou escrever tudo do zero, para que eu possa entregar uma proposta comercial de alta qualidade no menor tempo possível e focar no fechamento do negócio."

**Desafio reenquadrado (How Might We).** De "como automatizar o preenchimento de RFPs e RFIs?" para "como eliminar a dependência de busca ativa de informações entre departamentos para que especialistas atuem apenas como revisores finais de propostas?".

**O que o discovery mudou e por que isso define a interface:**

- A hipótese original era velocidade de escrita; a refinada é governança e redução de atrito. O test card aposta que o valor central é reduzir a fricção interdepartamental e o risco jurídico por meio de rastreabilidade total.
- A confiança do revisor vem do deep-link para a fonte, não da qualidade do texto. O learning card manda focar o MVP em "Rastreabilidade Cirúrgica": cada parágrafo mostra a fonte e o selo de quem aprovou.
- A tela de revisão é o produto. O canvas pede painel de revisão item a item, não um chat genérico.
- A confiança do próprio time nesta leitura é desigual: dor 9/10, formato da solução (UX) 6/10, viabilidade técnica 5/10. O ponto mais incerto de UX é como sinalizar dado expirado ou conflitante, tratado na seção 6.

**Limite da evidência.** As personas e as falas citadas vêm de uma sessão de discovery com personas sintéticas. O próprio relatório aponta validação em campo pendente; a seção 16 lista o que depende disso.

## 2. Objetivos e não-objetivos

A interface do MVP precisa provar que o time revisa mais rápido e com mais confiança quando cada resposta chega com a fonte que a sustenta. Os seis objetivos abaixo são resultados, não telas.

| # | Objetivo | Como a interface mede | Meta | Origem |
| --- | --- | --- | --- | --- |
| O1 | Confiança pela fonte | % de respostas cuja fonte é aceita sem busca manual | > 80% (a validar no piloto) | PRD anterior, test card |
| O2 | Menos horas de especialista | Horas de especialistas por RFP contra a linha de base do cliente | −50% no piloto de 30 dias | Test card |
| O3 | Texto sugerido útil | % do texto sugerido mantido sem alteração na versão exportada | ≥ 70% | Canvas, slide 7 |
| O4 | Ciclo mais curto | Tempo do upload da RFP à exportação | −60% no mínimo (conflita com −40% do PRD anterior; ver seção 15) | Canvas, slide 7 |
| O5 | Nenhum envio sem humano | % de itens exportados com aprovação e alertas reconhecidos | 100% | Canvas, MoSCoW |
| O6 | Primeiro valor rápido | Tempo da criação da conta ao primeiro rascunho revisável (TTFV) | A definir (Q-08) | Pitch deck |

**Não-objetivos do MVP**, cada um com o motivo:

- **Chat ou assistente conversacional.** O canvas prioriza produtividade de revisão item a item; "Modo assistente" está em Won't no MoSCoW.
- **Envio automático e auto-aprovação.** O human-in-the-loop é uma trava de segurança, não uma opção. A interface não tem botão de enviar ao cliente.
- **Integrações externas** (CRMs, Google Drive, SharePoint, Slack/Teams, MCP). Estão em Won't no MoSCoW e fora do MVP no pitch. Isso substitui o "Should" de Slack/Teams do PRD anterior.
- **Aprovação multinível.** Won't no MoSCoW; o MVP tem um único ponto de aprovação, com dois papéis (seção 3).
- **Base pré-carregada de normas e regulações** (LGPD e similares). Won't no MoSCoW; a base é o que o cliente sobe.
- **Fluxos específicos de licitação pública.** O estudo de mercado recomenda tratar o setor público como adjacência; o MVP mira RFPs e RFIs privados de tecnologia.

## 3. Usuários e papéis

O MVP tem dois papéis, **Revisor** e **Aprovador**, e um único ponto de aprovação. Isso promove uma versão mínima de "Gestão de perfis" de Could para Must no MoSCoW, porque "toda resposta deve ser aprovada" e o aprovador precisa ser identificado no histórico. O papel Leitor e a aprovação multinível ficam fora.

**Personas do discovery** (sintéticas; ver limite de evidência na seção 1):

| Persona | Papel típico no produto | Job to be done | O que a interface precisa entregar |
| --- | --- | --- | --- |
| Kadu Mendes, engenheiro de pré-vendas | Revisor | "Quando recebo requisitos repetitivos, quero rascunhos com links diretos para a fonte original, para focar em arquiteturas estratégicas e reduzir meu desgaste mental." | Link que abre o documento no trecho exato; revisão item a item |
| Marcelo Vieira, Bid Manager | Aprovador e dono da tarefa | "Quando gerencio propostas, quero eliminar a necessidade de cobrar especialistas via Slack, para reduzir a fricção interna e garantir entregas sem erros de última hora." | Progresso, responsável e prazo visíveis sem perguntar a ninguém |
| "Advogado do Diabo" (Jurídico/CISO) | Aprovador | "Quando a empresa usa IA, quero uma trilha de auditoria imutável, para evitar que alucinações gerem passivos contratuais." | Quem aprovou, quando, com qual fonte e com quais alertas reconhecidos |
| Beatriz Fontes, COO | Compradora; não usa a tela de revisão | "Quando analiso custos, quero que seniores sejam apenas revisores, para proteger a margem bruta dos projetos." | Nada no MVP; painel de ROI fica em P2 (seção 8) |

O mapeamento persona-papel é uma sugestão de partida; quem recebe cada papel é decisão do cliente (Q-05).

**O que cada papel pode fazer:**

| Ação | Revisor | Aprovador |
| --- | --- | --- |
| Subir documentos e RFPs passadas para a base | Sim | Sim |
| Criar tarefa de RFP/RFI e importar perguntas | Sim | Sim |
| Ver rascunhos, fontes e alertas | Sim | Sim |
| Editar a resposta sugerida | Sim | Sim |
| Reconhecer um alerta (registrado com nome e horário) | Sim | Sim |
| Marcar item como "Revisado" (pronto para aprovação) | Sim | Sim |
| **Aprovar item** | Não | Sim |
| **Exportar o documento final** | Não | Sim |
| Ver histórico de respostas aprovadas | Sim | Sim |

As linhas de subir documentos, criar tarefa e exportar são suposições deste PRD, não estão nos documentos do projeto; entram como Q-05.

## 4. Princípios de UX e sistema visual

A interface segue seis princípios, todos derivados do discovery, e usa os tokens do Brand & Design System v1.0. Quando um requisito abaixo entrar em conflito com estes princípios, os princípios ganham.

**Princípios de produto**

1. **Fonte antes de texto.** Toda resposta mostra de onde veio antes de pedir aprovação. Sem fonte rastreável, o item não é entregável.
2. **A revisão é o produto.** Painel item a item em split view (perguntas à esquerda; resposta, fontes e editor à direita), nunca um chat.
3. **Incerteza é explícita.** A tela nunca preenche uma lacuna com texto plausível. Baixa confiança, conflito e fonte antiga têm sinal próprio e exigem reconhecimento (seção 6).
4. **Aprovação é humana e identificada.** Cada resposta aprovada mostra quem aprovou e quando. Não existe caminho de envio ou aprovação automática.
5. **Revisar rápido, editar pouco.** O caminho feliz é conferir a fonte e aprovar em poucos cliques; o editor existe para ajustes, não para reescrever.
6. **Sóbrio.** Swiss design, grid rigoroso, zero ornamento decorativo (plataforma da marca).

**Tokens visuais da marca** (Brand & Design System v1.0):

| Token | Valor | Uso definido pela marca |
| --- | --- | --- |
| Sálvia Tendra | `#6E7268` | Ação primária, links, foco, símbolo |
| Tinta Profunda | `#12140F` | Títulos, fundos escuros, capas |
| Limão Sinal | `#C8F73D` | Acento sobre tinta; nunca texto em fundo claro |
| Compliance | `#4B5046` | Somente estado: validado, auditado, OK |
| N-000 / N-050 | `#FFFFFF` / `#F5F6F1` | Card / página |
| N-200 / N-400 / N-700 | `#E3E6DC` / `#5D6157` / `#3E4238` | Bordas / meta / corpo |

- **Proporção:** 60% papel, 30% sálvia, 10% limão. **Grid:** 8 px.
- **Tipografia:** Space Grotesk 500–700 para títulos e números; IBM Plex Sans para corpo e interface; IBM Plex Mono para IDs de requisito e rastreabilidade (por exemplo, `REQ-084/210` e `Security_Whitepaper_v4.pdf · p. 12`).
- **Marca:** escrever sempre "Tendra.ai"; nunca "TENDRA AI" nem "Tendra IA". Abaixo de 24 px o símbolo perde o losango.
- **Componente de resposta:** carrega três sinais, o conteúdo gerado, o estado de conformidade e a fonte auditável.

**Lacuna da marca que o design ainda precisa fechar (Q-06):** a escala tipográfica publicada (H1 56/58) é de marketing, não de tabelas e painéis. A marca também não define cores para atenção ou erro; os alertas usam o token danger (vermelho) do design system, decisão registrada na seção 16. Além disso, Sálvia e Compliance são dois cinzas-esverdeados próximos, então nenhum estado pode depender só de cor: todo estado leva ícone e rótulo em texto. Como todos os alertas usam o mesmo vermelho, são o ícone e o rótulo que distinguem baixa confiança, conflito, fonte antiga, termo crítico e resposta manual.

## 5. Mapa de telas e jornada

O MVP tem nove telas, e a de revisão (T6) concentra o valor do produto. A jornada segue os cinco passos do canvas, precedidos por um onboarding no primeiro uso.

| # | Tela | Para que serve | Papéis | Prioridade | Requisitos |
| --- | --- | --- | --- | --- | --- |
| T1 | Onboarding | Guiar a empresa nova a subir os primeiros documentos | Ambos | P0 | Seção 7 |
| T2 | Base de conhecimento | Ver, subir e avaliar a idade dos documentos e das RFPs passadas | Ambos | P0 | Seção 7 |
| T3 | Painel de tarefas | Listar as RFPs e RFIs em andamento com prazo, responsável e % de completude | Ambos | P0 | Seção 8 |
| T4 | Nova RFP/RFI | Importar a lista de perguntas e criar a tarefa | Ambos | P0 | Seção 8 |
| T5 | Detalhe da tarefa | Ver todos os itens, seus estados e o progresso (sugeridas contra validadas) | Ambos | P0 | Seção 8 |
| T6 | Revisão (split view) | Conferir fonte, tratar alertas, editar, marcar revisado e aprovar item a item | Ambos | P0 | Seção 9 |
| T7 | Visualizador de fonte | Abrir o documento de origem no trecho exato, sem sair da revisão | Ambos | P0 | Seção 9 |
| T8 | Exportação | Exportar o documento final; bloqueada até 100% aprovado | Aprovador | P0 | Seção 10 |
| T9 | Histórico de respostas aprovadas | Consultar respostas aprovadas com aprovador, data e RFP de origem | Ambos | P0 (P1 com filtros e auditoria) | Seção 10 |

**Jornada em sete passos.** (1) Onboarding: a empresa sobe seus documentos. (2) Cria a tarefa importando as perguntas da RFP. (3) Aguarda o processamento, com status visível. (4) Revisa item a item, com fonte e alertas. (5) Aprova cada item. (6) Exporta quando 100% está aprovado. (7) Depois de aprovadas, as respostas passam a fazer parte do histórico consultável. O diagrama abaixo mostra onde a jornada se ramifica.

&#91;embedded content: jornada do MVP · 6 passos, 2 decisões, 1 laço de volta\]

O único laço de volta sai da conferência de 100% e retorna à revisão: enquanto houver item pendente, a exportação não abre.

## 6. Regra central de HITL: alertas que precisam ser reconhecidos

**Decisão:** quando a IA tem baixa confiança, a fonte está há mais de 120 dias sem atualização, as fontes conflitam ou a resposta foi escrita à mão sem fonte, a tela mostra o rascunho junto com um alerta, e o item não pode ser marcado como revisado nem aprovado até que uma pessoa reconheça esse alerta. Isso resolve a incerteza de UX registrada no learning card (bloquear tudo contra permitir rascunho com aviso) sem esconder o rascunho e sem deixar o aviso ser ignorado.

| Estado do item | Gatilho (dado que o front recebe) | O que a tela mostra | O que a pessoa faz | Bloqueia aprovação |
| --- | --- | --- | --- | --- |
| Sem contexto | Item chega sem rascunho | Editor vazio e o aviso "Informação não localizada na base. Preenchimento manual obrigatório." | Escreve a resposta; sem fonte, gera o alerta de resposta manual (última linha da tabela) | Sim, até haver resposta escrita |
| Baixa confiança | Rascunho marcado como de baixa confiança | Rascunho visível com faixa de alerta e a fonte mais próxima | Confere a fonte e reconhece o alerta, editando antes se quiser | Sim, até reconhecer |
| Fontes conflitantes | Duas ou mais fontes se contradizem | Rascunho e as fontes em conflito lado a lado no painel de fontes | Escolhe a fonte que vale ou "nenhuma, vou escrever"; a escolha reconhece o alerta | Sim, até decidir |
| Fonte antiga | Alguma fonte usada está há mais de 120 dias sem atualização | Idade da fonte em texto ("142 dias") e faixa de alerta | Reconhece o alerta | Sim, até reconhecer |
| Termo crítico | Pergunta envolve responsabilização civil, multa ou garantia jurídica | Faixa de nível alto "Requer validação do Jurídico" e o rascunho | Reconhece o alerta; o Aprovador decide | Sim; regra final em Q-01 |
| Resposta manual sem fonte | Resposta escrita à mão, sem nenhuma fonte associada | Rótulo "Resposta manual, sem fonte na base" com o nome de quem escreveu, e faixa de alerta | Reconhece o alerta; o Aprovador decide | Sim, até reconhecer |

**Regras de comportamento**

- **Reconhecer registra a pessoa e o horário.** O registro aparece no item e no histórico de auditoria (P1).
- **Não existe "reconhecer todos".** Cada alerta é reconhecido individualmente, porque em massa o alerta viraria ruído. O conflito exige uma escolha, não um clique.
- **Um item pode ter vários alertas.** Todos aparecem empilhados e todos precisam ser tratados.
- **Idade da fonte é sempre visível**, com ou sem alerta, para que o revisor veja a tendência antes de virar problema. A idade conta os dias desde a última atualização da fonte, e o alerta dispara acima de 120 dias.
- **Editar um item já aprovado tira a aprovação.** O item volta para "Em revisão" e o evento fica registrado.
- **Alerta nunca depende só de cor.** Ícone, rótulo em texto e posição fixa acima do texto da resposta.

Estados e transições do item estão no diagrama abaixo.

&#91;embedded content: estados do item · 5 estados, 9 transições\]

Revisar e aprovar exigem todos os alertas reconhecidos. Só o Aprovador aprova, direto de Sugerida ou de Em revisão, e qualquer edição de um item aprovado o devolve para Em revisão.

## 7. Requisitos A: onboarding e base de conhecimento (T1, T2)

A base é o que dá contexto aos rascunhos, então o primeiro uso precisa levar a empresa a subir documentos antes de criar a primeira RFP. Prioridades seguem o MoSCoW; o que não estiver lá vem marcado como proposta deste PRD.

**F-01 · P0 · Onboarding no primeiro uso** (MoSCoW: Must)

- Dado que a empresa não tem documentos na base, quando um usuário entra pela primeira vez, então vê a T1 com "Subir documentos" como ação principal antes de qualquer outra tela.
- A T1 mostra quantos documentos foram enviados e processados, com o texto de que mais documentos melhoram os rascunhos. Não há número mínimo definido (Q-11).
- O usuário pode pular com "Fazer depois". Se a base estiver vazia ao criar uma tarefa (T4), a tela avisa que os itens tendem a ficar sem contexto, mas permite continuar.
- Quando há ao menos um documento pronto, a T1 oferece "Criar primeira RFP".

**F-02 · P0 · Subir documentos para a base** (MoSCoW: Must)

- Dado que o usuário está na T1 ou T2, quando arrasta ou seleciona vários arquivos, então cada arquivo mostra seu próprio status: na fila, processando, pronto ou com erro.
- Formato não aceito: mensagem no próprio arquivo listando os formatos aceitos, sem interromper os demais. Formatos aceitos: .doc, .docx, .xls, .xlsx, .md, .pdf, .ppt, .pptx, .txt, .csv e arquivos do Google (Docs, Planilhas e Apresentações). Os arquivos do Google entram por upload; a conexão direta com o Drive segue fora do MVP (Q-14).
- Arquivo com erro oferece "Tentar novamente". Se o arquivo for enviado para tratamento manual do suporte (PDF escaneado, por exemplo), o status mostra "Em tratamento pelo suporte".
- O usuário pode sair da tela durante o processamento; ao voltar, o status está atualizado.
- Cada arquivo tem o campo "Última atualização" (padrão: data de modificação do arquivo, ou a do upload quando ela não existir) e o campo opcional "Versão". A idade da fonte conta os dias desde a última atualização (Q-03).

**F-03 · P0 · Importar RFPs passadas** (MoSCoW: Must)

- Dado que o usuário está na T2, quando escolhe "Importar RFP passada", então usa o mesmo fluxo de upload, com o tipo "RFP passada" registrado no item.
- Enquanto o Q-04 não estiver decidido, respostas vindas de RFPs importadas aparecem com o rótulo "Histórico importado" e sem nome de aprovador.

**F-04 · P0 · Lista da base com identificador de aging** (MoSCoW: Must)

- A T2 lista nome, tipo, data da última atualização, idade, status de processamento e quem subiu.
- A idade aparece em texto, em dias desde a última atualização; documentos com mais de 120 dias sem atualização levam o rótulo "Mais de 120 dias" com ícone.
- A lista ordena por idade, nome e data de upload.
- Estado vazio: ilustração sóbria, uma frase e o botão "Subir documentos".

**F-05 · P1 · Personalizar o prazo de aging** por RFP ou empresa (MoSCoW: Should). O padrão é 120 dias sem atualização (Q-03); a tela mostra qual prazo está valendo.

**F-06 · P1 · Arquivar ou excluir documento da base** (proposta deste PRD, fora do MoSCoW). Documentos obsoletos precisam sair do uso sem apagar o histórico das respostas já aprovadas; confirmação obrigatória e mensagem clara sobre esse efeito.

**F-07 · P2 · Classificar a base por disciplina** e mostrar a completude por área, como segurança, produto, legal e engenharia (MoSCoW: Could). O layout da T1 e da T2 deve deixar espaço para essa visão.

**F-08 · P2 · Aviso de normas ou legislações desatualizadas** nos documentos da base (MoSCoW: Could).

## 8. Requisitos B: nova RFP/RFI, tarefas e completude (T3, T4, T5)

Cada RFP ou RFI vira uma tarefa com quatro dados sempre visíveis: quantidade de itens, % de completude, prazo e responsável. É esse painel que substitui a cobrança por Slack, a dor emocional mais citada pelo Bid Manager no discovery.

**F-09 · P0 · Criar tarefa importando as perguntas** (T4; MoSCoW: Must, importação de listas de perguntas)

- Dado que o usuário está na T4, quando sobe uma planilha ou documento de perguntas, então informa nome, empresa, tipo (RFP ou RFI), **prazo de submissão** e **responsável**, todos obrigatórios.
- Nome vem preenchido com o nome do arquivo e pode ser editado.
- Prazo no passado gera erro no campo; responsável é escolhido entre os usuários da empresa.
- Depois do processamento, a tela mostra "Identificamos N perguntas" antes de abrir a revisão.
- Formatos aceitos: os mesmos da base (F-02), incluindo planilhas, apresentações e arquivos do Google (Q-02).

**F-10 · P0 · Painel de tarefas** (T3; MoSCoW: Must, gestão de tarefas)

- A T3 lista nome, empresa, tipo, quantidade de itens, % de completude, prazo, responsável e status de processamento.
- Prazo e responsável podem ser editados na própria linha ou na T5.
- Clicar em uma tarefa abre a T5.
- Estado vazio: uma frase e o botão "Nova RFP/RFI".

**F-11 · P0 · Visão de completude** (T5; MoSCoW: Must)

- A T5 mostra uma barra segmentada com itens sem contexto, sugeridos, revisados e aprovados, com a contagem de cada um em texto.
- O percentual principal é o de itens **aprovados** sobre o total; o secundário é o de itens com sugestão. Essa definição de "completude" é uma decisão deste PRD.
- A T5 mostra quantos itens têm alerta pendente e permite filtrar por estado e por "com alerta pendente".
- Cada linha traz o ID do item em fonte mono (por exemplo, `REQ-084/210`), a pergunta resumida e o estado.
- Clicar em uma linha abre a T6 naquele item.

**F-12 · P0 · Status de processamento** (T4, T5)

- Dado que a tarefa está sendo processada, quando o usuário abre a T3 ou a T5, então vê o estado (na fila, processando, pronto ou falha) e, se disponível, quantos itens já foram processados.
- O usuário pode sair da tela; ao terminar, aparece uma notificação dentro do produto.
- Em falha: mensagem em linguagem simples, "Tentar de novo" e um contato de suporte. Nenhum código técnico na tela.

**F-13 · P1 · Prazo restante e alertas de prazo** (MoSCoW: Should). A T3 e a T5 mostram "faltam N dias", "vence hoje" ou "atrasada" em texto com ícone, e um banner interno avisa das tarefas próximas do prazo. A antecedência do aviso é uma decisão de design.

**F-14 · P1 · Busca e filtros avançados** (MoSCoW: Should). Filtrar tarefas por empresa, prazo, responsável e estado; buscar por nome.

**F-15 · P1 · Corrigir a lista de perguntas identificadas** (proposta deste PRD, fora do MoSCoW). Adicionar, remover ou juntar itens antes de revisar, mantendo o texto original visível. Sem isso, uma extração errada trava o revisor; o risco deve ser conferido no piloto.

**F-16 · P2 · Painel de ROI para o comprador** (proposta deste PRD): horas economizadas, taxa de aceitação e tempo de ciclo, atendendo a persona da COO. O canvas prevê esses cálculos, mas o MoSCoW não os lista.

**F-17 · P2 · Análise do edital e indicador de aderência** da proposta ao pedido, com validação de requisitos (MoSCoW: Could).

## 9. Requisitos C: tela de revisão, fontes e edição (T6, T7)

A T6 é onde o produto entrega ou perde a confiança do revisor. Ela combina o split view do canvas com o que o discovery mais pediu: clicar e cair no trecho exato do documento original.

**Estados de um item** (usados em todas as telas): *Sem rascunho*, *Sugerida*, *Em revisão*, *Revisada* e *Aprovada*. O diagrama na seção 6 mostra as transições.

**F-18 · P0 · Split view** (MoSCoW: Must, visualização lado a lado)

- Coluna esquerda: lista de itens com ID em fonte mono, pergunta resumida, estado em texto com ícone e indicador de alerta pendente. Coluna direita: pergunta completa, resposta, alertas, fontes e ações do item.
- Selecionar um item na lista atualiza a coluna direita sem recarregar a página nem perder o texto não salvo do item anterior.
- Existem "Item anterior" e "Próximo item", com atalho de teclado documentado na própria tela.
- A lista da esquerda filtra por estado e por "com alerta pendente".

**F-19 · P0 · Fonte rastreável com deep-link** (MoSCoW: Must, rastreabilidade da fonte)

- Cada resposta traz marcadores numerados por parágrafo, e cada marcador leva à fonte correspondente no painel de fontes.
- Cada fonte mostra nome do documento, página ou trecho, tipo (documento ou RFP passada) e idade em texto.
- Dado que o revisor clica em uma fonte, então a T7 abre sobre a revisão, no trecho exato, com o trecho destacado. Ao fechar, o usuário volta ao mesmo item, à mesma posição e com o texto do editor intacto.
- Se o documento não estiver mais disponível, a T7 informa isso e mantém visíveis o nome e a página registrados.
- Um item sem fonte só pode ser revisado ou aprovado se a resposta foi escrita à mão. Isso gera o alerta "Resposta manual, sem fonte na base", que precisa ser reconhecido como os demais (seção 6) e mostra o autor da resposta (Q-09).

**F-20 · P0 · Edição da resposta** (MoSCoW: Must)

- O editor aceita formatação básica (negrito, itálico e listas) e salva sozinho, mostrando "Salvo há N segundos".
- Um texto alterado ganha o rótulo "Editado" e os botões "Ver sugestão original" e "Restaurar sugestão".
- Editar um item aprovado o devolve para "Em revisão" e avisa isso antes de confirmar a edição.

**F-21 · P0 · Alertas reconhecíveis** (regra da seção 6)

- Dado um item com alerta pendente, quando o usuário tenta marcar como revisado ou aprovar, então o botão está desabilitado e o texto ao lado diz qual alerta falta tratar; usuários de teclado e leitor de tela recebem o mesmo texto.
- Quando o usuário clica em "Reconhecer alerta", então o alerta passa a mostrar "Reconhecido por \[nome\], \[data e hora\]".
- Em fontes conflitantes, o reconhecimento só acontece pela escolha da fonte ou pela opção "nenhuma, vou escrever".

**F-22 · P0 · Portões de validação: revisar e aprovar** (MoSCoW: Must)

- "Marcar como revisado" está disponível para os dois papéis. "Aprovar" está disponível só para o Aprovador; para o Revisor aparece desabilitado com o texto "Somente Aprovadores aprovam".
- O Aprovador pode aprovar direto, sem passar por "Revisada".
- Ao aprovar, o item mostra "Aprovado por \[nome\] · \[data\]" ao lado do texto, e o foco vai para o próximo item ainda não aprovado.
- Não existe ação em lote para aprovar.

**F-23 · P0 · Feedback por resposta** com polegar para cima ou para baixo e campo de justificativa (canvas, slide 7; não está no MoSCoW). Alimenta a meta de aprovação positiva acima de 80% e, com o motivo "fonte incorreta", a taxa de aceitação das fontes que o piloto precisa medir; por isso sobe para P0.

**F-24 · P1 · Aviso de reescrita em excesso** (canvas, slide 7). Se o usuário reescrever mais de 50% das respostas em sequência, a tela pergunta o que está errado, em vez de deixá-lo perder tempo com uma base mal configurada.

**F-25 · P2 · Atribuir itens a especialistas** dentro da tarefa (proposta deste PRD). É a alavanca mais direta para reduzir a cobrança por chat, que o test card mede, mas o MoSCoW só prevê um responsável por tarefa.

## 10. Requisitos D: aprovação, exportação e histórico (T8, T9)

O documento só sai da plataforma depois que todos os itens foram aprovados por uma pessoa, e cada aprovação fica registrada com nome e data. A interface oferece "exportar" e nunca "enviar".

**F-26 · P0 · Exportação bloqueada até 100% aprovado** (T8; canvas e MoSCoW: Must)

- Dado que existe ao menos um item que não está aprovado, ou um alerta pendente, quando o Aprovador abre a T8, então o botão "Exportar" está desabilitado e a tela mostra "X de N itens aprovados" e a lista dos pendentes, cada um com link direto para a T6.
- Dado que 100% dos itens estão aprovados e sem alerta pendente, então "Exportar" fica habilitado só para o Aprovador; o Revisor vê o texto "Somente Aprovadores exportam".
- O arquivo exportado traz, para cada item e na ordem da lista original: a pergunta original, o ID do item, a resposta aprovada (texto final, com as edições do revisor; ver Q-15) e a lista de fontes e evidências usadas. Itens com resposta manual mostram "Resposta manual, sem fonte na base" no lugar das fontes (Q-10). Formato e modelo de layout seguem em aberto (Q-10).
- Depois de exportar, a tarefa passa a "Exportada", com data e nome de quem exportou, e o arquivo pode ser baixado de novo.
- Não existe botão para enviar a proposta ao cliente.

**F-27 · P0 · Histórico de respostas aprovadas** (T9; MoSCoW: Must)

- A T9 lista cada resposta aprovada com pergunta, trecho da resposta, aprovador, data de aprovação, tarefa de origem e idade em texto, da mais recente para a mais antiga.
- Abrir uma linha mostra a resposta completa e as fontes que a sustentaram, com o mesmo deep-link da T7.
- Estado vazio: uma frase explicando que as respostas aprovadas aparecem aqui.

**F-28 · P1 · Auditoria detalhada** (MoSCoW: Should). Linha do tempo somente leitura por item e por tarefa, com cada edição, reconhecimento de alerta, revisão e aprovação, sempre com nome e horário.

**F-29 · P1 · Validade de 120 dias das respostas aprovadas** (MoSCoW: Should). Na T9, respostas aprovadas há mais de 120 dias levam o rótulo "Vencida" e a ação "Reaprovar", disponível ao Aprovador. Quando uma resposta vencida é usada como fonte em outra tarefa, ela dispara o alerta de fonte antiga da seção 6.

**F-30 · P1 · Busca e filtros no histórico:** por texto, tarefa, aprovador e período (MoSCoW: Should, filtros avançados).

**F-31 · P2 · Painel de auditoria para Segurança e Jurídico** com o registro de indexação e exclusão de documentos (proposta do PRD anterior, ausente do MoSCoW). Depende de dados que o front só exibe.

## 11. Estados da interface e microcopy

Toda tela precisa de estado vazio, de carregamento e de erro, e o texto deles segue a voz da marca: direta, sem exclamação, sem emoji e sem a IA falando em primeira pessoa. O texto abaixo é a proposta de partida para design e conteúdo.

| Situação | Tela | Texto na interface | Ação disponível |
| --- | --- | --- | --- |
| Base vazia | T2 | "Sua base ainda não tem documentos. Suba propostas anteriores e documentos técnicos para gerar rascunhos." | Subir documentos |
| Nenhuma tarefa | T3 | "Nenhuma RFP ou RFI em andamento." | Nova RFP/RFI |
| Processando | T3, T5 | "Processando: 42 de 180 perguntas." | Sair e voltar depois |
| Falha no processamento | T5 | "Não foi possível processar este arquivo. Tente de novo ou fale com o suporte." | Tentar de novo; contato de suporte |
| Formato não aceito | T1, T2, T4 | "Formato não aceito. Formatos aceitos: \[lista\]." | Escolher outro arquivo |
| Arquivo em tratamento manual | T2, T4 | "Este arquivo precisa de tratamento pelo suporte. Avisaremos aqui quando estiver pronto." | Nenhuma |
| Sem contexto | T6 | "Informação não localizada na base. Preenchimento manual obrigatório." | Escrever a resposta |
| Baixa confiança | T6 | "Baixa confiança. Confira a fonte antes de aprovar." | Reconhecer alerta |
| Fontes conflitantes | T6 | "Duas fontes se contradizem. Escolha qual vale." | Escolher fonte |
| Fonte antiga | T6 | "Fonte sem atualização há \[N\] dias, acima do prazo de 120 dias." | Reconhecer alerta |
| Documento indisponível | T7 | "Este documento não está mais na base. Mostramos o nome e a página registrados." | Fechar |
| Aprovação bloqueada | T6 | "Falta tratar 1 alerta antes de aprovar." | Ir ao alerta |
| Exportação bloqueada | T8 | "12 de 180 itens ainda não foram aprovados." | Ver itens pendentes |
| Editar item aprovado | T6 | "Editar remove a aprovação. O item volta para Em revisão." | Editar e remover aprovação; Cancelar |
| Falha ao salvar | T6 | "Não foi possível salvar. Seu texto continua nesta tela e tentaremos de novo." | Tentar agora |
| Resposta manual sem fonte | T6 | "Resposta escrita à mão, sem fonte na base. Confirme o conteúdo antes de aprovar." | Reconhecer alerta |

**Regras de escrita**

- O aviso de "sem contexto" adota uma única frase em toda a interface. O canvas traz três variações; ver seção 15.
- Datas e horas em formato brasileiro (dd/mm/aaaa, 24 h). Idades em texto, como "142 dias".
- Números de itens sempre com o total ("12 de 180"), nunca só o percentual.
- Mensagens de erro dizem o que aconteceu e o que fazer, sem códigos técnicos.

## 12. Componentes-chave para o design system

Oito componentes concentram quase toda a interface do MVP. O primeiro, o cartão de resposta rastreável, já existe como exemplo na marca e no pitch (`REQ-084/210`, `Security_Whitepaper_v4.pdf · p. 12`, barra de preenchimento) e deve ser o ponto de partida.

| Componente | Onde aparece | Variações e regras |
| --- | --- | --- |
| Cartão de resposta rastreável | T6, T9 | Pergunta, resposta com marcadores por parágrafo, fonte em fonte mono e estado. Variações: padrão, com alerta, sem contexto, aprovado. Sempre mostra os três sinais da marca: conteúdo, conformidade e fonte |
| Chip de estado do item | T5, T6, T9 | Sem rascunho, Sugerida, Em revisão, Revisada, Aprovada. A cor Compliance só aparece em "Aprovada"; todo chip leva ícone e texto |
| Faixa de alerta | T6 | Tipos: baixa confiança, conflito, fonte antiga, termo crítico, sem contexto e resposta manual sem fonte. Todos usam o token danger (vermelho) do design system; o ícone e o rótulo distinguem o tipo. Estados: pendente e reconhecido (com nome e horário). Botão "Reconhecer alerta" dentro da faixa |
| Painel de fontes | T6 | Lista de cartões de fonte com nome, página ou trecho, tipo e idade. Variações: normal, antiga, em conflito (com botão "Usar esta fonte") |
| Chip de idade da fonte | T2, T6, T9 | Idade em texto. Acima de 120 dias sem atualização vira "Mais de 120 dias" com ícone |
| Visualizador de fonte | T7 | Gaveta lateral sobre a revisão, documento na página e trecho exatos, trecho destacado, fechar volta ao ponto anterior |
| Barra de progresso segmentada | T3, T5, T8 | Segmentos: sem contexto, sugeridos, revisados, aprovados. Legenda com contagens em texto |
| Selo de aprovação | T6, T9 | "Aprovado por \[nome\] · \[data\]". Não aparece em itens "Histórico importado" enquanto o Q-04 estiver aberto |

**Regras transversais**

- Todo botão desabilitado mostra ao lado o motivo em texto.
- Todo estado usa ícone e texto além da cor.
- Limão Sinal só como acento sobre Tinta Profunda, nunca como cor de texto sobre fundo claro; ação primária usa Sálvia Tendra.
- Layout em grid de 8 px, com IDs e referências de fonte em IBM Plex Mono.

## 13. Métricas de sucesso e telemetria da interface

O piloto de 30 dias do test card (5 Bid Managers, 10 Sales Engineers, 5 RFPs complexas) é a janela de avaliação. A interface precisa emitir os eventos que permitem medir as metas abaixo sem ler o conteúdo das respostas.

**Indicadores que mudam rápido (dias a semanas)**

| Métrica | Como a interface mede | Meta | Fonte da meta |
| --- | --- | --- | --- |
| Aceitação do texto sugerido | Diferença entre a sugestão e a versão aprovada, por item | ≥ 70% do texto mantido | Canvas |
| Aceitação das fontes | Itens aprovados sem trocar a fonte e sem polegar para baixo com motivo "fonte incorreta" (depende de F-23) | > 80% | PRD anterior, test card |
| Feedback por resposta | Polegar para cima sobre o total de avaliações (F-23) | ≥ 80% positivo | Canvas |
| Tempo de ciclo | Do upload da RFP à exportação, contra a média histórica declarada | −60% no mínimo | Canvas (o PRD anterior dizia −40%; Q-07) |
| Horas de especialista | Tempo ativo em T6 e T7 por usuário, contra a linha de base declarada | −50% por RFP | Test card |
| Time-to-first-value | Da criação da conta ao primeiro rascunho revisável | A definir | Pitch deck (Q-08) |
| Alertas por tarefa e tempo até reconhecer | Contagem e mediana, sem meta | Diagnóstico | Este PRD |

**Indicadores que mudam devagar (meses)**

- **Menos mensagens de cobrança no Slack ou Teams.** Medido por pesquisa com os usuários do piloto, fora do produto. O PRD anterior só fala em "redução significativa"; o número precisa ser definido antes do piloto.
- **Confiança jurídica das propostas enviadas.** Pesquisa pós-piloto, como no test card.
- **Win rate do cliente.** Dado do cliente, fora do produto; acompanhado depois do piloto.

**Eventos de telemetria da interface**

| Evento | Quando dispara | Propriedades principais |
| --- | --- | --- |
| documento\_enviado | Ao subir arquivo para a base | Tipo, formato, resultado |
| tarefa\_criada | Ao confirmar a T4 | Tipo (RFP ou RFI), nº de itens |
| item\_aberto | Ao selecionar um item na T6 | Estado, alertas presentes |
| fonte\_aberta | Ao abrir a T7 | Item, idade da fonte |
| alerta\_reconhecido | Ao reconhecer ou escolher a fonte | Tipo de alerta, tempo desde a exibição |
| resposta\_editada | Ao salvar edição | % do texto alterado (sem o texto) |
| item\_revisado / item\_aprovado | Ao mudar o estado | Papel, tempo no item |
| aprovacao\_removida\_por\_edicao | Ao editar item aprovado | Item |
| feedback\_enviado | Ao usar polegar | Sentido, motivo |
| exportacao\_bloqueada\_vista | Ao abrir a T8 com pendências | Nº de pendências |
| exportacao\_concluida | Ao exportar | Formato, tempo total da tarefa |

**Regra de privacidade:** nenhum evento carrega o texto das perguntas, das respostas ou dos documentos. Os clientes-alvo são Jurídico e Segurança; medir com conteúdo seria motivo de veto.

## 14. Acessibilidade, responsividade e requisitos não funcionais de front

Nenhum dos documentos do projeto define requisitos de acessibilidade ou de dispositivos; o que segue é proposta deste PRD para o design e a engenharia confirmarem. O ponto de partida é uma aplicação web B2B usada em desktop, como pede o canvas.

**Acessibilidade (meta: WCAG 2.2 nível AA)**

- Toda a T6 opera só com teclado: navegar entre itens, abrir e fechar a T7, reconhecer alerta, marcar revisado e aprovar.
- O foco é gerenciado de forma previsível: depois de aprovar, vai para o próximo item pendente; ao fechar a T7, volta ao marcador de fonte que a abriu; ao tentar aprovar com alerta pendente, vai ao primeiro alerta.
- Mudanças de estado (aprovado, alerta reconhecido, salvo) são anunciadas a leitores de tela.
- Nenhum estado depende só de cor (ver seção 12).
- Contraste dos tokens da marca, calculado para este PRD:

| Combinação | Contraste | Leitura |
| --- | --- | --- |
| Sálvia `#6E7268` sobre branco | 4,92:1 | Passa AA para texto normal (mínimo 4,5:1) |
| Sálvia `#6E7268` sobre página N-050 `#F5F6F1` | 4,53:1 | Passa por pouco; evitar Sálvia em texto pequeno sobre N-050 |
| Sálvia `#6E7268` sobre Tinta `#12140F` | 3,77:1 | Não serve para texto normal; só para elementos grandes ou ícones |
| Compliance `#4B5046` sobre branco | 8,28:1 | Passa com folga |
| Meta N-400 `#5D6157` sobre N-050 | 5,84:1 | Passa |
| Limão `#C8F73D` sobre Tinta `#12140F` | 14,86:1 | Passa com folga; uso permitido pela marca |
| Token danger do design system sobre branco e sobre N-050 | A medir | Medir antes de usar em texto; mínimo de 4,5:1 para texto normal |

**Responsividade**

- A T6 em split view é projetada para telas a partir de 1280 px de largura.
- Entre 768 e 1279 px, a T6 troca para duas etapas: lista de itens e, ao selecionar, detalhe do item, com botão de voltar.
- Abaixo de 768 px o MVP oferece só leitura de tarefas, sem aprovar nem exportar. Decisão a confirmar com o design, porque o MoSCoW não menciona mobile.

**Desempenho percebido**

- Uma tarefa com centenas de itens (o PRD anterior cita até 200 perguntas por documento) deve rolar e filtrar sem travar; a lista da T6 usa renderização sob demanda.
- Trocar de item na T6 deve parecer imediato. Meta proposta: menos de 200 ms de resposta da interface, a confirmar com engenharia.
- Nenhuma ação de revisão depende de recarregar a página.

**Suporte e idioma**

- Navegadores: duas últimas versões estáveis de Chrome, Edge, Safari e Firefox.
- Interface em português do Brasil; idioma dos documentos em Q-12.

## 15. Decisões tomadas e conflitos entre documentos

Três decisões do time moldaram este PRD, e os documentos do projeto se contradizem em dez pontos. A tabela mostra o que cada fonte diz e o que este PRD adotou; onde a resolução é provisória, ela aponta para a questão em aberto da seção 16.

**Decisões do time**

- **Perfis de acesso:** dois papéis, Revisor e Aprovador (seção 3).
- **Incerteza:** rascunho visível com alerta que precisa ser reconhecido (seção 6).
- **Uso deste PRD:** handoff para desenvolvimento e design, por isso a ênfase em IDs, critérios de aceite, estados e microcopy.

**Conflitos e resolução**

| Tema | O que os documentos dizem | Resolução adotada |
| --- | --- | --- |
| Condição para exportar | Canvas: 100% dos itens "Revisados ou Aprovados". MoSCoW: "toda resposta deve ser aprovada" | 100% **Aprovados** e sem alerta pendente (F-26) |
| Perfis de acesso | MoSCoW põe RBAC em Could, mas exige aprovador identificado no histórico (Must) | Dois papéis em P0; papel Leitor em P2; aprovação multinível continua Won't |
| Regra dos 90 dias | PRD anterior: fonte com mais de 90 dias exige revalidação (Must). MoSCoW: identificador de aging é Must; nova aprovação de respostas com mais de 90 dias é Should. Canvas fala em "X meses/anos" | Decisão do time: idade sempre visível e alerta reconhecível para fonte com mais de 120 dias sem atualização, em P0. O prazo de 120 dias substitui os 90 dias dos documentos anteriores. Reaprovação de resposta vencida e prazo personalizável seguem em P1 (Q-03, Q-16) |
| O que fazer com baixa confiança | Canvas e PRD anterior mandam parar a geração ou não rascunhar "zona cinzenta". A decisão do time é mostrar rascunho com alerta | Vale a decisão do time, exceto quando não há contexto: aí não existe rascunho. Termos críticos ficam em Q-01. Vale conferir com o Jurídico no piloto, porque contraria o PRD anterior |
| Slack e Teams | PRD anterior: Should. Report estratégico: impacto alto, esforço alto. MoSCoW e pitch: fora do MVP | Fora do MVP; a redução de cobrança vem do painel de tarefas (seção 8) |
| Formatos de arquivo | MoSCoW: Word, Excel e .md para a base. Pitch e canvas: PDF e DOCX | Resolvido: .doc, .docx, .xls, .xlsx, .md, .pdf, .ppt, .pptx, .txt, .csv e arquivos do Google (Q-02) |
| Meta de tempo | PRD anterior: ciclo −40%. Canvas: ciclo −60%. Test card: horas de especialistas −50% | Três metas distintas mantidas (seção 13); a do ciclo fica em Q-07 |
| Aviso de "sem contexto" | Canvas traz três textos diferentes | Uma frase única (seção 11) |
| Público e privado | Estudo de mercado: público como adjacência. Documento de diferenciação: ponte público-privado como visão. Pitch: tecnologia privada | MVP privado; sem fluxos de licitação (seção 2) |
| Horas por RFP | Pitch: mais de 40 horas e 8 pessoas por proposta. Relatório Loopio 2026: média de 33 horas e 9 pessoas | O produto não exibe esses números como fato; usa a linha de base que o cliente declarar |
| Item sem fonte | Pitch: "sem fonte rastreável, o item não é entregável" | Decisão do time: pode ser aprovado se a resposta foi escrita à mão, com alerta reconhecido e autoria registrada (Q-09). Isso contraria a promessa do pitch, que precisa ser ajustada |

## 16. Questões em aberto

Treze questões seguem abertas; duas delas (Q-14 e Q-15) bloqueiam telas específicas e as demais têm uma sugestão inicial para o time seguir enquanto espera a resposta. Cinco questões foram decididas em 29/09/2026 e estão na tabela ao final da seção. Toda a evidência do discovery vem de personas sintéticas, e a Q-13 é o que troca essa premissa por dados de usuários reais.

| ID | Questão | Sugestão inicial | Quem responde | Bloqueia |
| --- | --- | --- | --- | --- |
| Q-01 | Termos críticos (responsabilização civil, multas, garantias): mostrar o rascunho com alerta de nível alto ou bloquear o rascunho e exigir o Jurídico? | Rascunho com alerta de nível alto | Jurídico, Produto | Não |
| Q-04 | Respostas de RFPs passadas importadas contam como aprovadas? Se sim, quem é o aprovador? | Não: rótulo "Histórico importado" e sem aprovador | Produto | Não |
| Q-05 | Quem pode subir documentos, criar tarefas e exportar, e como os papéis são atribuídos no MVP? | Tabela da seção 3; atribuição feita fora da interface | Produto, cliente piloto | Não |
| Q-06 | Qual é a escala tipográfica de produto para tabelas e painéis? (A cor dos alertas já foi decidida: token danger.) | Derivar do design system, com Space Grotesk, IBM Plex Sans e IBM Plex Mono | Design | Não |
| Q-07 | A meta de redução do tempo de ciclo é 40% ou 60%? | Manter 60% e revisar depois do piloto | Produto | Não |
| Q-08 | Qual é a meta de time-to-first-value? | Definir com os primeiros pilotos | Produto, Engenharia | Não |
| Q-10 | Qual formato e modelo de layout tem o arquivo exportado? RFP em planilha exporta em planilha? | Planilha de entrada gera planilha; o resto PDF ou DOCX | Produto, cliente piloto | Não |
| Q-11 | Existe um número mínimo de documentos para liberar a primeira RFP? | Sem mínimo; aviso quando a base for pequena | Produto | Não |
| Q-12 | A interface e os documentos são só em português? O estudo de mercado indica que RFPs privados costumam vir em inglês | Interface em português; aceitar documentos em inglês | Produto | Não |
| Q-13 | O deep-link, o alerta reconhecível e o fluxo Revisor e Aprovador funcionam com usuários reais? | Protótipo de alta fidelidade da T6 e da T7 testado com 5 Sales Engineers e 4 responsáveis por Jurídico ou Segurança (próximos passos do discovery) | Produto, Design | Não bloqueia o início; bloqueia escalar |
| Q-14 | Como entram os arquivos do Google (Docs, Planilhas, Apresentações): upload do arquivo baixado ou importação por link ou Drive? A conexão com o Drive é integração e está em Won't no MoSCoW | Upload do arquivo baixado em formato Office; sem conexão com o Drive no MVP | Produto, Engenharia | Sim: F-02, F-09 |
| Q-15 | A resposta no arquivo exportado é o texto final aprovado, com as edições do revisor, ou a sugestão original da IA? | Texto final aprovado; a sugestão original fica na auditoria (F-28) | Produto | Sim: F-26 |
| Q-16 | O prazo de 120 dias sem atualização vale também para respostas aprovadas reutilizadas (F-29)? | Sim, o mesmo prazo | Produto, Jurídico | Não |

**Decididas em 29/09/2026**

| ID | Decisão | Onde se aplica |
| --- | --- | --- |
| Q-02 | Formatos aceitos: .doc, .docx, .xls, .xlsx, .md, .pdf, .ppt, .pptx, .txt, .csv e arquivos do Google (Docs, Planilhas e Apresentações) | F-02, F-09 |
| Q-03 | Alerta para fontes com mais de 120 dias sem atualização; a idade conta os dias desde a última atualização | Seção 6, F-02, F-04, F-05, F-29 |
| Q-06 (cores) | Os alertas usam o token danger (vermelho) do design system | Seções 4, 6, 12 e 14 |
| Q-09 | Resposta escrita à mão, sem fonte, pode ser aprovada, mas gera um alerta que precisa ser reconhecido | Seção 6, F-19, F-26 |
| Q-10 (conteúdo) | O arquivo exportado traz a lista original de perguntas e itens, o ID de cada item, a resposta e a lista de fontes e evidências usadas | F-26 |

## 17. Fases e cronograma

Nenhum documento do projeto traz data de entrega do front. O que existe é o plano de lançamento em três ondas do canvas e o piloto de 30 dias do test card; as fases abaixo se encaixam nelas e são uma proposta.

1. **Fase 1, piloto fechado (meses 1 a 3, 3 a 5 clientes de médio porte).** Todos os requisitos P0: F-01 a F-04, F-09 a F-12, F-18 a F-23, F-26 e F-27. Ordem de construção sugerida: T6 e T7 primeiro, porque são o produto e a parte mais incerta (UX 6/10 no learning card), depois T2 e T4, T3 e T5, e por fim T8 e T9. **Portão de saída:** metas do piloto de 30 dias atingidas ou revistas (seção 13) e Q-13 respondida.
2. **Fase 2, soft launch (meses 4 a 6, 15 a 20 empresas).** Requisitos P1: F-05, F-06, F-13, F-14, F-15, F-24, F-28, F-29 e F-30. **Portão de saída:** métricas de retenção e de uso semanal definidas e acompanhadas.
3. **Fase 3, lançamento aberto (mês 7 em diante).** Seleção de P2 conforme o que o piloto mostrar (F-07, F-08, F-16, F-17, F-25, F-31) e o roadmap do pitch: integrações com CRM, Google Drive e SharePoint, aprovação em múltiplos níveis, MCP, base pré-carregada de normas, modo assistente e novos setores.

**Dependências antes de começar a Fase 1:** resposta às questões que bloqueiam (Q-14 e Q-15). As decisões sobre formatos, prazo de aging, cor dos alertas, resposta manual e conteúdo da exportação já foram tomadas (seção 16).

**Parking lot** (boas ideias fora do escopo, sem compromisso):

- **Aprovação em lote de itens sem alerta.** Ganha velocidade, mas enfraquece o human-in-the-loop; só testar depois do piloto.
- **Aprovar dentro do Slack ou do Teams**, ideia do PRD anterior, hoje fora do MVP.
- **Auto-preenchimento de planilhas e portais de compras por extensão**, listado como Could no PRD anterior.
- **Abrir itens já prontos enquanto o restante da RFP ainda processa.**
