# PRD Front-end — Tendra.ai (MVP) · v3

Oct 21, 2026 · @Rafael Braga · Substitui a v2 de 12/10/2026 · Atualizado em 22/10/2026 (carga da base pela tela)

**O que mudou na v3.** Define o **pipeline de IA do MVP** (seção 20; diagrama em `docs/mvp-resposta-rfp/product/PIPELINE_IA_MVP.md`) e fecha três decisões que mudam o escopo do front: (1) a **entrada da RFP é só `.xlsx`**; (2) a **base de conhecimento é carregada pela equipe, por comando, a partir de arquivos `.md`**, sem upload pela interface; (3) os limites de qualidade da IA são **80% de relevância e 90% de fidelidade**. Os requisitos afetados (F-01 a F-04, F-09, F-15, Q-02, Q-14) estão marcados abaixo, e o registro completo está no Anexo B. O texto abaixo desta nota descreve a v2 com essas correções aplicadas.

**Atualização de 22/10/2026.** A decisão (2) foi revista: a pessoa **sobe os arquivos `.md` pela tela Base de conhecimento**, com o botão "Subir documentos" abrindo o seletor de arquivos do computador. A carga continua só em `.md`, com as mesmas regras, e o comando de carga segue disponível para quem prefere o terminal. A identidade do documento passou a ser o nome do arquivo. Os pontos afetados (F-01 a F-04, T1, T2, Q-02, seções 19 e 20 e Anexo B) estão marcados com "v3, 22/10".

