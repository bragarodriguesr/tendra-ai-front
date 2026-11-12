from comum import D

DOCS = [
D("produto", "visao-geral-plataforma.md", "Visão geral da plataforma Vereda", "2026-09-30", "2.1", ["Produto"], """
## 1. O que a plataforma faz

A plataforma Vereda reúne em um só lugar a solicitação de documentos a emissores, a organização desses documentos em dossiês digitais e a pré-análise assistida do conteúdo. O objetivo é reduzir o tempo que equipes de crédito, jurídico, compras e operações imobiliárias gastam reunindo certidões, matrículas e atos societários antes de uma decisão.

A plataforma não decide pelo cliente. Ela organiza, acompanha prazos, aponta divergências e mostra de onde veio cada informação, sempre com página e trecho do documento de origem.

## 2. Módulos

| Módulo | Para que serve | Disponível em |
|---|---|---|
| Solicitação | Pedir certidões e documentos a emissores, com orçamento e acompanhamento | Essencial, Profissional e Corporativo |
| Dossiês | Agrupar documentos por negócio, titular ou imóvel, com checklist | Essencial, Profissional e Corporativo |
| Extração assistida | Ler campos dos documentos e indicar página e trecho | Profissional e Corporativo |
| Análise assistida | Comparar documentos entre si e destacar divergências | Corporativo |
| API e webhooks | Integrar pedidos e status com sistemas do cliente | Corporativo |

## 3. Quem usa

- **Solicitante:** abre pedidos, acompanha o andamento e baixa documentos.
- **Analista:** confere o que a extração encontrou, corrige campos e registra justificativas.
- **Aprovador:** autoriza despesas acima do limite configurado pela empresa.
- **Administrador:** cria usuários, unidades e centros de custo.
- **Auditor de consulta:** só lê dossiês e histórico, sem alterar nada.

## 4. Princípios do produto

1. **Fonte sempre visível.** Toda informação extraída aponta para a página e o trecho de onde saiu.
2. **Sem inferência para completar lacunas.** Quando o documento não traz o dado, o campo fica vazio ou "inconclusivo".
3. **Decisão humana registrada.** Correções e aceites de pendência guardam quem decidiu, quando e por quê.
4. **Custo aprovado antes.** Nenhuma despesa com emissores é feita sem orçamento aprovado pelo cliente.

## 5. Limites conhecidos

A plataforma não é cartório, órgão emissor nem escritório de advocacia. A cobertura de emissores varia por município e tipo documental e é confirmada antes de cada protocolo. A análise assistida não substitui parecer jurídico nem avaliação de crédito.
"""),

D("produto", "modulo-certidoes-solicitacao.md", "Módulo de solicitação de certidões", "2026-09-26", "1.4", ["Produto"], """
## 1. Abertura do pedido

O solicitante escolhe o tipo documental, o titular (pessoa física ou jurídica, sempre com identificador sintético no ambiente de demonstração), a localidade e a finalidade. Pedidos em lote podem ser importados por planilha CSV, com validação linha a linha antes da confirmação.

Campos obrigatórios por pedido: tipo documental, titular, unidade federativa, município quando o emissor for municipal, finalidade e centro de custo.

## 2. Orçamento

Antes do protocolo, a plataforma monta o orçamento com a taxa da Vereda por solicitação concluída e a estimativa de emolumentos externos informada pelo emissor. O pedido só segue depois da aprovação no portal. Despesas acima do limite da empresa exigem um aprovador diferente de quem abriu o pedido.

## 3. Acompanhamento

Cada pedido mostra o estado atual, a data de protocolo, o canal usado e o prazo estimado do emissor. Mudanças de estado geram notificação por e-mail e, no plano Corporativo, também por webhook.

| Estado | O que significa |
|---|---|
| Aguardando orçamento | A estimativa de custos ainda não foi aprovada |
| Protocolado | O pedido foi enviado ao emissor |
| Exigência do emissor | O emissor pediu documento ou informação adicional |
| Recebido | O arquivo chegou do emissor e está em conferência |
| Entregue | O documento está disponível no dossiê |

## 4. Renovação

Quando a validade de um documento é conhecida, a plataforma sugere a renovação a 30 e a 7 dias do vencimento. A renovação abre um novo pedido ligado ao anterior, com o mesmo titular e localidade, e passa de novo pelo orçamento.

## 5. O que o módulo não faz

O módulo não contorna exigências de procuração, não usa credenciais pessoais de terceiros e não marca um documento como "negativo" quando o emissor está indisponível. Falhas do emissor ficam registradas e o pedido é tentado de novo.
"""),

D("produto", "modulo-dossies-checklists.md", "Dossiês digitais e checklists", "2026-09-20", "1.3", ["Produto"], """
## 1. Estrutura do dossiê

Um dossiê agrupa os documentos de um mesmo negócio. Pode ser organizado por operação (por exemplo, uma compra de imóvel), por titular ou por imóvel. Cada dossiê tem responsável, prazo, checklist e histórico de versões.

## 2. Checklists configuráveis

A empresa cria modelos de checklist por tipo de operação. Cada item do checklist indica o tipo documental esperado, se é obrigatório e quem pode aceitar uma pendência.

Modelos prontos no ambiente de demonstração:
- aquisição de imóvel urbano;
- crédito rural com garantia de imóvel;
- homologação de fornecedor;
- abertura de conta de pessoa jurídica.

## 3. Estados do dossiê

| Estado | Regra |
|---|---|
| Em montagem | Há itens obrigatórios sem documento |
| Em conferência | Todos os itens obrigatórios têm documento, mas falta conferência do analista |
| Completo | Todos os obrigatórios entregues e conferidos, ou com pendência aceita e justificada |
| Encerrado | Dossiê arquivado; só leitura |

Um dossiê "Completo" quer dizer que a lista foi cumprida, não que o negócio não tem risco.

## 4. Pendências

Uma pendência aceita exige justificativa escrita e um aprovador com permissão para o checklist. O aceite fica no histórico e aparece no relatório do dossiê.

## 5. Compartilhamento

Dossiês podem ser compartilhados com usuários de outra unidade da mesma empresa, com permissão de leitura ou edição. O compartilhamento externo, com um escritório parceiro, gera um link com prazo de até 15 dias e registro de cada acesso.

## 6. Exportação

O dossiê pode ser exportado em um arquivo compactado com os documentos e um índice em PDF com o checklist, as pendências aceitas e o histórico. A exportação fica registrada no log de auditoria.
"""),

D("produto", "modulo-extracao-campos.md", "Campos extraídos por tipo documental", "2026-10-02", "1.2", ["Produto", "Tecnologia"], """
## 1. Como ler esta tabela

A extração assistida lê os documentos recebidos e preenche campos. Cada campo traz a página e o trecho de origem. Quando o documento não traz o dado, o campo fica vazio. A extração não completa informação por dedução.

## 2. Campos por tipo documental

| Tipo documental | Campos extraídos |
|---|---|
| Certidão de débitos fiscais | Emissor, titular, data de emissão, validade, resultado (com ou sem apontamento) |
| Certidão trabalhista | Emissor, titular, data de emissão, validade, processos mencionados |
| Certidão de distribuição judicial | Comarca, titular, período pesquisado, ações listadas |
| Matrícula de imóvel | Número da matrícula, cartório, descrição do imóvel, proprietários, ônus e averbações |
| Contrato social e alterações | Razão social, capital, sócios, administradores, poderes de representação |
| Cédula de produto rural | Emitente, credor, produto, safra, quantidade, garantias mencionadas |

## 3. Classificação do resultado

As certidões recebem uma de quatro classes: sem apontamento, com apontamento, inconclusivo e ilegível. Um documento ilegível nunca é tratado como sem apontamento.

## 4. Confiança e revisão

Cada campo tem um indicador de confiança (alta, média ou baixa). Campos com confiança baixa aparecem primeiro na fila de conferência do analista. O analista confirma ou corrige o campo e registra o motivo da correção.

## 5. Idiomas e formatos

A extração funciona com documentos em português. Documentos em inglês e espanhol são aceitos para leitura e busca, mas sem extração de campos estruturados. Formatos aceitos: PDF pesquisável, PDF digitalizado e imagens PNG ou JPEG, até 50 MB e 200 páginas por arquivo.
"""),

D("produto", "painel-relatorios-indicadores.md", "Painel de relatórios e indicadores", "2026-08-28", "1.1", ["Produto"], """
## 1. Painel principal

O painel mostra, para o período escolhido, o total de pedidos por estado, o tempo médio por etapa, os gastos por centro de custo e os documentos com vencimento nos próximos 30 dias.

## 2. Relatórios disponíveis

| Relatório | Conteúdo | Formatos |
|---|---|---|
| Pedidos por estado | Quantidade e lista de pedidos em cada estado | Tela e CSV |
| Gastos por centro de custo | Taxas da Vereda e emolumentos externos aprovados | Tela, CSV e PDF |
| Tempo por etapa | Do pedido ao protocolo, do protocolo ao recebimento e do recebimento à entrega | Tela e CSV |
| Vencimentos | Documentos com validade conhecida que vencem no período | Tela e CSV |
| Pendências aceitas | Pendências de dossiê aceitas, com justificativa e aprovador | Tela e PDF |

## 3. Filtros

Todos os relatórios podem ser filtrados por unidade, centro de custo, tipo documental, emissor, solicitante e período. O filtro escolhido pode ser salvo como visão pessoal.

## 4. Envio programado

Relatórios podem ser enviados por e-mail com periodicidade diária, semanal ou mensal para usuários da própria empresa. O envio para endereços externos não é permitido.

## 5. Dados usados

Os indicadores usam apenas os dados da empresa do usuário. O tempo por etapa considera dias úteis e exclui o período em que o pedido ficou em "Exigência do emissor", aguardando resposta do cliente.
"""),

D("produto", "alertas-vencimento-renovacao.md", "Alertas de vencimento e renovação", "2026-09-02", "1.0", ["Produto"], """
## 1. Quando o alerta existe

O alerta de vencimento só é criado quando a validade é conhecida: transcrita do próprio documento ou definida por uma regra do emissor cadastrada na matriz de cobertura. Documento sem validade documentada não recebe vencimento presumido.

## 2. Antecedência

| Momento | Aviso |
|---|---|
| 30 dias antes | E-mail ao responsável pelo dossiê e item na lista de vencimentos |
| 7 dias antes | Novo e-mail ao responsável e ao aprovador da unidade |
| No vencimento | O item do checklist volta para "pendente" no dossiê |

A antecedência pode ser alterada pelo administrador entre 5 e 60 dias.

## 3. Renovação automática

No plano Corporativo, o administrador pode ligar a renovação automática por tipo documental. Com ela ligada, a plataforma abre o pedido de renovação 30 dias antes do vencimento e o envia para aprovação do orçamento. Nada é protocolado sem a aprovação.

## 4. Documentos vencidos em dossiês encerrados

Dossiês encerrados não geram alertas. Se o dossiê for reaberto, os vencimentos voltam a ser calculados a partir da data da reabertura.
"""),

D("produto", "aplicativo-movel-aprovacoes.md", "Aplicativo móvel para aprovações", "2026-07-08", "1.0", ["Produto"], """
## 1. Objetivo

O aplicativo móvel permite que aprovadores autorizem orçamentos, aceitem pendências e consultem dossiês fora do computador. Ele não permite abrir pedidos em lote nem alterar configurações da empresa.

## 2. Funcionalidades

- Lista de orçamentos aguardando aprovação, com valor e centro de custo.
- Aprovação ou recusa com justificativa obrigatória na recusa.
- Consulta de dossiês em modo leitura, com download de documentos quando o perfil permite.
- Notificações de pedidos em "Exigência do emissor".

## 3. Requisitos

O aplicativo está disponível para Android 12 ou superior e iOS 16 ou superior. O acesso exige MFA e é bloqueado em aparelhos com sistema modificado (root ou jailbreak).

## 4. Sessão

A sessão do aplicativo expira após 15 minutos sem uso. O login com biometria do aparelho pode ser ligado pelo usuário depois do primeiro acesso com senha e MFA.

## 5. Dados no aparelho

Documentos baixados ficam em área protegida do aplicativo e são apagados ao sair da conta. O aplicativo não envia documentos para a galeria nem para outros aplicativos.
"""),

D("produto", "roteiro-produto-2027.md", "Roteiro de produto 2027", "2026-10-06", "0.9", ["Produto"], """
## 1. Como ler este roteiro

Este roteiro mostra a direção do produto. As datas são previsões internas do cenário fictício e podem mudar. Nenhum item deste documento é compromisso contratual.

## 2. Primeiro semestre de 2027

| Item | Descrição | Situação |
|---|---|---|
| Extração em inglês | Campos estruturados para certidões e contratos em inglês | Em desenvolvimento |
| Comparação de versões de contrato social | Destacar o que mudou entre duas alterações contratuais | Em desenho |
| Integração com assinatura eletrônica | Enviar documentos do dossiê para assinatura sem sair da plataforma | Em avaliação |

## 3. Segundo semestre de 2027

| Item | Descrição | Situação |
|---|---|---|
| Painel de risco documental | Consolidar apontamentos de certidões por titular | Em avaliação |
| Checklists por setor regulado | Modelos para saúde, energia e saneamento | Em avaliação |

## 4. Fora do roteiro

Concessão de crédito, emissão de parecer jurídico e registro de garantias não fazem parte do roteiro. A plataforma continua como apoio documental à decisão do cliente.
"""),

D("produto", "implantacao-onboarding.md", "Plano de implantação e treinamento", "2026-09-17", "1.2", ["Produto", "Comercial"], """
## 1. Fases da implantação

| Fase | Duração típica | Entregas |
|---|---|---|
| Preparação | 1 semana | Cadastro da empresa, unidades e centros de custo |
| Configuração | 2 semanas | Perfis, limites de aprovação e modelos de checklist |
| Piloto | 2 a 4 semanas | Uso com uma unidade e acompanhamento semanal |
| Expansão | Conforme o cliente | Liberação para as demais unidades |

Nos planos Essencial e Profissional, a implantação é remota e padronizada. No plano Corporativo, há um gerente de implantação dedicado durante as três primeiras fases.

## 2. Treinamento

- Treinamento de administradores: 2 sessões de 2 horas.
- Treinamento de solicitantes e analistas: 1 sessão de 2 horas por turma de até 25 pessoas.
- Material em vídeo e guia de uso disponíveis no centro de ajuda.

Sessões adicionais de treinamento são cobradas à parte, conforme a tabela de preços vigente.

## 3. Migração de dados

A Vereda importa documentos e dossiês existentes a partir de planilhas e pastas de arquivos organizadas pelo cliente. A migração é limitada a 5.000 documentos no plano Corporativo; volumes maiores são orçados separadamente.

## 4. Critério de conclusão

A implantação é concluída quando a unidade piloto opera por duas semanas seguidas sem chamados de severidade 1 ou 2 abertos e o cliente assina o termo de aceite.
"""),

D("produto", "manual-perfis-permissoes.md", "Manual de perfis e permissões do portal", "2026-09-09", "1.3", ["Produto", "Segurança e privacidade"], """
## 1. Perfis padrão

| Perfil | Pode | Não pode |
|---|---|---|
| Administrador | Criar usuários, unidades e limites; ver todos os dossiês da empresa | Aprovar o próprio orçamento |
| Solicitante | Abrir pedidos e dossiês, anexar documentos | Aprovar despesas |
| Analista | Conferir e corrigir campos extraídos, aceitar pendências quando autorizado | Alterar limites de aprovação |
| Aprovador | Aprovar orçamentos e pendências da sua unidade | Abrir pedidos em nome de outro usuário |
| Auditor de consulta | Ler dossiês, histórico e logs da empresa | Alterar qualquer dado |

## 2. Segregação de funções

Quem abre um pedido não pode aprovar o orçamento do mesmo pedido. A regra vale mesmo para administradores e não pode ser desligada.

## 3. Escopo por unidade

Cada usuário pertence a uma ou mais unidades. O acesso a dossiês, pedidos e relatórios é limitado às unidades do usuário, exceto para administradores e auditores de consulta da empresa.

## 4. Perfis personalizados

No plano Corporativo, o administrador pode criar perfis personalizados a partir das permissões disponíveis. A criação e a alteração de perfis ficam registradas no log de auditoria.

## 5. Revisão de acessos pelo cliente

A plataforma gera mensalmente um relatório de usuários, perfis e último acesso para o administrador da empresa. O termo do administrador prevê a revisão trimestral das permissões pela contratante.
"""),

D("produto", "notas-versao-2026.md", "Notas de versão da plataforma em 2026", "2026-10-09", "2026.10", ["Produto", "Tecnologia"], """
## Versão 2026.10

- Exportação do dossiê com índice em PDF e histórico de pendências aceitas.
- Filtro salvo por usuário em todos os relatórios.
- Correção: relatórios de tempo por etapa passam a excluir dias em "Exigência do emissor".

## Versão 2026.08

- Aplicativo móvel com aprovação de orçamentos para Android e iOS.
- Novo estado de pedido "Aguardando autorização" para canais que exigem procuração.
- Limite de arquivo da extração aumentado de 30 MB para 50 MB.

## Versão 2026.06

- Webhooks de mudança de estado de pedido no plano Corporativo.
- Modelos de checklist para crédito rural e homologação de fornecedor.
- Melhoria no indicador de confiança dos campos extraídos de matrículas.

## Versão 2026.03

- SSO SAML 2.0 no plano Corporativo.
- Importação de pedidos em lote por CSV com validação linha a linha.
- Correção: certidões ilegíveis deixam de aparecer como "sem apontamento" no relatório.

## Política de versões

Versões mensais são publicadas na primeira terça-feira do mês, fora do horário comercial. Mudanças que afetam a API são anunciadas com 90 dias de antecedência e mantêm a versão anterior em paralelo.
"""),

D("produto", "fluxo-due-diligence-ma.md", "Fluxo de due diligence para fusões e aquisições", "2026-09-29", "1.0", ["Produto", "Jurídico"], """
## 1. Objetivo

Este fluxo organiza a coleta de documentos de uma empresa-alvo em operações de fusão ou aquisição. Ele apoia a equipe do cliente e os assessores jurídicos, sem substituir a análise deles.

## 2. Sala de documentos

O dossiê de due diligence funciona como uma sala de documentos virtual. A empresa-alvo recebe um acesso de envio limitado ao dossiê, sem ver outros dossiês do cliente. Cada envio fica registrado com data, usuário e arquivo.

## 3. Lista de pedidos

A lista padrão cobre:
- atos societários e livro de registro de ações ou quotas;
- certidões fiscais, trabalhistas e judiciais da empresa e dos sócios;
- matrículas dos imóveis próprios e contratos de locação;
- contratos relevantes com clientes e fornecedores;
- licenças e autorizações de funcionamento.

## 4. Perguntas e respostas

Os assessores registram perguntas por item da lista. A resposta da empresa-alvo fica ligada ao item e ao documento enviado. Perguntas sem resposta aparecem no relatório de pendências.

## 5. Confidencialidade

O acesso da empresa-alvo e dos assessores externos exige aceite do termo de confidencialidade da operação antes do primeiro login. O download pode ser bloqueado por item, deixando só a visualização com marca d'água com o nome do usuário.
"""),
]