**O que mudou nesta versão.** A v1 especificava o front antes de ele existir. Esta v2 descreve o front **como está publicado** (repositório `tendra-ai-front`, branch `main`, PRs #1 a #14); a v3 acrescenta o pipeline de IA e as decisões de escopo acima e marca, em cada requisito, o que já está implementado, o que está parcial e o que continua pendente. Ela é a base para o pedido de construção do backend: a seção 16 lista os dados e as ações que o front espera receber e disparar. O registro completo das mudanças está no Anexo A.

**Legenda de status usada nos requisitos**

- **Implementado** — existe no front publicado, com dados de exemplo.
- **Parcial** — existe, mas sem parte do comportamento descrito; o que falta vem indicado.
- **Pendente** — especificado, ainda não construído.
- **Simulado** — existe no front só para a demonstração e deve ser substituído por dado ou regra real do backend.

## 1. Contexto e problema

Este PRD especifica **o front-end do MVP**: o site público da Tendra.ai e o Workspace, a interface em que times de pré-vendas revisam, corrigem e aprovam respostas a RFPs e RFIs, cada uma com fonte rastreável. Bases de dados, APIs, modelos de IA e integrações estão fora do escopo do front; onde a tela depende de um dado, ele aparece como *entrada* que o front recebe (seção 16).

**Problema.** Responder uma RFP mobiliza, em média, 8 pessoas e mais de 40 horas (pitch deck), porque a informação está pulverizada em e-mails, PDFs antigos, propostas anteriores e chats. Especialistas seniores viram "buscadores de arquivos" e o time convive com o risco de enviar resposta desatualizada ou fora de compliance.

**Job to be done (canvas do grupo).** "Quando recebo uma nova RFP complexa com prazo apertado, quero gerar uma primeira versão de respostas técnicas precisas e alinhadas ao compliance da empresa sem ter que procurar arquivos ou escrever tudo do zero, para que eu possa entregar uma proposta comercial de alta qualidade no menor tempo possível e focar no fechamento do negócio."

**Desafio reenquadrado (How Might We).** De "como automatizar o preenchimento de RFPs e RFIs?" para "como eliminar a dependência de busca ativa de informações entre departamentos para que especialistas atuem apenas como revisores finais de propostas?".

**O que o discovery mudou e por que isso define a interface:**

- A hipótese original era velocidade de escrita; a refinada é governança e redução de atrito. O test card aposta que o valor central é reduzir a fricção interdepartamental e o risco jurídico por meio de rastreabilidade total.
- A confiança do revisor vem do deep-link para a fonte, não da qualidade do texto. O learning card manda focar o MVP em "Rastreabilidade Cirúrgica": cada parágrafo mostra a fonte e o selo de quem aprovou.
- A tela de revisão é o produto. O canvas pede painel de revisão item a item, não um chat genérico.
- A confiança do próprio time nesta leitura é desigual: dor 9/10, formato da solução (UX) 6/10, viabilidade técnica 5/10. O ponto mais incerto de UX era como sinalizar dado expirado ou conflitante; a solução construída está na seção 6.

**Limite da evidência.** As personas e as falas citadas vêm de uma sessão de discovery com personas sintéticas. O front publicado é um protótipo navegável com dados de exemplo; a validação com usuários reais segue pendente (Q-13).

## 2. Objetivos e não-objetivos

A interface do MVP precisa provar que o time revisa mais rápido e com mais confiança quando cada resposta chega com a fonte que a sustenta. Os seis objetivos abaixo são resultados, não telas.

| # | Objetivo | Como a interface mede | Meta | Origem |
| --- | --- | --- | --- | --- |
| O1 | Confiança pela fonte | % de respostas cuja fonte é aceita sem busca manual | > 80% (a validar no piloto) | PRD anterior, test card |
| O2 | Menos horas de especialista | Horas de especialistas por RFP contra a linha de base do cliente | −50% no piloto de 30 dias | Test card |
| O3 | Texto sugerido útil | % do texto sugerido mantido sem alteração na versão exportada | ≥ 70% | Canvas, slide 7 |
| O4 | Ciclo mais curto | Tempo do upload da RFP à exportação | −60% no mínimo (Q-07) | Canvas, slide 7 |
| O5 | Nenhum envio sem humano | % de itens exportados com aprovação e alertas reconhecidos | 100% | Canvas, MoSCoW |
| O6 | Primeiro valor rápido | Tempo da criação da conta ao primeiro rascunho revisável (TTFV) | A definir (Q-08) | Pitch deck |

**No escopo do front, além do Workspace (novo na v2):** site público com home, preços e contato, tela de login e a abertura animada entre o login e o Dashboard (seção 7).

**Não-objetivos do MVP**, cada um com o motivo:

- **Chat ou assistente conversacional.** O canvas prioriza produtividade de revisão item a item; "Modo assistente" está em Won't no MoSCoW.
- **Envio automático e auto-aprovação.** O human-in-the-loop é uma trava de segurança, não uma opção. A interface não tem botão de enviar ao cliente.
- **Integrações externas** (CRMs, Google Drive, SharePoint, Slack/Teams, MCP). Estão em Won't no MoSCoW e fora do MVP no pitch. O site cita "Conecte suas fontes" como passo 00; no MVP isso acontece pelo envio de arquivos `.md` na tela Base (F-02), não por conector.
- **Aprovação multinível.** Won't no MoSCoW; o MVP tem um único ponto de aprovação, com dois papéis (seção 3).
- **Base pré-carregada de normas e regulações** (LGPD e similares). Won't no MoSCoW; a base é o que o cliente sobe.
- **Fluxos específicos de licitação pública.** O MVP mira RFPs e RFIs privados de tecnologia. O site, porém, já anuncia um plano "Setor público" e usa o rótulo "RFP & Licitações"; ver conflito na seção 17.

## 3. Usuários e papéis

O MVP tem dois papéis, **Revisor** e **Aprovador**, e um único ponto de aprovação. O papel Leitor e a aprovação multinível ficam fora.

**Áreas do Aprovador (fase N, 04/11/2026; `spec/SPEC_FASE_N.md`).** Cada pergunta da RFP tem uma área (Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico ou Geral), atribuída pela IA no processamento e trocável na Revisão por quem pode aprovar a pergunta. O Aprovador tem uma ou mais áreas, ou **C-Level** (todas). Só um Aprovador da área da pergunta (ou C-Level) a aprova; "Geral", qualquer Aprovador. O **Revisor não tem área**: vê e revisa tudo, na ordem original. O menu do usuário mostra "Aprovador · Jurídico".

**Personas do discovery** (sintéticas; ver limite de evidência na seção 1). Os nomes também são usados como usuários de exemplo no front.

| Persona | Papel no front | Job to be done | O que a interface entrega |
| --- | --- | --- | --- |
| Kadu Mendes, engenheiro de pré-vendas | Revisor | "Quando recebo requisitos repetitivos, quero rascunhos com links diretos para a fonte original, para focar em arquiteturas estratégicas e reduzir meu desgaste mental." | Marcadores de fonte por parágrafo que abrem o trecho exato; revisão item a item com atalhos |
| Marcelo Vieira, Bid Manager | Aprovador e dono da tarefa | "Quando gerencio propostas, quero eliminar a necessidade de cobrar especialistas via Slack, para reduzir a fricção interna e garantir entregas sem erros de última hora." | Dashboard, painel de tarefas com progresso, prazo e responsável, e alertas de prazo no sino |
| "Advogado do Diabo" (Jurídico/CISO) | Aprovador | "Quando a empresa usa IA, quero uma trilha de auditoria imutável, para evitar que alucinações gerem passivos contratuais." | Quem aprovou e revisou, quando, com qual fonte e com quais alertas reconhecidos |
| Beatriz Fontes, COO | Compradora; não usa a revisão | "Quando analiso custos, quero que seniores sejam apenas revisores, para proteger a margem bruta dos projetos." | KPIs do Dashboard (parcial); painel de ROI segue em P2 (F-16) |

O mapeamento persona-papel é uma sugestão de partida; quem recebe cada papel é decisão do cliente (Q-05).

**Ciclo de vida da tarefa (fase O, 05/11/2026; `spec/SPEC_FASE_O.md`).** O menu Tarefas tem três listas: **Em andamento** (processando, em revisão, pronta, vencida, com falha), **Finalizadas** (100% aprovadas, baixadas e finalizadas pelo box da Exportação) e **Arquivadas** (que a empresa desistiu de concluir, mantidas como histórico). Finalizada e arquivada abrem só para leitura, com quem e quando; a arquivada pode ser reativada ou excluída, a finalizada não. Os contadores de trabalho em andamento (menu, Revisão, Dashboard e sino) não contam as encerradas. Na Exportação, as prontas vêm primeiro e as encerradas por último, com filtro por status e busca por empresa ou título. Na Base, as regras do `.md` ficam no painel "Dica", e os dados de cada documento, em "Ver detalhes".

**Identidade no Workspace (novo na v2).** O nome do usuário logado aparece na barra superior. Clicar nele abre um menu com o **perfil** (Revisor ou Aprovador). O botão **"Trocar usuário"** desse menu alterna entre Kadu Mendes (Revisor) e Marcelo Vieira (Aprovador) — **Simulado**, existe só para demonstrar as permissões dos dois papéis. No produto real, o papel vem da sessão autenticada (seção 16).

**O que cada papel pode fazer** (como o front aplica hoje):

| Ação | Revisor | Aprovador | Status no front |
| --- | --- | --- | --- |
| Subir documentos e RFPs passadas para a base | Sim | Sim | Implementado |
| Ativar ou desativar documento da base | Sim | Sim | Implementado (Q-05) |
| Criar tarefa de RFP/RFI e importar perguntas | Sim | Sim | Implementado |
| Ver rascunhos, fontes e alertas | Sim | Sim | Implementado |
| Editar a resposta sugerida | Sim | Sim | Implementado |
| Reconhecer um alerta (registrado com nome e horário) | Sim | Sim | Implementado |
| Marcar item como "Revisado" | Sim | Sim | Implementado |
| **Aprovar item** | Não | Só da sua área (ou C-Level; "Geral", todos) | Implementado; para o Revisor o botão "Aprovar resposta" não aparece (26/10/2026). Fora da área, o botão fica desabilitado com "Só a área X ou C-Level aprova esta resposta." e a rota recusa com 403 (fase N, 04/11/2026) |
| Trocar a área de uma pergunta | Não | Quem pode aprová-la, antes de aprovada | Implementado (fase N, 04/11/2026); a troca fica no histórico |
| **Exportar o documento final** | Só da tarefa pronta | Sim | Implementado; o Revisor baixa a planilha preenchida só da tarefa "Pronta" (100% aprovada, sem alerta pendente); nas demais o botão fica desabilitado (26/10/2026). O download fica só na Exportação (fase O, 05/11/2026) |
| Finalizar a tarefa pronta | Sim | Sim | Implementado (fase O, 05/11/2026): pelo box que abre depois de baixar a tarefa pronta na Exportação; vai para Finalizadas, só para leitura |
| Arquivar, reativar e excluir arquivada | Não | Sim | Implementado (fase O, 05/11/2026): arquivar em Tarefas · Em andamento; reativar nos detalhes da arquivada; a finalizada não é excluída |
| Ver histórico de aprovações e revisões | Sim | Sim | Implementado |

As linhas de subir documentos, ativar/desativar, criar tarefa e exportar seguem como suposições deste PRD (Q-05).

## 4. Princípios de UX e sistema visual

A interface segue seis princípios, todos derivados do discovery, e usa o design system da Tendra.ai que vive no próprio repositório do front (`src/ds`, com tokens, componentes e documentação). Quando um requisito entrar em conflito com estes princípios, os princípios ganham.

**Princípios de produto**

1. **Fonte antes de texto.** Toda resposta mostra de onde veio antes de pedir aprovação. Sem fonte, o item só sai como resposta manual, com a autoria registrada e sinalizada na tela (seção 6).
2. **A revisão é o produto.** Painel item a item em split view (itens à esquerda; resposta, alertas, fontes e ações à direita), nunca um chat.
3. **Incerteza é explícita.** A tela nunca preenche uma lacuna com texto plausível. Baixa confiança, conflito, fonte antiga e termo crítico têm sinal próprio e exigem reconhecimento; a resposta manual tem sinal próprio (etiqueta, autor e o quadro "Resposta sem fonte"), sem reconhecimento (26/10/2026; quadro desde 30/10/2026).
4. **Aprovação é humana e identificada.** Cada resposta aprovada mostra quem aprovou e quando. Não existe caminho de envio ou aprovação automática.
5. **Revisar rápido, editar pouco.** O caminho feliz é conferir a fonte e aprovar em poucos cliques; o editor existe para ajustes.
6. **Sóbrio.** Swiss design, grid rigoroso, zero ornamento decorativo.

**Tokens visuais** (como aplicados no front; valores em `src/ds/tokens`):

| Token | Valor | Uso no front |
| --- | --- | --- |
| Tinta Profunda | `#12140F` | Ação primária (botão preenchido), títulos, barra superior, seções escuras |
| Sálvia Tendra | `#6E7268` | Foco (anel de foco), rótulos de seção, ícones de apoio, símbolo |
| Limão Sinal | `#C8F73D` | Só como preenchimento: marcador de destaque, selo de aprovado, trecho destacado na fonte, série de dados "Aprovada". Como cor de texto, apenas sobre Tinta |
| Compliance (state-ink) | `#4B5046` | Texto de estado validado (selo "Aprovada") |
| Danger | `#A8402E` | Alertas, erros, prazo vencido ou próximo |
| N-000 / N-050 | `#FFFFFF` / `#F5F6F1` | Card / página |
| N-200 / N-400 / N-700 | `#E3E6DC` / `#5D6157` / `#3E4238` | Bordas / meta / corpo |

- **Mudança da v1:** a v1 previa Sálvia como cor da ação primária; no front a ação primária é **Tinta**, e Sálvia ficou com foco, marca e apoio.
- **Cores de gráficos:** paleta de dataviz própria (`tokens/dataviz.css`: petróleo, âmbar, ameixa, terracota, ardósia e limão), validada para daltonismo. Tinta e Sálvia nunca preenchem série. A cor acompanha o estado, não a posição.
- **Tipografia:** Space Grotesk para títulos e números; IBM Plex Sans para corpo e interface; IBM Plex Mono para IDs de requisito, nomes de arquivo, datas e contagens (por exemplo, `REQ-004/012` e `Security_Whitepaper_v4.pdf · p. 12`).
- **Marca:** escrever sempre "Tendra.ai", nunca em caixa alta. No texto corrido, "a Tendra.ai". O logo animado (`AnimatedLogo`) é usado no cabeçalho do site e na abertura do Workspace.
- **Padrão de filtro (novo na v2):** listas e tabelas filtram sempre com o componente `FilterMenu`: botão "Todos" fixo + botão "Filtrar" com menu suspenso das demais visões, cada uma com a quantidade de itens. Abas não filtram; seletor fica para ordenação.
- **Estado nunca depende só de cor:** todo estado leva ícone e rótulo em texto. Desde 05/11/2026 a cor segue a severidade: vermelho (`--danger`) só para bloqueio ou erro (termo crítico, conflito, sem contexto, falha, prazo vencido); âmbar (`--warning`) para aviso (baixa confiança, fonte antiga, documento com mais de 120 dias, prazo perto, base desatualizada); limão para boa notícia (processamento concluído, tarefa 100% aprovada). O ícone e o rótulo continuam distinguindo os tipos.

## 5. Mapa de telas e jornada

O front tem duas áreas: o **site público** e o **Workspace** (área logada). A tela de revisão (T6) continua concentrando o valor do produto.

| # | Tela | Para que serve | Papéis | Prioridade | Status |
| --- | --- | --- | --- | --- | --- |
| S1 | Site · Home | Apresentar o produto e levar ao contato | Público | P0 | Implementado |
| S2 | Site · Preços | Planos sob consulta | Público | P1 | Implementado |
| S3 | Site · Contato | Formulário de pedido de demonstração | Público | P0 | Implementado (envio simulado) |
| L1 | Login | Entrar no Workspace | Público | P0 | Implementado (autenticação simulada) |
| L2 | Abertura | Logo animado entre o login e o Dashboard | Ambos | P2 | Implementado |
| D1 | Dashboard | Visão geral do uso: KPIs, tarefas por status, concluídas por mês, prazos próximos | Ambos | P1 | Implementado (dados reais com o servidor desde 24/10/2026; exemplos sem ele) |
| T1 | Primeiros passos (antes "Onboarding") | Guiar a empresa pelos primeiros passos; no MVP a base entra pela T2, e a área de envio desta tela segue como protótipo (F-01) | Ambos | P0 | Implementado (envio aqui ainda Simulado) |
| T2 | Base de conhecimento | Subir `.md`, ver, ativar/desativar e avaliar a idade dos documentos e RFPs passadas (v3, 22/10: envio pela tela ligado ao backend) | Ambos | P0 | Implementado, ligado ao backend |
| T3 | Painel de tarefas | Listar RFPs e RFIs com progresso, prazo, responsável e status; alertas de tarefa | Ambos | P0 | Implementado |
| T4 | Nova RFP/RFI | Importar a lista de perguntas (`.xlsx`) e cadastrar a tarefa e a empresa | Ambos | P0 | Implementado |
| T5 | Detalhe da tarefa | Itens, estados, progresso e status de processamento | Ambos | P0 | Implementado |
| T6 | Revisão (split view) | Conferir fonte, tratar alertas, editar, revisar e aprovar item a item | Ambos | P0 | Implementado |
| T7 | Visualizador de fonte | Abrir o documento de origem no trecho exato, sem sair da revisão | Ambos | P0 | Implementado (trecho simulado) |
| T8 | Exportação | Exportar o documento final; bloqueada até 100% aprovado | Aprovador | P0 | Implementado (arquivo simulado) |
| T9 | Histórico | Consultar aprovações e revisões com responsável, data e tarefa de origem | Ambos | P0 | Implementado |

**Casca do Workspace (presente em todas as telas D1 e T1–T9):** barra superior em Tinta com botão de menu, logo, sino de alertas, menu do usuário e "Sair" (F-35 a F-37); menu lateral recolhível (F-36).

**Menu lateral** (grupos e itens, na ordem):

- **Início:** Primeiros passos (acima do Dashboard desde 28/10/2026), Dashboard.
- **Trabalho:** Tarefas (contagem de tarefas), Revisão (contagem dos itens ainda a trabalhar: sem rascunho, sugeridos e em revisão, fora os revisados e aprovados, somando todas as tarefas com itens, como o Dashboard; até 05/11/2026 era só a tarefa aberta, e antes de 26/10/2026 contava os itens com alerta pendente), Exportação, Histórico.
- **Base:** Base de conhecimento (contagem de documentos).
- **Painel de demo** no rodapé: "Aprovar todos os itens" — **Simulado**, não vai para produção.

**Jornada.** (0) A pessoa conhece o produto no site e entra pelo login. (1) A abertura leva ao Dashboard. (2) Na primeira vez, sobe documentos em Primeiros passos. (3) Cria a tarefa importando as perguntas da RFP e cadastrando a empresa. (4) Acompanha o processamento. (5) Revisa item a item, com fonte e alertas. (6) O Aprovador aprova cada item. (7) Exporta quando 100% está aprovado. (8) As aprovações e revisões passam a fazer parte do histórico consultável. O único laço de volta continua saindo da conferência de 100%: enquanto houver item pendente, a exportação não abre.

## 6. Regra central de HITL: alertas que precisam ser reconhecidos

**Decisão (mantida da v1, implementada):** quando a IA tem baixa confiança, a fonte está há mais de 120 dias sem atualização, as fontes conflitam, a pergunta envolve termo crítico ou a resposta foi escrita à mão sem fonte, a tela mostra o rascunho junto com um alerta, e o item não pode ser marcado como revisado nem aprovado até que uma pessoa trate esse alerta.

| Tipo (código) | Gatilho (dado que o front recebe) | O que a tela mostra | O que a pessoa faz | Bloqueia revisar/aprovar |
| --- | --- | --- | --- | --- |
| Sem contexto (`nocontext`) | Item chega sem rascunho | Desde 30/10/2026, um só quadro "Resposta sem fonte", sem o cartão no lugar das fontes: o texto "Não encontramos informação na base para esta pergunta. Adicione conhecimento ou escreva a resposta manualmente." e os botões "Editar resposta" e "Adicionar conhecimento" (envia `.md` para a base sem sair do item nem perder o texto em edição; o resultado do envio aparece no próprio quadro). Fora do cartão de alertas desde 26/10/2026 | Escreve a resposta no próprio quadro (gravada no backend desde 24/10/2026; SPEC, cenário 61) ou adiciona conhecimento à base. Ao escrever, o item ganha a etiqueta "Resposta manual"; o quadro continua "Resposta sem fonte". O documento enviado vale para as próximas gerações; o item atual não é gerado de novo | Sim, até haver resposta escrita |
| Baixa confiança (`lowconf`) | Rascunho marcado como de baixa confiança | "Baixa confiança. Confira a fonte antes de aprovar." | "Reconhecer alerta" | Sim, até reconhecer |
| Fontes conflitantes (`conflict`) | Duas ou mais fontes se contradizem | "Duas fontes se contradizem. Escolha qual vale." e as fontes em conflito marcadas no painel | "Usar esta fonte" em uma delas, ou "Nenhuma, vou escrever" (abre o editor) | Sim, até decidir |
| Fonte antiga (`old`) | Alguma fonte com mais de 120 dias sem atualização | "Fonte sem atualização há [N] dias, acima do prazo de 120 dias." e o selo "Mais de 120 dias" na fonte | "Reconhecer alerta" | Sim, até reconhecer |
| Termo crítico (`critical`) | Pergunta envolve responsabilização civil, multa ou garantia jurídica | "Termo crítico · nível alto" — "Requer validação do Jurídico. A pergunta envolve responsabilização civil, multa ou garantia jurídica." | "Reconhecer alerta"; o Aprovador decide | Sim; regra final em Q-01 |
| Resposta manual sem fonte (`manual`) | Resposta escrita à mão, sem nenhuma fonte associada | Só registro de autoria (26/10/2026): etiqueta "Resposta manual", o rótulo "Resposta manual, sem fonte na base · escrita por [nome]" e o quadro "Resposta sem fonte" (desde 30/10/2026; antes, o cartão "Sem contexto" no lugar das fontes); não aparece no cartão de alertas | Nenhuma | Não |

**Regras de comportamento (como o front aplica)**

- **Reconhecer registra a pessoa e o horário.** O alerta passa a mostrar "Reconhecido por [nome], [dd/mm/aaaa hh:mm]" e a tela confirma com um aviso.
- **Vários alertas no mesmo item aparecem empilhados** como cartões sobrepostos, com navegação "Alerta 1 de 2" e o marcador "· pendente" em cada um ainda aberto. Todos precisam ser tratados.
- **O cartão abre no primeiro alerta pendente e, ao tratar um, passa sozinho ao próximo pendente** (24/10/2026). Com todos tratados, ele se recolhe num resumo com ícone ("Todos os N alertas tratados · ver histórico"), que abre os alertas reconhecidos como histórico e pode ser recolhido de novo.
- **Não existe "reconhecer todos".** O conflito exige uma escolha, não um clique.
- **Idade da fonte é sempre visível**, com ou sem alerta, em dias desde a última atualização.
- **Estados do item:** *Sem rascunho*, *Sugerida*, *Em revisão*, *Revisada*, *Aprovada*.
- **Transições:**
  - Editar o texto de um item *Sugerida* o leva para *Em revisão*.
  - Escrever num item *Sem rascunho* o leva para *Em revisão* e registra a resposta manual, com o autor, sem alerta a reconhecer.
  - Apagar todo o texto de um item sem fonte o devolve para *Sem rascunho* e volta o alerta de sem contexto.
  - "Marcar como revisado" leva a *Revisada* (com nome e horário); disponível aos dois papéis.
  - "Aprovar resposta" leva a *Aprovada* (com nome e horário); só o Aprovador, direto de *Sugerida*, *Em revisão* ou *Revisada*.
  - Editar um item *Revisada* o devolve para *Em revisão*.
  - Editar um item *Aprovada* pede confirmação ("Editar remove a aprovação. O item volta para Em revisão e o evento fica registrado.") e, confirmado, o devolve para *Em revisão*.
- **Revisar e aprovar exigem resposta escrita e todos os alertas tratados.** O motivo aparece ao lado dos botões desabilitados: "Escreva a resposta antes de revisar ou aprovar.", "Falta tratar [N] alerta(s) antes de aprovar.". Para o Revisor, o botão "Aprovar resposta" não aparece (26/10/2026).
- **Alerta nunca depende só de cor.** Ícone, rótulo em texto e posição fixa acima da resposta.

## 7. Requisitos 0: site público, login e casca do Workspace (novo na v2)

**F-32 · P0 · Site público** — Implementado

- **Cabeçalho** em Tinta, com 64 px de altura, igual ao do Workspace: logo animado (volta para a home), menu **Conheça** (rola até "O produto em ação"), **Funcionalidades** (rola até "Funcionalidades"), **Segurança** (rola até "Segurança e confiança"), **Contato** (página) e **Preços** (página), e o botão **"Entrar"** (abre o login). No celular os links vão para um menu recolhível.
- **Home:**
  - Hero "Responda a um RFP em horas, não semanas." com o botão "Agendar demo" (abre Contato) e um cartão de resposta de exemplo com fonte. O cartão é animado (10/11/2026): responde três requisitos em sequência (pergunta digitada, resposta escrita, fonte, verificação da citação, aprovação); com movimento reduzido fica parado no primeiro.
  - "O produto em ação" (10/11/2026, no lugar de "Como funciona"), em cinco passos: 00 Conecte suas fontes, 01 Importe o questionário, 02 Gere com rastreabilidade, 03 Revise e aprove, 04 Exporte a planilha aprovada. Os passos rolam à esquerda e uma janela do produto, fixa ao lado (no celular, presa no topo), toca a demonstração animada da tela de cada passo, com dados fictícios. A janela cabe inteira na tela; cada texto, do 00 ao 04, sobe esmaecido a partir do terço inferior dela e fica ativo ao chegar a 1/3 do topo (2/3 da altura da janela), onde o último para. Abaixo, "Feito para os times que respondem propostas: Pré-vendas, RevOps, Segurança da informação, Jurídico e compliance".
  - "Funcionalidades" (10/11/2026), depois de "Plataforma AI native": cinco cartões com um fragmento de interface em movimento cada (fonte de cada afirmação, alertas, dashboard, base com validade, revisão de texto com IA).
  - Faixa de números.
  - "Segurança e confiança" com quatro cartões: Isolamento por tenant, Auditoria imutável, Aprovação nominal, Base curada e governada.
  - Chamada para webinar e rodapé.
- **Preços:** três planos, todos "Sob consulta" e com o botão "Falar com vendas": Basic, Enterprise (destacado) e Setor público.
- **Contato:** formulário com Nome, E-mail corporativo, "Que tipo de proposta vocês respondem?" e "Volume por trimestre"; "Enviar pedido" mostra a confirmação "Pedido recebido". **Simulado:** o envio não sai do navegador (Q-23).
- Os números da home e os recursos dos planos são texto de marketing; ver conflitos na seção 17.

**F-33 · P0 · Login** — Implementado (autenticação **Simulada**)

- À esquerda, banner em Tinta: "O seu segundo **cérebro** para responder RFPs e editais." (destaque limão em "cérebro").
- À direita, "Entrar na Tendra.ai": campos **E-mail** e **Senha**, botão **"Entrar no Tendra.ai"** (com estado de carregamento) e o link "Voltar para o site".
- Hoje qualquer valor entra. O backend precisa definir autenticação, erro de credencial e recuperação de senha (Q-19).

**F-34 · P2 · Abertura animada** — Implementado

- Ao entrar, a tela mostra o logo animado no centro, sobre fundo Papel, com a barra superior do Workspace já visível. Ao terminar (cerca de 5 s), abre o Dashboard.
- Clique ou tecla pulam a animação. Com "reduzir movimento" ativado no sistema, a abertura dura menos de 1 s.

**F-35 · P0 · Barra superior do Workspace** — Implementado

- Em Tinta, com 64 px de altura. Da esquerda para a direita: botão de menu (☰), logo (volta ao site), sino de alertas (F-37), menu do usuário e "Sair" (volta à home do site).
- Menu do usuário: o botão mostra o nome. O menu abre com o perfil (Revisor ou Aprovador) e "Trocar usuário" (Simulado, seção 3). Com login, mostra também a organização da pessoa, acima do perfil, e não tem "Trocar usuário" (fase K, 28/10/2026: cada organização, a empresa usuária cliente da Tendra.ai, só vê os próprios dados). Fecha com Esc, clique fora ou após a troca.
- No celular (até 600 px), o botão mostra as iniciais e o "Sair" passa para dentro do menu do usuário.

**F-36 · P1 · Menu lateral recolhível** — Implementado

- No computador, o botão ☰ recolhe o menu lateral a uma barra de 68 px só com ícones e o expande de novo.
- Recolhido, cada ícone mantém o nome como rótulo acessível e dica ao passar o mouse, na mesma posição do menu aberto. O estado se mantém ao trocar de tela.
- Abaixo de 900 px, o ☰ abre o menu por cima do conteúdo.

**F-37 · P1 · Sino de alertas** — Implementado (com o servidor, alertas reais de tarefas e da base desde 24/10/2026; sem ele, Simulados)

- O sino mostra um ponto vermelho enquanto houver alerta não lido; o rótulo acessível diz quantos.
- Ao clicar, abre a lista "Alertas". Cada alerta mostra: ponto de não lido, ícone, tipo e data, empresa e texto, e a ação.
- Clicar num alerta marca como lido, fecha a lista e abre o destino. "Marcar como lidos" limpa todos.
- Os mesmos alertas aparecem no cartão de alertas da tela de Tarefas (F-38). Lido num lugar, some do cartão. A ação do cartão também marca como lido.
- **Só alertas de tarefas e da base de conhecimento.** Os alertas dos itens (baixa confiança, conflito, fonte antiga, termo crítico, resposta manual) ficam na tela de revisão e nunca vão ao sino.
- **Tipos com o servidor (24/10/2026),** calculados no front a partir das tarefas, dos itens e da base:
  - **Falha no processamento:** tarefa em falha, com o motivo;
  - **Prazo vencido** e **Prazo próximo** (vence em até 5 dias), em tarefas ainda não 100% aprovadas;
  - **Processamento concluído:** tarefa pronta com itens para revisar;
  - **Tarefa 100% aprovada:** todos os itens aprovados e nenhum alerta pendente; a planilha preenchida está pronta para baixar;
  - **Arquivos recusados na base** e **Erro no envio da base:** resultado do último envio de documentos;
  - **Base desatualizada:** documentos ativos com mais de 120 dias sem atualização.
- O cartão da tela de Tarefas (F-38) mostra só os alertas de tarefas.
- **Validade, fechar e tratar (26/10/2026):**
  - os avisos **Processamento concluído**, **Tarefa 100% aprovada**, **Arquivos recusados na base** e **Erro no envio da base** somem do sino 5 dias depois de criados, para todas as pessoas;
  - o "X" de cada alerta tira o alerta da lista até o próximo login da pessoa;
  - o botão de ação do alerta leva à tela indicada e tira o alerta da lista de vez, para a pessoa que agiu (também no cartão da tela de Tarefas);
  - com muitos alertas, a lista do sino rola dentro do painel.
- O cartão de alertas da tela de Tarefas pode ser recolhido num resumo ("N alertas recolhidos · mostrar"), no formato dos alertas tratados da revisão; a escolha fica guardada no navegador.
- O estado de leitura, de fechado e de tratado fica guardado no navegador, por pessoa; guardar no backend, para valer em qualquer computador, continua pendente (Q-20).
- Sem o servidor, continuam os alertas de exemplo: **Falha no carregamento**, **Reprocessamento**, **Prazo vencido** e **Prazo próximo**.

## 8. Requisitos A: primeiros passos e base de conhecimento (T1, T2)

**F-01 · P0 · Primeiros passos** (antes "Onboarding no primeiro uso"; MoSCoW: Must) — Parcial

> **v3, 22/10:** no MVP a base entra pela T2 ("Subir documentos", F-02). O passo 1 e a área de envio desta tela ainda são protótipo, sem ligação com o backend; ligá-los à mesma rota é a etapa C4 do plano. "Criar primeira RFP" passa a depender de haver ao menos um documento ativo na base.

- **Cabeçalho:** "Primeiro uso · Banco de conhecimento", o título "Suba os documentos que sustentam suas respostas" e um texto de apoio.
- **Três passos, um por vez (28/10/2026):**
  1. Subir documentos ("N documentos na base · N ativos" ou "Nenhum documento na base"). Concluído com ao menos um documento ativo na base.
  2. Criar a primeira RFP. Concluído com ao menos uma tarefa criada na organização.
  3. Revisar e aprovar. Concluído com ao menos um item revisado ou aprovado.

  Os títulos dos passos navegam entre eles, sem aparência de botão. Um passo só abre depois que o anterior é concluído, e o passo concluído ganha a linha e a marca de "concluído" em limão. A tela abre no primeiro passo ainda não concluído. Ao concluir um passo, ela segue sozinha para o seguinte: por exemplo, quando o primeiro documento entra na base, o passo 1 fica concluído e a tela passa ao passo 2.
- **Conteúdo de cada passo:**
  - **Passo 1:** área de envio, resultado do envio, lista de documentos e cartão de dicas.
  - **Passo 2:** a instrução e os botões "Criar primeira RFP" e "Fazer depois". Os botões só aparecem neste passo.
  - **Passo 3:** só a instrução de revisar e aprovar.

  Num passo já concluído, um aviso limão diz o que foi feito.
- Área de envio com arrastar e soltar, "Subir documentos" e "Usar arquivos de exemplo" (Simulado). Abaixo, a lista do que foi enviado nesta tela, com o estado de cada arquivo (F-02).
- **"Criar primeira RFP"** abre a Nova RFP; ao lado, "Fazer depois" leva ao painel de tarefas.
- Cartão "O que costuma dar mais contexto": whitepaper e políticas de segurança; RFPs e RFIs já respondidas; contrato padrão e anexos de SLA; certificados e relatórios de auditoria. Mais o texto "Não há número mínimo de documentos…".
- **Primeiro acesso (28/10/2026):** enquanto a base da organização não tem nenhum documento, o login leva a Primeiros passos, e não ao Dashboard. No menu lateral, "Primeiros passos" ganha o estilo do botão "Revisar com IA": fundo em gradiente limão em movimento, selecionado ou não, parado com movimento reduzido. Com o primeiro documento, o login volta a abrir no Dashboard e o item volta ao estilo normal do menu.

**F-02 · P0 · Subir documentos para a base** (MoSCoW: Must) — **Implementado e ligado ao backend na T2, só para `.md` (v3, 22/10)**

> **Decisão da v3, revista em 22/10/2026:** a equipe escreve um arquivo `.md` por documento, com cabeçalho (título, tipo, data de atualização e versão opcional; formato em `docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`). Na T2, "Subir documentos" abre o seletor de arquivos do computador, que aceita vários `.md` de uma vez (até 10 MB por envio). O backend valida cada arquivo, grava os blocos no banco (seção 20) e devolve o resultado, que a tela mostra no quadro **"Resultado do envio"**: Carregados, Atualizados, Sem mudança, Recusados (com o motivo), Ignorados (outros formatos, "formato não aceito nesta versão") e Avisos. Enviar de novo um arquivo com o mesmo nome atualiza o documento e mantém o estado ativo ou inativo. Sem o servidor da base, a T2 avisa que está desconectada e mostra a lista de exemplo. O comando de carga faz a mesma coisa a partir de uma pasta. Múltiplos formatos e os estados de processamento por arquivo (Na fila, Processando, Erro, Em tratamento pelo suporte) voltam na Fase 2, com a conversão; o texto abaixo descreve o comportamento do protótipo, mantido para essa fase.

- Vários arquivos por vez. Cada um mostra o próprio estado, com ícone e rótulo:
  - **Na fila**;
  - **Processando**, com barra de progresso;
  - **Pronto**, com "Pronto · [tipo] · última atualização [data]";
  - **Erro**: "Falha ao processar. Tente novamente.", com o botão "Tentar novamente";
  - **Em tratamento pelo suporte**: "Este arquivo precisa de tratamento pelo suporte. Avisaremos aqui quando estiver pronto.";
  - **Formato não aceito / Não enviado**: "Formato não aceito. Formatos aceitos: [lista]."
- Formatos aceitos no front: .doc, .docx, .xls, .xlsx, .md, .pdf, .ppt, .pptx, .txt, .csv e arquivos do Google baixados (Docs, Planilhas e Apresentações). Um arquivo recusado não interrompe os demais. **No MVP (v3), o único formato carregado é `.md`, pela T2 ou pelo comando.**
- O usuário pode sair da tela durante o processamento; ao voltar, o estado está atualizado.
- Cada documento tem "Última atualização" (padrão no front: data de modificação do arquivo) e "Versão" opcional. A idade conta os dias desde a última atualização. **No MVP (v3), a data vem do campo obrigatório `atualizado_em` do cabeçalho do `.md`, sem alternativa pela data do arquivo.**

**F-03 · P0 · Importar RFPs passadas** (MoSCoW: Must) — Implementado no front. **No MVP (v3):** a RFP passada entra na base como um `.md` com o tipo "RFP passada" no cabeçalho (`tipo: rfp-passada`).

- Na T2, a RFP passada entra pelo mesmo botão "Subir documentos": o tipo vem do cabeçalho de cada arquivo. O botão separado "Importar RFP passada" saiu em 24/10/2026, porque fazia exatamente o mesmo.
- No Histórico, respostas vindas de RFPs importadas aparecem com o selo "Histórico importado" e sem aprovador (Q-04).

**F-04 · P0 · Lista da base com aging** (MoSCoW: Must) — Parcial

- **Cabeçalho:** "[N] documentos na base" e "Prazo de aging em vigor: 120 dias sem atualização.". Ao lado, o seletor de ordenação ("Ordenar por idade", "por nome", "por envio" e, desde 28/10/2026, "por status": ativos, em processamento, com problema, inativos e, por último, vencidos) e o botão "Subir documentos" (o único desde 24/10/2026).
- Abaixo do cabeçalho, a orientação "Aceita arquivos .md com o cabeçalho de título, tipo e data de atualização, até 10 MB por envio. O tipo de cada arquivo (documento ou RFP passada) vem do cabeçalho. Enviar de novo um arquivo com o mesmo nome atualiza o documento." (v3, 22/10; frase do tipo em 24/10)
- **Colunas da tabela:**
  - Documento: o título do cabeçalho, com a versão ou "Sem versão" e o nome do arquivo abaixo;
  - Tipo (Documento ou RFP passada);
  - Atualizado (data);
  - Validade (28/10/2026): a data do campo `validade` do cabeçalho, ou "Indefinido" sem ele. A data fica em vermelho quando vencida;
  - Idade ("N dias" ou "hoje"; acima de 120 dias, também o selo "Mais de 120 dias");
  - Status;
  - Enviado por;
  - Ações: "Tentar novamente" quando houver erro, e a chave Ativar/Desativar. No documento vencido, a chave fica desligada e bloqueada.
- **Documento vencido (28/10/2026):** a partir da data da validade, inclusive, o documento fica inativo, com o status "Vencido" (selo vermelho com calendário), e não vai para a geração. A chave não o reativa. Só uma nova versão do arquivo, com validade futura, volta a valer.
- No celular, cada documento vira um cartão com as mesmas informações.
- **Estado vazio** (v3, 22/10): com o servidor conectado e nenhum documento, "Base vazia", "Sua base ainda não tem documentos. Suba propostas anteriores e documentos técnicos para gerar rascunhos." e o botão "Subir documentos". Desde 28/10/2026, a base vazia mostra só esse botão, no centro. A ordenação e o "Subir documentos" do canto superior voltam com o primeiro documento.

**F-05 · P1 · Personalizar o prazo de aging** por RFP ou empresa (MoSCoW: Should) — Pendente. A T2 já mostra o prazo em vigor (120 dias).

**F-06 · P1 · Desativar documento da base** (antes "Arquivar ou excluir") — Implementado (desativar); excluir Pendente

- A chave Ativar/Desativar tira o documento do uso sem apagar nada. Ao desativar, o status vira "Inativo" e a tela avisa "[documento] não será usado em novas respostas."; ao reativar, "[documento] voltou a ser usado nas respostas.".
- As respostas já aprovadas não mudam. Exclusão definitiva segue pendente (Q-21).

**F-07 · P2 · Classificar a base por disciplina** (MoSCoW: Could) — Pendente.

**F-08 · P2 · Aviso de normas ou legislações desatualizadas** (MoSCoW: Could) — Pendente.

## 9. Requisitos B: dashboard, tarefas, nova RFP e completude (D1, T3, T4, T5)

**F-39 · P1 · Dashboard** (novo na v2; tela inicial após o login) — Implementado com dados reais (24/10/2026); sem o servidor, mostra os exemplos

- **Cabeçalho:** "Dashboard · todas as tarefas" (com o servidor; sem ele, "Dashboard · últimos 90 dias"), o título "Visão geral do uso" e o botão "Nova RFP/RFI".
- **RFP concluída** é a tarefa com status "Pronta": todos os itens aprovados e nenhum alerta pendente. Ela termina na última aprovação.
- **Quatro indicadores:**
  - RFPs e RFIs trabalhadas ("N em andamento · N concluídas");
  - Itens em aberto ("Em N tarefas ativas, entre revisão e processamento.");
  - Tempo médio por RFP: média, nas RFPs concluídas, do envio da planilha à aprovação do último item, em minutos, horas ou dias; "—" enquanto nenhuma estiver concluída;
  - Itens aprovados ("Todas com fonte rastreável até o documento de origem.", ou quantas são respostas manuais, sem fonte na base).
- **Tarefas por status:** barra segmentada com tabela de contagem e percentual por status. Os status: Em revisão, Pronta ou exportada, Falha, Na fila, Processando, Vencido.
- **RFPs concluídas por mês:** colunas dos seis últimos meses, terminando no atual, contadas pela data da última aprovação, com o valor no topo e dica ao passar o mouse.
- **Prazos mais próximos:** tarefas que vencem em menos de 15 dias, da mais próxima para a mais distante, com status, data e prazo restante; sem nenhuma, "Nenhuma tarefa vence nos próximos 15 dias.". O link "Ver todas as tarefas" leva à T3.
- O backend precisa fornecer esses agregados e definir como cada um é calculado (Q-22).

**F-09 · P0 · Criar tarefa importando as perguntas** (T4; MoSCoW: Must) — Implementado (processamento Simulado)

- **Arquivo:** área "Selecionar planilha ou documento de perguntas" (planilha, documento, apresentação ou arquivo do Google). **No MVP (v3), só planilha `.xlsx`**, com as perguntas numa coluna de cabeçalho "Pergunta"; outros formatos de entrada ficam para a Fase 2 e a tela deve recusá-los com a mensagem "Formato não aceito. Use uma planilha .xlsx."
- **Campos da tarefa:**
  - **Nome** — obrigatório; vem preenchido com o nome do arquivo e pode ser editado.
  - **Empresa** — obrigatório.
  - **CNPJ** — opcional; novo na v2.
  - **Tipo** — RFP ou RFI; obrigatório.
  - **Prazo de submissão** — obrigatório; não pode estar no passado. Digitado em dd/mm/aaaa, com máscara, em qualquer idioma do navegador, ou escolhido no calendário do navegador pelo botão ao lado do campo (ou Alt+↓), sem datas passadas; data que não existe mostra "Data inválida. Use dd/mm/aaaa." (05/11/2026; calendário de volta em 06/11/2026).
  - **Responsável** — obrigatório; escolhido entre os usuários da plataforma (com login, os perfis ativos; sem login, as pessoas de exemplo), lidos de `GET /api/usuarios` desde 24/10/2026 (SPEC, cenário 62).
- **CNPJ (novo):** máscara 00.000.000/0000-00 e conferência dos dígitos verificadores, com os erros "CNPJ incompleto." e "CNPJ inválido.".
  - Desde 28/10/2026, aceita também o CNPJ alfanumérico (IN RFB nº 2.229/2024): letras ou números nas 12 primeiras posições e 2 dígitos verificadores numéricos.
  - As letras viram maiúsculas na digitação.
  - O dígito verificador usa o mesmo módulo 11, com cada caractere valendo o código ASCII menos 48.
  - Os CNPJs só numéricos continuam válidos.
- **Contatos da empresa (novo):**
  - Bloco no fim do formulário: "Quem acompanha esta proposta do lado do cliente. Opcional."
  - Cada contato tem Nome, Cargo, Telefone (máscara (00) 00000-0000; erro "Telefone incompleto.") e E-mail (erro "E-mail inválido.").
  - "Adicionar contato" inclui outro contato. A lixeira remove um contato e só aparece quando há mais de um.
  - CNPJ e contatos são opcionais, mas o que for preenchido precisa estar válido (Q-17).
  - **Gravação (24/10/2026; SPEC, cenário 63):** empresa e contatos ficam em tabelas próprias do banco (`empresas`, `contatos`, `tarefa_contatos`), para consulta futura. A empresa é a mesma quando o CNPJ é igual ou, sem CNPJ, quando o nome é igual; o contato com e-mail é o mesmo em todas as tarefas da empresa, com os dados mais recentes.
- **Erros e envio:** os erros aparecem no campo depois de "Importar perguntas". Sem arquivo, um aviso pede o arquivo. "Cancelar" volta ao painel de tarefas.
- **Base pequena:** com menos de 3 documentos prontos, a tela avisa "Sua base ainda é pequena. Os itens tendem a ficar sem contexto, mas você pode continuar."
- **Depois do processamento:** "Processamento concluído", "Identificamos N perguntas." e "O texto original de cada item continua visível na revisão.", com o botão "Abrir revisão".

**F-10 · P0 · Painel de tarefas** (T3; MoSCoW: Must) — Parcial

- **Cabeçalho:** "Painel de tarefas", o título "[N] RFPs e RFIs em andamento" e o botão "Nova RFP/RFI".
- **Cartão de alertas** no topo (F-38).
- **Colunas da tabela:**
  - Tarefa (nome, com empresa e tipo abaixo);
  - Itens;
  - Progresso (barra e "N de M aprovados", ou "N de M processadas" durante o processamento);
  - Prazo (data e prazo restante);
  - Responsável;
  - Status;
  - Excluir (ícone de lixeira, 24/10/2026; SPEC, cenário 60): só em tarefas do servidor que não estão em processamento e, com login, só para o Aprovador. Abre a confirmação "Excluir “[nome]”?", que avisa que a tarefa sai para todas as pessoas com itens, edições, aprovações, avaliações, histórico e planilhas, sem como desfazer. Confirmada, a tarefa some da lista; quem estava nela volta para a T3.
- No celular, cada tarefa vira um cartão, com a lixeira no rodapé. Clicar numa tarefa abre a T5.
- **Status da tarefa:** Na fila, Processando, Falha, Em revisão, Vencido, Pronta, Exportada.
- **Pendente:**
  - editar prazo e responsável na própria linha ou na T5;
  - estado vazio ("Nenhuma RFP ou RFI em andamento." + "Nova RFP/RFI").

**F-38 · P1 · Cartão de alertas na tela de Tarefas** (novo na v2) — Implementado

- Mostra os alertas de tarefa ainda não lidos, os mesmos do sino (F-37), empilhados com navegação "Alerta 1 de N" e um botão de ação por alerta: "Conferir arquivo", "Abrir tarefa", "Revisar itens", "Conferir processamento".
- A ação abre o destino e marca o alerta como lido. Quando não há alerta não lido, o cartão some.

**F-11 · P0 · Visão de completude** (T5; MoSCoW: Must) — Implementado

- **Cabeçalho:** selo de status, nome, e a linha "[empresa] · [tipo] · prazo [data] ([prazo restante]) · responsável [nome]". Botões "Baixar planilha preenchida" (ou "Exportação" sem o servidor), "Ver detalhes" e "Abrir revisão". O caminho "Tarefas / [nome]" saiu em 24/10/2026. Com a tarefa ainda não "Pronta", "Baixar planilha preenchida" (aqui e na Exportação) pede confirmação antes: "Baixar mesmo assim" ou "Voltar para revisão" (26/10/2026).
- **"Ver detalhes" (24/10/2026; SPEC, cenário 64):** abre uma barra lateral, como a do trecho da fonte (T7), com a empresa (nome, CNPJ, tipo, prazo, responsável e arquivo) e os contatos informados na importação (nome, cargo, telefone e e-mail). Esc ou "Fechar" fecham.
- **Cartão de resumo:** só "X de Y itens aprovados" e a barra segmentada pelos cinco estados (sem rascunho, sugerida, em revisão, revisada, aprovada), com legenda e contagem em texto.
  - **Mudança da v1:** saíram os contadores "com sugestão" e "itens com alerta pendente" do cartão. O alerta pendente continua como filtro e em cada linha.
- **Filtro (`FilterMenu`):** "Todos" + "Filtrar" com Sem rascunho, Sugerida, Em revisão, Revisada, Aprovada e Alerta pendente, cada um com a contagem. O filtro escolhido vale também na T6.
- **Cada linha:** ID em mono (`REQ-004/012`), pergunta resumida, estado e "N alertas" quando houver. Clicar abre a T6 naquele item.

**F-12 · P0 · Status de processamento** (T3, T5) — Implementado (Simulado)

- **Processando:** na T3, a coluna Progresso mostra "N de M processadas". Na T5, o cartão mostra "Processando: 42 de 180 perguntas.", uma barra, "Você pode sair desta tela. Avisaremos aqui quando terminar." e o botão "Sair e voltar depois". Nas duas telas, só durante o processamento, a barra preenchida usa o gradiente limão em movimento do botão "Revisar com IA" (26/10/2026; parado com movimento reduzido).
- **Falha:** cartão em vermelho com "Falha no carregamento", "Não foi possível carregar este arquivo. Tente de novo ou fale com o suporte." e a causa em linguagem simples (por exemplo, "arquivo ilegível ou protegido por senha"). Botões "Tentar de novo" e "Importar novo arquivo".
- **Pronta:** cartão "Pronta para exportar", com "N de N itens aprovados." e o botão "Ir para exportação".
- **Aviso ao terminar:** a falha e o processamento concluído chegam pelo sino (F-37). Contato de suporte na falha: Pendente.

**F-13 · P1 · Prazo restante e alertas de prazo** (MoSCoW: Should) — Implementado

- **Texto do prazo:** a T3, a T5 e o Dashboard mostram "faltam N dias" ou "Vencida". Com menos de 5 dias ou vencida, o texto fica em vermelho e negrito.
- **Alertas:** tarefa vencida e tarefa com prazo próximo geram alerta no sino e no cartão da T3.
- **Status:** tarefa vencida ganha o status "Vencido".

**F-14 · P1 · Busca e filtros de tarefas** (MoSCoW: Should) — Pendente. Quando construído, usar o `FilterMenu`.

**F-15 · P1 · Corrigir a lista de perguntas identificadas** — Pendente. Com a entrada só em `.xlsx` e a identificação por regra (seção 20), a lista tende a sair correta; a correção manual só se justifica se o piloto mostrar planilhas fora do padrão.

**F-16 · P2 · Painel de ROI para o comprador** — Pendente. O Dashboard (F-39) cobre parte com tempo médio e volume.

**F-17 · P2 · Análise do edital e indicador de aderência** (MoSCoW: Could) — Pendente.

## 10. Requisitos C: tela de revisão, fontes e edição (T6, T7)

**F-18 · P0 · Split view** (MoSCoW: Must) — Implementado

- **Coluna esquerda** ("Itens"):
  - contagem "N de M", conforme o filtro;
  - nome da tarefa;
  - filtro `FilterMenu`, com as mesmas opções da T5;
  - lista com ID em mono, pergunta resumida, estado com ícone e "N alertas" quando houver: em vermelho se algum pendente bloqueia por conteúdo, em âmbar se só há avisos (05/11/2026).
- **Coluna direita:**
  - ID, selo de estado e, quando o texto foi alterado, o selo "Editado";
  - pergunta completa;
  - alertas empilhados (seção 6);
  - cartão de resposta, painel de fontes e feedback;
  - barra fixa de ações com o motivo de bloqueio.
- Selecionar um item atualiza a coluna direita sem recarregar a página.
- **Navegação:** botões "Item anterior" e "Próximo item", só com as setas (desde 04/11/2026), fixos à direita do código e das etiquetas do item, que quebram linha sem deslocá-los. O nome e os atalhos **K** e **J** aparecem na dica do botão. A navegação percorre os itens do filtro atual e dá a volta no fim da lista.
- **Filtro vazio:** "Nenhum item neste filtro." + "Escolha outro estado para continuar a revisão."
- **Abaixo de 900 px:** duas etapas, a lista e, ao escolher um item, o detalhe com o botão "← Itens" e setas de anterior e próximo.

**F-19 · P0 · Fonte rastreável com deep-link** (MoSCoW: Must) — Implementado (trecho Simulado)

- Cada parágrafo da resposta traz marcadores numerados ([1], [2]). Cada marcador abre a fonte correspondente na T7.
- **Painel "Fontes · N":** um cartão por fonte, com:
  - número;
  - tipo (Documento ou RFP passada);
  - "documento · local" em mono (página, seção, cláusula ou linha);
  - idade ("N dias");
  - selos "Mais de 120 dias", "Em conflito", "Fonte escolhida" e "Não escolhida";
  - botões "Abrir no trecho" e, quando houver conflito, "Usar esta fonte".
- **Fontes em conflito (24/10/2026):** aparecem antes das demais, como cartões sobrepostos, com "Fonte 1 de N" e setas. Depois da escolha, a escolhida fica sempre na frente, com "Fonte escolhida"; a outra fica cinza, com "Não escolhida", como histórico.
- **T7 (gaveta lateral sobre a revisão):**
  - "Fonte [N] · [tipo]", nome do documento, local e idade;
  - o trecho de origem destacado em limão no documento;
  - "Esc fecha e volta ao item" e o botão "Fechar". Ao fechar, a tela volta ao mesmo item.
- **Documento indisponível:** selo "Documento indisponível", o texto "Este documento não está mais na base. Mostramos o nome e a página registrados." e o nome e a página registrados.
- **Item sem fonte:** só sai como resposta manual, com o autor registrado e sinalizado na tela (sem alerta a reconhecer desde 26/10/2026).

**F-20 · P0 · Edição da resposta** (MoSCoW: Must) — Parcial

- "Editar resposta" abre o editor e "Concluir edição" fecha. Parágrafos são separados por uma linha em branco e cada parágrafo mantém seus marcadores de fonte.
- O salvamento é automático, com o indicador "Salvamento automático" antes do primeiro salvamento; depois, "Salvo agora" no primeiro minuto, "Salvo há N minuto(s)" até 59 minutos e "Salvo há N hora(s)" a partir de 1 hora (30/10/2026). O indicador é de cada item: só a resposta editada mostra o seu salvamento; as outras seguem com o próprio (04/11/2026).
- Texto alterado ganha o selo "Editado" e os botões "Ver sugestão original" / "Ocultar sugestão original" e "Restaurar sugestão", só com ícones desde 04/11/2026 (olho e setas circulares), com a descrição na dica ao passar o cursor ou no foco.
- Editar um item aprovado pede confirmação antes ("Editar e remover aprovação" / "Cancelar").
- **Pendente:**
  - formatação básica (negrito, itálico, listas); hoje o editor é texto simples em parágrafos;
  - estado de falha ao salvar.

**F-21 · P0 · Alertas reconhecíveis** (seção 6) — Implementado

- Com alerta pendente, "Marcar como revisado" e "Aprovar resposta" ficam desabilitados e o texto ao lado diz quantos alertas faltam tratar.
- Ao reconhecer, o alerta mostra "Reconhecido por [nome], [data e hora]".
- Em conflito, o reconhecimento só acontece pela escolha da fonte ou por "Nenhuma, vou escrever".
- **Pendente:** levar o foco ao primeiro alerta quando a pessoa tenta aprovar com pendência.

**F-22 · P0 · Portões de validação: revisar e aprovar** (MoSCoW: Must) — Implementado

- "Marcar como revisado" está disponível para os dois papéis. "Aprovar resposta" só para o Aprovador; para o Revisor o botão não aparece (26/10/2026).
- **Área (fase N, 04/11/2026):** cada item mostra a sua área, na lista e no topo do item. Para o Aprovador com área (não C-Level), a lista vem com as perguntas da sua área primeiro, abre na primeira delas ainda não aprovada, e o filtro ganha "Minha área". Quem pode aprovar a pergunta troca a área num seletor no topo do item, enquanto ela não estiver aprovada. Nos detalhes da tarefa, a tabela ganha a coluna "Área".
- **Ao revisar:** o item vai para *Revisada* e a tela confirma "Item revisado · Pronto para aprovação.". A barra de ações passa a mostrar "Pronta para aprovação.".
- **Ao aprovar:**
  - o item mostra o selo "Aprovado por [nome] · [data hora]";
  - a tela confirma "Item aprovado";
  - a seleção vai para o próximo item ainda não aprovado;
  - nos aprovados, a barra lembra "Editar remove a aprovação.".
- Não existe ação em lote para aprovar no produto. O "Aprovar todos os itens" do painel de demo é Simulado.

**F-23 · P0 · Feedback por resposta** — Implementado

- "Esta resposta ajudou?" com polegar para cima e para baixo, só em itens com sugestão da IA (item sem rascunho não tem o que avaliar, 26/10/2026).
- **"Revisar com IA" (26/10/2026, SPEC, cenário 65):** no editor da resposta de um item sem rascunho, um botão com o ícone de estrelas no canto inferior direito, desabilitado até o texto ter 30 palavras (digitadas ou coladas) e, habilitado, com um gradiente limão em movimento. A IA revisa só gramática, norma escrita, coerência e clareza, sem acrescentar nem deduzir informação, com o Haiku 5.5; o texto revisado volta para o editor e "Desfazer revisão" restaura o anterior.
- No polegar para baixo, aparece o seletor de motivo: Fonte incorreta, Texto impreciso, Informação desatualizada, Outro.
- **Mudança da v1:** a justificativa livre virou seletor de motivo. Um campo de texto livre opcional pode voltar se o piloto pedir.

**F-24 · P1 · Aviso de reescrita em excesso** — Pendente.

**F-25 · P2 · Atribuir itens a especialistas** — Pendente.

## 11. Requisitos D: aprovação, exportação e histórico (T8, T9)

**F-26 · P0 · Exportação bloqueada até 100% aprovado** (T8; MoSCoW: Must) — Implementado (arquivo Simulado)

- **Cabeçalho:** "Exportação", com o título "[N] de [M] tarefas prontas para exportar". Com o servidor, "[N] tarefas para baixar · [P] prontas" (05/11/2026): todas baixam com o estado atual, e "pronta" é só a tarefa 100% aprovada.
- **Um cartão por tarefa**, com:
  - empresa e nome;
  - selo "Bloqueada", "Pronta" ou "Exportada";
  - "X de N itens aprovados" e uma barra de progresso;
  - a descrição do conteúdo do arquivo.
- **Bloqueada** (item não aprovado ou alerta pendente): "Exportar documento" fica desabilitado, com o texto "[N] de [M] itens ainda não foram aprovados. Exportação bloqueada até 100% aprovado." e o botão "Ir para revisão", que abre o primeiro item pendente.
- **Pronta:** o download fica habilitado para o Aprovador e para o Revisor, com "Todos os itens estão aprovados e sem alerta pendente.". Nas tarefas ainda não prontas, só o Aprovador baixa (26/10/2026).
- **Conteúdo do arquivo**, para cada item e na ordem original:
  - a pergunta;
  - o ID do item;
  - a resposta aprovada, com as edições do revisor;
  - as fontes usadas.

  Itens de resposta manual mostram "Resposta manual, sem fonte na base". **Formato no front: planilha (.xlsx)** (Q-10).
- **Depois de exportar:** o selo "Exportada por [nome] · [data hora]", o botão vira "Baixar novamente" e a tarefa passa ao status "Exportada" na T3 e no Dashboard.
- Não existe botão para enviar a proposta ao cliente.
- **Pendente:** lista nominal dos itens pendentes na T8. Hoje há a contagem e o atalho para o primeiro pendente; a lista completa fica na T5 com o filtro.

**F-27 · P0 · Histórico de aprovações e revisões** (T9; MoSCoW: Must) — Implementado

- **Mudança da v1:** o histórico agora registra **aprovações e revisões**, não só aprovações.
- **Cabeçalho:** "Histórico de aprovações e revisões", com o título "[N] registros".
- **Filtro (`FilterMenu`):** "Todos" + Aprovações e Revisões, com contagens.
- **Colunas da tabela:**
  - pergunta, com a tarefa de origem abaixo;
  - trecho da resposta;
  - selo Aprovada/Revisada com nome e data e hora, ou "Histórico importado" sem nome;
  - idade.
- Clicar numa linha expande a resposta completa e os botões de cada fonte, que abrem a T7.
- **Pendente:**
  - estado vazio;
  - ordenação explícita da mais recente para a mais antiga (hoje: itens da tarefa aberta primeiro, depois os anteriores).

**F-28 · P1 · Auditoria detalhada** (MoSCoW: Should) — Pendente. O registro dos eventos (edição, reconhecimento, revisão, aprovação, aprovação removida, exportação, com nome e horário) precisa existir no backend desde a Fase 1, mesmo que a tela venha depois.

**F-29 · P1 · Validade de 120 dias das respostas aprovadas** (MoSCoW: Should) — Pendente. A T9 já mostra a idade; faltam o rótulo "Vencida" e a ação "Reaprovar".

**F-30 · P1 · Busca e filtros no histórico** (MoSCoW: Should) — Parcial: filtro por tipo (aprovação ou revisão). Faltam texto, tarefa, pessoa e período.

**F-31 · P2 · Painel de auditoria para Segurança e Jurídico** — Pendente.

## 12. Estados da interface e microcopy

Texto como está no front. A voz é direta, sem exclamação, sem emoji e sem a IA falando em primeira pessoa.

| Situação | Tela | Texto na interface | Ação disponível |
| --- | --- | --- | --- |
| Base vazia | T2 | "Sua base ainda não tem documentos. Suba propostas anteriores e documentos técnicos para gerar rascunhos." | Subir documentos |
| Servidor da base desconectado | T2 | "Servidor da base desconectado: a lista abaixo é de exemplo. Para subir documentos, inicie o servidor com npm run servidor, na pasta backend." | — |
| Envio com recusas | T2 | Quadro "Resultado do envio" com o motivo de cada arquivo recusado ou ignorado | Fechar o quadro; corrigir o arquivo e enviar de novo |
| Primeiros passos sem documento | T1 | Passos 2 e 3 bloqueados até o passo 1 ser concluído | Subir documentos |
| Base vazia | D1, T3 | "Nova RFP/RFI" desabilitado, com a dica "Suba ao menos um documento na Base de conhecimento para criar uma RFP." | Subir documentos (Primeiros passos ou Base) |
| Base pequena | T4 | "Sua base ainda é pequena. Os itens tendem a ficar sem contexto, mas você pode continuar." | Continuar |
| Processando | T3, T5 | "Processando: 42 de 180 perguntas." / "Você pode sair desta tela. Avisaremos aqui quando terminar." | Sair e voltar depois |
| Falha no processamento | T5 | "Não foi possível carregar este arquivo. Tente de novo ou fale com o suporte." + causa | Tentar de novo; Importar novo arquivo |
| Formato não aceito | T1, T2 | "Formato não aceito. Formatos aceitos: [lista]." | Escolher outro arquivo |
| Arquivo com erro | T1, T2 | "Falha ao processar. Tente novamente." | Tentar novamente |
| Arquivo em tratamento manual | T1, T2 | "Este arquivo precisa de tratamento pelo suporte. Avisaremos aqui quando estiver pronto." | Nenhuma |
| Documento desativado | T2 | "[documento] não será usado em novas respostas." | Ativar |
| CNPJ / contato inválido | T4 | "CNPJ incompleto." · "CNPJ inválido." · "Telefone incompleto." · "E-mail inválido." | Corrigir |
| Sem contexto | T6 | Quadro "Resposta sem fonte": "Não encontramos informação na base para esta pergunta. Adicione conhecimento ou escreva a resposta manualmente." | Escrever a resposta ou adicionar conhecimento |
| Baixa confiança | T6 | "Baixa confiança. Confira a fonte antes de aprovar." | Reconhecer alerta |
| Fontes conflitantes | T6 | "Duas fontes se contradizem. Escolha qual vale." | Usar esta fonte; Nenhuma, vou escrever |
| Fonte antiga | T6 | "Fonte sem atualização há [N] dias, acima do prazo de 120 dias." | Reconhecer alerta |
| Termo crítico | T6 | "Requer validação do Jurídico. A pergunta envolve responsabilização civil, multa ou garantia jurídica." | Reconhecer alerta |
| Resposta manual sem fonte | T6 | Quadro "Resposta sem fonte", com "Resposta manual, sem fonte na base · escrita por [nome]" | Nenhuma (registro de autoria) |
| Sem resposta | T6 | "Escreva a resposta antes de revisar ou aprovar." | Editar resposta |
| Aprovação bloqueada | T6 | "Falta tratar 1 alerta antes de aprovar." | Tratar o alerta |
| Revisor tentando aprovar | T6 | Botão "Aprovar resposta" não aparece para o Revisor (26/10/2026) | Nenhuma |
| Filtro sem itens | T6 | "Nenhum item neste filtro." / "Escolha outro estado para continuar a revisão." | Trocar filtro |
| Documento indisponível | T7 | "Este documento não está mais na base. Mostramos o nome e a página registrados." | Fechar |
| Editar item aprovado | T6 | "Editar remove a aprovação." / "O item volta para Em revisão e o evento fica registrado." | Editar e remover aprovação; Cancelar |
| Exportação bloqueada | T8 | "[N] de [M] itens ainda não foram aprovados. Exportação bloqueada até 100% aprovado." | Ir para revisão |
| Revisor na exportação | T8 | Tarefa não pronta: "O Revisor baixa a planilha quando a tarefa estiver pronta: todos os itens aprovados e nenhum alerta pendente." | Nenhuma |
| Falha ao salvar | T6 | "Não foi possível salvar. Seu texto continua nesta tela e tentaremos de novo." (Pendente) | Tentar agora |

**Avisos de confirmação** (aparecem no canto e somem sozinhos): "Alerta reconhecido", "Fonte escolhida", "Item revisado", "Item aprovado", "Sugestão restaurada", "Aprovação removida", "Nova tentativa", "Documento exportado", "Documento ativado/inativo". No celular aparecem no topo, para não cobrir os botões de revisar e aprovar.

**Regras de escrita**

- Datas e horas em formato brasileiro (dd/mm/aaaa, 24 h). Idades em texto, como "142 dias".
- Números de itens sempre com o total ("12 de 180"), nunca só o percentual.
- Mensagens de erro dizem o que aconteceu e o que fazer, sem códigos técnicos.

## 13. Componentes do design system

O design system vive no repositório do front (`src/ds`) e cada componente tem tipos e documentação de uso. Componentes centrais do MVP:

| Componente | Onde aparece | Regras |
| --- | --- | --- |
| Cartão de resposta rastreável | T6, T9 | Pergunta, resposta com marcadores por parágrafo, selo de estado, autoria manual e selo de aprovação |
| Chip de estado do item (`Badge`) | T5, T6, T9 | Sem rascunho, Sugerida, Em revisão (Tinta), Revisada, Aprovada (Limão claro com borda Limão). Sempre ícone + texto |
| Pilha de alertas (`AlertDeck`) | T6, T3 | Cartões sobrepostos com navegação "N de M", estados pendente e reconhecido. Vermelho danger; ícone e rótulo distinguem o tipo |
| Painel de fontes | T6 | Cartão por fonte: número, tipo, documento · local, idade, selos e ações |
| Visualizador de fonte | T7 | Gaveta lateral, trecho destacado, Esc fecha |
| Barra segmentada (`SegmentBar`) | D1, T5 | Cores de dataviz por estado; legenda com contagens em texto |
| Barra de progresso (`ProgressBar`) | T3, T5, T8 | Percentual com o texto "N de M" ao lado |
| Filtro de lista (`FilterMenu`, novo) | T5, T6, T9 | "Todos" + "Filtrar" com menu e contagens. Padrão obrigatório para filtros |
| Menu lateral (`SidebarNav`) | Workspace | Grupos com título; modo recolhido só com ícones, na mesma posição |
| Barra superior (`BrandBar`) | Site e Workspace | Tinta, 64 px, logo à esquerda, ações à direita. O logo tem a mesma posição e o mesmo tamanho (28 px, a `--brandbar-pad` da borda) no site, no login, na abertura e no Workspace, também com o menu recolhido; no celular, depois do botão de menu (04/11/2026) |
| Logo animado (`AnimatedLogo`) | Site, L2 | Variantes Tinta e Papel; respeita "reduzir movimento" |
| Aviso (`Toast`) | Workspace | Confirmações curtas; anunciado a leitores de tela |

**Regras transversais**

- Todo botão desabilitado mostra ao lado o motivo em texto.
- Todo estado usa ícone e texto além da cor.
- Limão só como preenchimento; texto em limão apenas sobre Tinta. Ação primária em Tinta.
- Grid de 8 px; IDs, arquivos, datas e contagens em IBM Plex Mono.

## 14. Métricas de sucesso e telemetria

O piloto de 30 dias do test card (5 Bid Managers, 10 Sales Engineers, 5 RFPs complexas) é a janela de avaliação.

| Métrica | Como medir | Meta | Fonte da meta |
| --- | --- | --- | --- |
| Aceitação do texto sugerido | Diferença entre a sugestão e a versão aprovada, por item | ≥ 70% do texto mantido | Canvas |
| Aceitação das fontes | Itens aprovados sem trocar a fonte e sem polegar para baixo com motivo "Fonte incorreta" | > 80% | PRD anterior, test card |
| Feedback por resposta | Polegar para cima sobre o total de avaliações | ≥ 80% positivo | Canvas |
| Tempo de ciclo | Da importação da RFP à exportação | −60% no mínimo | Canvas (Q-07) |
| Horas de especialista | Tempo ativo em T6 e T7 por usuário | −50% por RFP | Test card |
| Time-to-first-value | Da criação da conta ao primeiro rascunho revisável | A definir | Pitch deck (Q-08) |
| Alertas por tarefa e tempo até reconhecer | Contagem e mediana | Diagnóstico | Este PRD |

**Eventos de telemetria** — **Pendente no front** (nenhum evento é emitido hoje). A lista abaixo é o contrato a implementar no front e no backend:

| Evento | Quando dispara | Propriedades principais |
| --- | --- | --- |
| login_realizado | Ao entrar no Workspace | Papel |
| documento_enviado | Ao subir arquivo para a base | Tipo, formato, resultado |
| documento_desativado / documento_ativado | Ao usar a chave da T2 | Tipo |
| tarefa_criada | Ao confirmar a T4 | Tipo (RFP ou RFI), nº de itens, CNPJ informado (sim/não), nº de contatos |
| item_aberto | Ao selecionar um item na T6 | Estado, alertas presentes |
| fonte_aberta | Ao abrir a T7 | Idade da fonte |
| alerta_reconhecido | Ao reconhecer ou escolher a fonte | Tipo de alerta, tempo desde a exibição |
| resposta_editada | Ao salvar edição | % do texto alterado (sem o texto) |
| sugestao_restaurada | Ao restaurar a sugestão | — |
| item_revisado / item_aprovado | Ao mudar o estado | Papel, tempo no item |
| aprovacao_removida_por_edicao | Ao confirmar a edição de item aprovado | — |
| feedback_enviado | Ao usar o polegar | Sentido, motivo |
| alerta_tarefa_lido | Ao abrir um alerta pelo sino ou pelo cartão | Tipo, origem (sino ou cartão) |
| exportacao_bloqueada_vista | Ao abrir a T8 com pendências | Nº de pendências |
| exportacao_concluida | Ao exportar | Formato, tempo total da tarefa |

**Regra de privacidade:** nenhum evento carrega o texto das perguntas, das respostas, dos documentos nem dados de contato.

## 15. Acessibilidade, responsividade e requisitos não funcionais

**Acessibilidade (meta: WCAG 2.2 nível AA)**

- **Teclado:** a T6 funciona só com teclado. J e K navegam entre itens, Esc fecha a T7, e os menus (usuário, alertas, filtro) fecham com Esc e devolvem o foco ao botão que os abriu.
- **Foco:** ao abrir a T7, o foco vai ao botão fechar. Depois de aprovar, a seleção vai ao próximo item pendente. Pendente: foco no primeiro alerta ao tentar aprovar com pendência.
- **Leitor de tela:** os avisos de confirmação são anunciados. Os ícones do menu recolhido e os marcadores de fonte têm rótulo acessível.
- **Cor:** nenhum estado depende só de cor.
- **Movimento:** "reduzir movimento" desliga as animações (logo, abertura, barras).
- **Contraste dos tokens** (medido):

| Combinação | Contraste | Leitura |
| --- | --- | --- |
| Danger `#A8402E` sobre branco | 6,11:1 | Passa AA |
| Danger `#A8402E` sobre N-050 `#F5F6F1` | 5,62:1 | Passa AA |
| Limão `#C8F73D` com Tinta `#12140F` | 14,86:1 | Passa com folga |
| Compliance `#4B5046` sobre branco | 8,28:1 | Passa com folga |
| Sálvia `#6E7268` sobre branco | 4,92:1 | Passa AA para texto normal |
| Sálvia `#6E7268` sobre Tinta | 3,77:1 | Só para elementos grandes ou ícones |

**Responsividade (mudança da v1)**

A v1 propunha só leitura abaixo de 768 px. O front publicado é **totalmente utilizável no celular**, inclusive revisar, aprovar e exportar (Q-18):

- **Até 900 px:**
  - o menu lateral abre por cima do conteúdo;
  - a T6 vira duas etapas (lista e detalhe);
  - as tabelas viram cartões (T2, T3, T9).
- **Até 600 px:**
  - o menu do usuário mostra as iniciais e o "Sair" vai para dentro dele;
  - as ações da revisão empilham;
  - os avisos aparecem no topo.
- **Sem rolagem lateral** da página em nenhuma tela, de 320 px a 1440 px. As tabelas largas rolam dentro do próprio cartão.

**Desempenho percebido**

- Tarefas com centenas de itens (há exemplos com 100 e 150) devem rolar e filtrar sem travar; com dados reais, a lista da T6 deve usar renderização sob demanda.
- Trocar de item na T6 deve parecer imediato (meta: menos de 200 ms de resposta da interface).
- Nenhuma ação de revisão depende de recarregar a página.

**Suporte e idioma**

- **Navegadores:** as duas últimas versões estáveis de Chrome, Edge, Safari e Firefox.
- **Idioma:** interface em português do Brasil; idioma dos documentos em Q-12.

## 16. Contrato de dados para o backend (novo na v2)

Esta seção lista o que o front já consome e dispara. Os nomes são descritivos, não um desenho de API. Hoje todos esses dados vêm de arquivos de exemplo no próprio front (`src/workspace/data.js`) e são o ponto exato de troca pela API.

**Entidades e campos que o front exibe**

| Entidade | Campos | Observações |
| --- | --- | --- |
| Empresa (tenant) | nome | Isolamento por tenant é promessa do site |
| Usuário | nome, iniciais, papel (Revisor, Aprovador), e-mail | Papel vem da sessão; lista de usuários alimenta "Responsável" na T4 |
| Documento da base | id, nome do arquivo, tipo (Documento, RFP passada), data da última atualização, idade em dias, versão, status, ativo (sim/não), enviado por, data de envio, motivo de erro | Status: na fila, processando (com progresso), pronto, erro, em tratamento pelo suporte, formato não aceito |
| Tarefa | id, nome, empresa, CNPJ, tipo (RFP, RFI), prazo de submissão, responsável, status, nº de itens, nº de itens aprovados, nº de itens processados (durante o processamento), causa da falha, contatos, exportação (por quem, quando, arquivo) | Status: na fila, processando, falha, em revisão, vencido, pronta, exportada |
| Contato da empresa | nome, cargo, telefone, e-mail | Vários por tarefa; todos opcionais (Q-17) |
| Item (pergunta) | id, código exibido (`REQ-NNN/TTT`), posição na lista original, pergunta, texto original da sugestão, parágrafos da resposta atual (cada um com as fontes que o sustentam), estado, revisado por e quando, aprovado por e quando, autor da resposta manual, feedback | Estado: sem rascunho, sugerida, em revisão, revisada, aprovada |
| Fonte do item | número, documento, local (página, seção, cláusula, linha), tipo, idade em dias, trecho de origem, em conflito (sim/não), escolhida (sim/não), indisponível (sim/não) | O trecho é o que a T7 destaca |
| Alerta do item | tipo (`lowconf`, `conflict`, `old`, `critical`, `nocontext`, `manual`), reconhecido por e quando | A idade usada no texto de `old` é a maior entre as fontes acima de 120 dias |
| Alerta de tarefa (sino) | id, tipo (falha no carregamento, reprocessamento, prazo vencido, prazo próximo), tarefa, texto, data e hora, ação de destino, lido por usuário | Estado de leitura por usuário (Q-20) |
| Registro de histórico | tipo (aprovação, revisão), pergunta, tarefa de origem, resposta completa, pessoa, data e hora, idade, importado (sim/não), fontes | Itens de RFP importada: sem pessoa (Q-04) |
| Agregados do Dashboard | tarefas trabalhadas (em andamento e concluídas), itens em aberto, tempo médio por RFP, itens aprovados, tarefas por status, RFPs concluídas por mês (6 meses), prazos nos próximos 15 dias | Período: últimos 90 dias (Q-22). Desde 24/10/2026, calculados no front a partir das tarefas e itens do servidor, sobre todas as tarefas |

**Ações que o front dispara**

| Ação | Tela | Regra que o backend precisa garantir |
| --- | --- | --- |
| Entrar / sair | L1, barra | Sessão autenticada; papel do usuário (Q-19) |
| Pedido de contato | S3 | Destino do formulário (Q-23) |
| Enviar documentos (vários) | T2 (T1 depois) | **v3, 22/10:** `POST /api/base/documentos` com os `.md` escolhidos; validar o cabeçalho de cada arquivo, gravar os blocos e devolver o resultado por arquivo (carregado, atualizado, sem mudança, recusado com o motivo, ignorado, aviso); um arquivo recusado não impede os demais. Na Fase 2: outros formatos, processamento assíncrono, status e progresso |
| Tentar novamente o processamento de um documento | T1, T2 | — |
| Ativar / desativar documento | T2 | Documento inativo não entra em novas respostas; respostas aprovadas não mudam |
| Criar tarefa (arquivo + campos + CNPJ + contatos) | T4 | Validar obrigatórios, prazo não passado, CNPJ e contatos quando preenchidos; aceitar só `.xlsx` no MVP; processar de forma assíncrona; devolver nº de perguntas |
| Tentar de novo uma tarefa com falha | T5 | Gera o alerta "Reprocessamento" |
| Excluir tarefa | T3 | Pede confirmação; não exclui tarefa em processamento; com login, só o Aprovador; apaga itens, eventos, avaliações e planilhas (SPEC, cenário 60) |
| Salvar texto da resposta (automático) | T6 | Aplicar as transições da seção 6; manter o texto original da sugestão |
| Restaurar sugestão original | T6 | — |
| Reconhecer alerta | T6 | Registrar pessoa e horário; não existe reconhecer em lote. Gravado no backend desde 24/10/2026 (SPEC, cenário 57) |
| Escolher fonte em conflito / "Nenhuma, vou escrever" | T6 | Reconhece o alerta de conflito. Gravado no backend desde 24/10/2026 (SPEC, cenário 58) |
| Marcar como revisado | T6 | Exige resposta escrita e nenhum alerta pendente. Gravado no backend desde 24/10/2026 (SPEC, cenário 59) |
| Aprovar | T6 | Só Aprovador; exige resposta escrita e nenhum alerta pendente; registrar pessoa e horário |
| Remover aprovação ao editar | T6 | Registrar o evento; item volta para Em revisão |
| Enviar feedback | T6 | Sentido e motivo |
| Exportar / baixar novamente | T8 | Só Aprovador; só com 100% aprovado e sem alerta pendente; registrar quem e quando; gerar o arquivo (Q-10) |
| Marcar alerta de tarefa como lido / todos como lidos | Sino, T3 | Por usuário |

**O que é Simulado no front e precisa sair antes da produção**

- Painel de demo ("Aprovar todos os itens") e "Trocar usuário".
- Login sem validação e envio do formulário de contato.
- "Usar arquivos de exemplo" em Primeiros passos.
- Processamento de documentos e tarefas por temporizador.
- Datas de referência fixas: "hoje" do protótipo é 29/09/2026.
- Números do Dashboard e itens gerados automaticamente para as tarefas de exemplo.

## 17. Decisões tomadas e conflitos entre documentos

**Decisões do time (mantidas da v1)**

- **Perfis de acesso:** dois papéis, Revisor e Aprovador.
- **Incerteza:** rascunho visível com alerta que precisa ser reconhecido.
- **Prazo de aging:** 120 dias sem atualização.

**Decisões tomadas durante a construção do front (novas na v2)**

| Tema | Decisão | Onde |
| --- | --- | --- |
| Escopo do front | Inclui site público, login e abertura | Seção 7 |
| Tela inicial do Workspace | Dashboard; Primeiros passos enquanto a base da organização está vazia (28/10/2026) | F-39, F-01 |
| Ação primária | Tinta, não Sálvia; Sálvia fica com foco e marca | Seção 4 |
| Filtros | `FilterMenu` é o padrão do design system para listas e tabelas | Seções 4 e 13 |
| Histórico | Registra aprovações e revisões | F-27 |
| Arquivar documento | Implementado como desativar (reversível) | F-06 |
| Cartão de resumo da T5 | Só "X de Y itens aprovados" + barra | F-11 |
| Feedback negativo | Seletor de motivo em vez de texto livre | F-23 |
| Celular | Totalmente utilizável, inclusive aprovar e exportar | Seção 15, Q-18 |
| Alertas de tarefa | Sino + cartão na T3, sincronizados por estado de leitura | F-37, F-38 |
| Cadastro da empresa na tarefa | CNPJ e contatos opcionais | F-09, Q-17 |
| Formato da exportação no protótipo | Planilha (.xlsx) | F-26, Q-10 |
| Entrada da RFP (v3) | Somente `.xlsx` | F-09, seção 20 |
| Entrada da base (v3, 22/10) | Arquivos `.md` enviados pela T2 ("Subir documentos") ou pelo comando de carga | F-02, seção 20 |
| Arquitetura de IA (v3) | Fluxo fixo em código, sem agente e sem busca vetorial; IA só para redigir com citações, para o plano B de identificação das perguntas e para detectar conflito | Seção 20 |
| Limites de qualidade (v3) | Relevância 80%, fidelidade 90% | Seção 20, Q-25 |

**Conflitos e resolução**

| Tema | O que os documentos dizem | Resolução adotada |
| --- | --- | --- |
| Condição para exportar | Canvas: 100% "Revisados ou Aprovados". MoSCoW: "toda resposta deve ser aprovada" | 100% **Aprovados** e sem alerta pendente (F-26) |
| Perfis de acesso | MoSCoW põe RBAC em Could, mas exige aprovador identificado (Must) | Dois papéis em P0 |
| Prazo de aging | Documentos anteriores: 90 dias | 120 dias sem atualização |
| Baixa confiança | Canvas e PRD anterior mandam não rascunhar "zona cinzenta" | Rascunho com alerta reconhecível, exceto sem contexto |
| Formato da exportação | Front: planilha (.xlsx). Página de preços (plano Basic): "Exportação em Word e Excel" | Manter .xlsx no MVP; ajustar o texto do site ou decidir em Q-10 |
| Setor público | PRD: fluxos de licitação fora do MVP. Site: plano "Setor público", rótulo "RFP & Licitações" e login "RFPs e editais" | O produto do MVP segue privado; o site anuncia o setor público como oferta comercial. Alinhar o texto do site ou o escopo (Q-24) |
| Autenticação | Login do front: e-mail e senha. Plano Enterprise: "SSO SAML + SCIM" | E-mail e senha no MVP; SSO como requisito do plano Enterprise (Q-19) |
| Números de marketing | v1: o produto não exibe números de horas como fato. Home: "4h 12m por edital de 200 itens", "83% de reaproveitamento", "3,2× mais RFPs", "100% com fonte" | Tratar como ilustrativos até haver dados do piloto; revisar antes do lançamento aberto |
| Item sem fonte | Pitch: "sem fonte rastreável, o item não é entregável" | Pode ser aprovado como resposta manual, com a autoria registrada e sinalizada (sem reconhecimento desde 26/10/2026) |
| Integrações | Site: "00 · Conecte suas fontes: drives, intranet…". MoSCoW: integrações em Won't | No MVP, "conectar" é subir arquivos; conectores ficam para a Fase 3 |

## 18. Questões em aberto

| ID | Questão | Sugestão inicial | Quem responde | Bloqueia |
| --- | --- | --- | --- | --- |
| Q-01 | Termos críticos: rascunho com alerta de nível alto ou bloquear e exigir o Jurídico? | Rascunho com alerta (como está) | Jurídico, Produto | Não |
| Q-04 | Respostas de RFPs importadas contam como aprovadas? | Não: "Histórico importado", sem aprovador (como está) | Produto | Não |
| Q-05 | Quem pode subir, desativar documentos, criar tarefas e exportar; como os papéis são atribuídos? | Tabela da seção 3; atribuição fora da interface no MVP | Produto, cliente piloto | Backend (permissões) |
| Q-07 | Meta de redução do ciclo: 40% ou 60%? | 60%, revisar após o piloto | Produto | Não |
| Q-08 | Meta de time-to-first-value? | Definir com os pilotos | Produto, Engenharia | Não |
| Q-10 | Formato e layout do arquivo exportado; planilha de entrada exporta em planilha? Word também? | .xlsx no MVP (como está); Word depois, se o plano Basic mantiver a promessa | Produto, cliente piloto | Backend (geração do arquivo) |
| Q-12 | Idioma dos documentos | Interface em português; aceitar documentos em inglês | Produto | Não |
| Q-13 | Deep-link, alerta reconhecível e fluxo Revisor/Aprovador funcionam com usuários reais? | Testar o front publicado com 5 Sales Engineers e 4 responsáveis de Jurídico ou Segurança | Produto, Design | Bloqueia escalar |
| Q-16 | O prazo de 120 dias vale para respostas aprovadas reutilizadas (F-29)? | Sim | Produto, Jurídico | Não |
| Q-17 (nova) | CNPJ e contatos da empresa devem ser obrigatórios? Pelo menos um contato com nome e e-mail? | Opcionais no MVP (como está) | Produto | Não |
| Q-18 (nova) | Aprovar e exportar no celular é permitido? | Permitido (como está); rever se o Jurídico pedir | Produto, Jurídico | Não |
| Q-19 (nova) | Método de autenticação: e-mail e senha, SSO, ou ambos por plano? Recuperação de senha? | E-mail e senha no MVP; SSO no Enterprise | Produto, Engenharia | Backend (auth) |
| Q-20 (nova) | Quais eventos geram alerta no sino (além de falha, reprocessamento e prazos)? O estado de leitura é por usuário? Com quantos dias de antecedência sai o "prazo próximo"? | Por usuário; incluir "processamento concluído"; prazo próximo com menos de 5 dias | Produto | Backend (notificações) |
| Q-21 (nova) | Documento desativado pode ser excluído de vez? O que acontece com as fontes já citadas? | Só desativar no MVP; excluir mantém nome e página registrados (estado "Documento indisponível" da T7) | Produto, Jurídico | Não |
| Q-22 (nova) | Como calcular os indicadores do Dashboard (tempo médio, itens em aberto, período)? | Últimos 90 dias; tempo médio da importação à exportação | Produto, Engenharia | Backend (agregados) |
| Q-23 (nova) | Para onde vai o formulário de contato do site (CRM, e-mail, planilha)? | E-mail para vendas no MVP | Marketing, Produto | Não |
| Q-24 (nova) | O site deve continuar anunciando setor público e licitações enquanto o MVP é privado? | Manter o plano como "sob consulta" e deixar claro que é roadmap | Produto, Marketing | Não |

**Decididas desde a v1**

| ID | Decisão | Onde |
| --- | --- | --- |
| Q-02 | Formatos aceitos. **Revisada na v3:** MVP com entrada de RFP só em `.xlsx` e base só em `.md`, enviada pela T2 ou por comando. Os demais (.doc, .docx, .xls, .pdf, .ppt, .pptx, .txt, .csv e arquivos do Google baixados) voltam na Fase 2 | F-02, F-09, seção 20 |
| Q-03 | Alerta para fontes com mais de 120 dias sem atualização | Seção 6, F-04 |
| Q-06 | Alertas usam o token danger (`#A8402E`, contraste medido) e a escala tipográfica de produto foi derivada no design system do front | Seções 4, 13 e 15 |
| Q-09 | Resposta manual sem fonte pode ser aprovada, com a autoria registrada; o alerta de resposta manual deixou de exigir reconhecimento em 26/10/2026 | Seção 6 |
| Q-11 | Sem número mínimo de documentos; aviso de base pequena com menos de 3 documentos prontos | F-01, F-09 |
| Q-14 | Arquivos do Google entram por upload do arquivo baixado; sem conexão com o Drive no MVP. **v3:** no MVP, quem tiver outro formato converte para `.md` antes da carga | F-02 |
| Q-25 | Limites de qualidade da IA: relevância da recuperação em 80% e fidelidade do conteúdo em 90% | Seção 20 |
| Q-15 | O arquivo exportado traz o texto final aprovado, com as edições do revisor | F-26 |

## 19. Fases e próximos passos

1. **Front do piloto (concluído).** Todas as telas do MVP navegáveis com dados de exemplo, no site publicado e no repositório `tendra-ai-front`. Inclui os P0 de interface e parte dos P1: F-13, F-36, F-37, F-38 e F-39.
2. **Fase 1, piloto fechado (meses 1 a 3, 3 a 5 clientes).**
   - **Backend:** construir o contrato da seção 16 e substituir tudo o que está marcado como Simulado. A base entra em `.md`, pela T2 ou por comando, e a RFP só em `.xlsx` (seção 20).
   - **Front:** fechar os P0 parciais e pendentes:
     - F-01 (abrir Primeiros passos no primeiro acesso: feito em 28/10/2026);
     - F-04 (estado vazio);
     - F-10 (edição de prazo e responsável; estado vazio);
     - F-20 (formatação e falha ao salvar);
     - F-21 (foco no alerta);
     - F-26 (lista de pendentes);
     - F-27 (estado vazio e ordenação).
   - Instrumentar a telemetria da seção 14.
   - **Antes de começar:** responder Q-05, Q-10, Q-19, Q-20 e Q-22, que bloqueiam partes do backend.
   - **Portão de saída:** metas do piloto atingidas ou revistas e Q-13 respondida.
3. **Fase 2, soft launch (meses 4 a 6, 15 a 20 empresas).** Upload de outros formatos pela interface (F-02, F-03; o envio de `.md` já está no MVP), conversão de PDF, DOCX, XLSX e PPTX para blocos, e entrada de RFP em outros formatos. F-05, F-14, F-15, F-24, F-28, F-29, F-30 e exclusão de documentos (F-06).
4. **Fase 3, lançamento aberto (mês 7 em diante).** P2 conforme o piloto (F-07, F-08, F-16, F-17, F-25, F-31) e o roadmap do pitch: integrações (Drive, SharePoint, CRM), aprovação multinível, MCP, base pré-carregada de normas, modo assistente e setor público.

**Parking lot** (boas ideias fora do escopo, sem compromisso):

- Aprovação em lote de itens sem alerta (enfraquece o human-in-the-loop; só testar depois do piloto).
- Aprovar dentro do Slack ou do Teams.
- Auto-preenchimento de planilhas e portais de compras por extensão.
- Abrir itens já prontos enquanto o restante da RFP ainda processa.

## 20. Pipeline de IA do MVP (novo na v3)

O diagrama completo está em `docs/mvp-resposta-rfp/product/PIPELINE_IA_MVP.md` e, editável, no board do Miro do projeto. Esta seção registra as decisões que afetam o produto; a arquitetura detalhada continua em `docs/mvp-resposta-rfp/` e `docs/referencia/mvp-proposta-1/`.

**Princípios**

- **Fluxo fixo em código, sem agente.** As etapas são previsíveis; o backend as executa em ordem e chama o Claude só onde há linguagem natural a tratar. Isso torna o fluxo testável e auditável.
- **A IA sugere, a pessoa decide.** Nenhuma etapa da IA aprova, revisa ou exporta. Todo item sai como *Sugerida* ou *Sem rascunho*, e as regras de estado, alertas e bloqueios são lógica de código.
- **Sem fonte verificável, não há resposta.** Cada citação é conferida contra o documento antes de aparecer. O modelo redige a resposta com as fontes como contexto, de forma coerente com a pergunta, mas cada parágrafo precisa de ao menos uma citação válida: parágrafo sem citação é removido (alerta de baixa confiança), e item sem nenhuma citação válida vira *Sem rascunho* com o alerta de sem contexto. As instruções proíbem acrescentar o que os documentos não sustentam; a fidelidade do texto às fontes é conferida por pessoa na avaliação.
- **Sem busca vetorial no MVP.** A base inteira vai ao Claude, que encontra e cita os trechos. A recuperação fica atrás de um módulo próprio, trocável depois.

**Etapas**

| # | Etapa | Quem executa | Resultado para o front |
| --- | --- | --- | --- |
| 1 | Preparar a base: escrever os `.md` com cabeçalho (`titulo`, `tipo`, `atualizado_em` e `versao` opcional; ver `docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`), subir os arquivos pela T2 (ou rodar o comando de carga), validar, dividir em blocos com localização (arquivo, seção, linha), gravar no banco | Pessoa e código, sem IA | T2 mostra o resultado do envio e lista os documentos com idade e selo de 120 dias |
| 2 | Entender a RFP: validar o `.xlsx`, criar a tarefa, ler a planilha, achar as perguntas pela coluna "Pergunta"; plano B com modelo pequeno e saída estruturada se a coluna não for achada; confirmar a lista | Código; IA só no plano B | T4 mostra "Identificamos N perguntas" |
| 3 | Gerar respostas: montar o contexto (documentos ativos e prontos), redigir por lote de cerca de 10 perguntas com citações, conferir cada citação, calcular alertas (sem contexto, baixa confiança, fonte antiga, termo crítico), detectar conflito entre as fontes citadas, gravar os itens | Código; IA 1 (redação) e IA 2 (conflito) | T5 e T6 recebem estados, parágrafos, fontes e alertas no contrato da seção 16 |
| 4 | Revisar, aprovar e exportar: tratamento de alertas, revisão, aprovação, exportação em `.xlsx` e registro de eventos | Pessoas; código na exportação; IA 3 (Haiku 5.5) só no "Revisar com IA" da resposta manual, que corrige a redação sem acrescentar informação | T6, T8 e T9, como já descritos |
| 5 | Medir a qualidade: gabarito sintético de cerca de 30 perguntas, critérios, bloqueio de mudanças abaixo dos limites | Código | Fora das telas; alimenta o piloto |

**Proteções que o produto precisa garantir**

- CNPJ e contatos da empresa nunca vão para a IA; só o texto das perguntas.
- O conteúdo dos documentos e da planilha é tratado como dado, nunca como instrução.
- Só documentos *ativos* e *prontos* da empresa entram no contexto; documento fora da base nunca é usado.
- Base vazia: todos os itens saem *Sem rascunho*, sem chamar a IA. Base acima do teto de tokens: a tarefa falha com mensagem explícita, sem resultado parcial.
- Falha do provedor de IA: nova tentativa espaçada e, persistindo, tarefa em *Falha* com "Tentar de novo" apenas nos lotes pendentes. Nunca se mostra resultado parcial como concluído.

**Critérios de qualidade da IA** (medidos pelo comando de avaliação sobre o gabarito sintético)

| Critério | Limite |
| --- | --- |
| Validade das fontes (citação confere literalmente com o documento) | 100% |
| Texto apresentado sempre com ao menos uma fonte válida | 100% |
| Relevância da recuperação (a fonte inclui o documento esperado) | **80%** (decidido na v3) |
| Pergunta sem resposta no gabarito fica sem rascunho | 100% |
| Conflito embutido na base marcado com o alerta de conflito | 100% |
| Citações de documentos fora da base autorizada | Nenhuma |
| Instrução maliciosa e pedido de compromisso não sustentado tratados corretamente | 3 de 3 execuções |
| Fidelidade do conteúdo (o texto diz o mesmo que os trechos citados) | **90%** (decidido na v3) |

**Decisões em aberto deste pipeline**

- Método de medir a fidelidade: revisão humana de uma amostra ou avaliador automático com modelo. Proposta: começar pela revisão humana da amostra do gabarito.
- Modelo da redação (Sonnet 5.5 ou Opus 5.5) e tamanho do lote: decididos pela avaliação contra o gabarito.
- ~~Interface da carga~~: decidida na etapa A4 e revista em 22/10/2026. A carga é pela T2 ("Subir documentos"); o comando `npm run carregar-base -- <pasta> [--enviado-por <nome>]` continua como alternativa. O formato dos arquivos `.md` está em `docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`.

## Anexo A. Mudanças da v1 para a v2

| Área | v1 (29/09/2026) | v2 (front publicado) |
| --- | --- | --- |
| Escopo | Só o Workspace | Site público (home, preços, contato), login e abertura animada |
| Tela inicial | Onboarding no primeiro uso | Dashboard com KPIs, status, concluídas por mês e prazos |
| Barra superior | Não especificada | Tinta, 64 px; menu, logo, sino de alertas, menu do usuário com perfil e "Sair" |
| Menu lateral | Não especificado | Grupos Início, Trabalho e Base; recolhível a barra de ícones no desktop; gaveta no celular |
| Alertas de tarefa | Só "notificação dentro do produto" ao terminar | Sino com não lidos + cartão na T3, sincronizados |
| Onboarding | Tela simples de upload | "Primeiros passos": três passos, arrastar e soltar, lista com estados, cartão de dicas |
| Base | Lista com aging; arquivar/excluir em P1 | Tabela com versão, banner do prazo de aging, ordenação e chave Ativar/Desativar |
| Nova RFP | Nome, empresa, tipo, prazo, responsável | + CNPJ com validação e bloco de contatos múltiplos |
| Detalhe da tarefa | Barra com 4 segmentos + contadores | "X de Y aprovados" + barra com 5 estados; cartões de processando, falha e pronta |
| Filtros | Por estado e "com alerta" | Padrão `FilterMenu` (Todos + Filtrar com contagens) em T5, T6 e T9 |
| Revisão | Split view com editor rico | Split view com pilha de alertas, atalhos J/K, editor de texto simples, restaurar sugestão, feedback com motivo; duas etapas no celular |
| Exportação | Uma tarefa | Lista de tarefas com Bloqueada/Pronta/Exportada, "Baixar novamente"; .xlsx |
| Histórico | Só aprovações | Aprovações e revisões, filtro, expansão com fontes |
| Celular | Só leitura abaixo de 768 px | Todas as telas utilizáveis, de 320 px em diante |
| Sistema visual | Sálvia como ação primária; escala tipográfica em aberto | Tinta como ação primária; paleta de dataviz; `FilterMenu` e `SidebarNav` recolhível no design system |
| Backend | Fora do documento | Seção 16 com o contrato de dados e a lista do que é simulado |

## Anexo B. Mudanças da v2 para a v3

| Área | v2 (12/10/2026) | v3 (21/10/2026) |
| --- | --- | --- |
| Pipeline de IA | Fora do documento (só o contrato de dados) | Seção 20: fluxo fixo em código, sem agente, com critérios de qualidade; diagrama em `docs/mvp-resposta-rfp/product/PIPELINE_IA_MVP.md` |
| Entrada da RFP | Planilha, documento, apresentação ou arquivo do Google | Somente `.xlsx` no MVP (F-09, Q-02) |
| Entrada da base | Upload pela interface, vários formatos | Arquivos `.md` enviados pela T2 ou pelo comando de carga (revisto em 22/10/2026; antes, só por comando); demais formatos na Fase 2 (F-01 a F-03, Q-02, Q-14) |
| Telas T1 e T2 | Upload funcional (simulado) | T2 envia `.md` ao backend e mostra o resultado de cada arquivo; a área de envio da T1 segue como protótipo |
| Identificação das perguntas | Não especificada | Regra pela coluna "Pergunta"; modelo pequeno como plano B (F-15 perde urgência) |
| Limites de qualidade da IA | Não definidos | Relevância 80% e fidelidade 90% (Q-25) |
| Formato dos `.md` da base | Não definido | Cabeçalho YAML com `titulo`, `tipo`, `atualizado_em` (obrigatórios) e `versao` (opcional); identidade pelo nome do arquivo (revista em 22/10/2026); data sem alternativa pela data do arquivo; campo desconhecido gera aviso (`docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`) |
| Fases | Upload e formatos não faseados | Envio de `.md` no MVP; outros formatos com conversão e outras entradas de RFP na Fase 2 (seção 19) |
