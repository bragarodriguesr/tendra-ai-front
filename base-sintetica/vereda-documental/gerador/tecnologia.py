from comum import D

DOCS = [
D("tecnologia", "api-referencia-v1.md", "Referência da API REST versão 1", "2026-09-24", "1.6", ["Tecnologia"], """
## 1. Visão geral

A API REST versão 1 permite abrir pedidos, consultar status, receber eventos e baixar documentos autorizados. Está disponível apenas no plano Corporativo e exige que o cliente desenvolva a integração do lado dele. A Vereda não desenvolve integrações sob medida dentro do contrato padrão.

Endereço base no ambiente de produção: `https://api.vereda-sintetica.example/v1`. No ambiente de homologação: `https://api.hml.vereda-sintetica.example/v1`. Os domínios `.example` não existem; são usados apenas neste cenário.

## 2. Autenticação

A API usa OAuth 2.0 com o fluxo de credenciais de cliente (client credentials). Cada integração recebe um identificador e um segredo, criados pelo administrador da empresa no portal. O token de acesso vale por 60 minutos. Os escopos disponíveis são:

| Escopo | Permite |
|---|---|
| `pedidos:escrita` | Abrir e cancelar pedidos |
| `pedidos:leitura` | Consultar pedidos e estados |
| `dossies:leitura` | Consultar dossiês e checklists |
| `documentos:download` | Baixar documentos entregues |
| `eventos:gestao` | Cadastrar e remover endereços de webhook |

O segredo é mostrado uma única vez, no momento da criação. Ele pode ser rotacionado a qualquer momento; o segredo anterior continua válido por 24 horas para permitir a troca sem interrupção.

## 3. Recursos principais

| Método e caminho | Descrição |
|---|---|
| `POST /pedidos` | Abre um pedido; devolve o identificador interno e o estado "Aguardando orçamento" |
| `GET /pedidos/{id}` | Estado atual, protocolo externo e histórico do pedido |
| `POST /pedidos/{id}/cancelar` | Pede o cancelamento operacional |
| `GET /dossies/{id}` | Itens do checklist, documentos e pendências |
| `GET /documentos/{id}/arquivo` | Download do arquivo entregue, com registro no log de auditoria |
| `GET /catalogo` | Tipos documentais e localidades cobertas, conforme a matriz de cobertura |

A aprovação do orçamento não pode ser feita pela API: ela exige um aprovador humano no portal ou no aplicativo.

## 4. Idempotência

Todas as requisições `POST` aceitam o cabeçalho `Idempotency-Key`. Uma mesma chave reenviada em até 24 horas devolve a resposta original, sem abrir outro pedido. Além disso, a regra de duplicidade da plataforma devolve o protocolo anterior para um pedido repetido com o mesmo titular, tipo documental e localidade na mesma janela de solicitação.

## 5. Erros

| Código | Quando acontece |
|---|---|
| 400 | Campo obrigatório ausente ou inválido; a resposta lista os campos |
| 401 | Token ausente, expirado ou inválido |
| 403 | O escopo não permite a operação ou o recurso é de outra unidade |
| 404 | O recurso não existe ou pertence a outra empresa |
| 409 | O pedido não está em um estado que permita a operação |
| 429 | Limite de requisições excedido; ver o documento de limites e capacidade |

## 6. Versões

A versão 1 é a única ativa. Mudanças incompatíveis só entram em uma nova versão, anunciada com 90 dias de antecedência, e a versão anterior é mantida por pelo menos 12 meses depois do anúncio.
"""),

D("tecnologia", "webhooks-eventos.md", "Webhooks e eventos da plataforma", "2026-09-24", "1.2", ["Tecnologia"], """
## 1. Eventos disponíveis

| Evento | Quando é enviado |
|---|---|
| `pedido.estado_alterado` | O pedido muda de estado (por exemplo, de "Protocolado" para "Recebido") |
| `pedido.exigencia` | O emissor registra uma exigência; o evento traz o motivo |
| `documento.entregue` | O documento foi conferido e está disponível no dossiê |
| `documento.vencendo` | Faltam 30 ou 7 dias para o vencimento conhecido |
| `dossie.completo` | Todos os itens obrigatórios do checklist foram cumpridos |

## 2. Cadastro

O administrador cadastra até 5 endereços de webhook por empresa, com o escopo `eventos:gestao`. Cada endereço precisa usar HTTPS com certificado válido. Endereços em redes privadas ou com IP fixo interno são recusados.

## 3. Assinatura

Cada envio traz o cabeçalho `Vereda-Assinatura`, com um HMAC SHA-256 do corpo calculado com o segredo do endereço. O cliente deve conferir a assinatura e o carimbo de tempo, recusando envios com mais de 5 minutos de diferença.

## 4. Entrega e novas tentativas

A plataforma considera entregue o envio que recebe resposta 2xx em até 10 segundos. Sem isso, faz novas tentativas com intervalo crescente: 1 minuto, 5 minutos, 30 minutos, 2 horas e 12 horas. Depois da quinta falha, o endereço é marcado como suspenso e o administrador recebe um e-mail. Os eventos ficam disponíveis para reenvio pelo portal por 7 dias.

## 5. Ordem dos eventos

A ordem de chegada não é garantida. Cada evento traz um número sequencial por pedido e o carimbo de tempo de origem, para o cliente reordenar. Eventos podem chegar duplicados; o campo `id_evento` é único e serve para descartar repetições.

## 6. Conteúdo

O corpo do evento traz identificadores e estados, nunca o conteúdo do documento. Para obter o arquivo, o cliente usa a API de download com o escopo `documentos:download`, o que gera registro no log de auditoria.
"""),

D("tecnologia", "integracoes-erp-crm.md", "Integrações com ERP, CRM e assinatura", "2026-08-21", "1.1", ["Tecnologia", "Produto"], """
## 1. Integrações disponíveis

| Sistema | Tipo de integração | Situação no cenário |
|---|---|---|
| ERP (genérico) | Exportação de gastos por centro de custo em CSV ou pela API | Disponível |
| CRM (genérico) | Abertura de dossiê a partir de uma oportunidade, pela API | Disponível, exige desenvolvimento do cliente |
| Armazenamento em nuvem do cliente | Cópia dos documentos entregues para uma pasta do cliente | Em avaliação |
| Assinatura eletrônica | Envio de documentos do dossiê para assinatura | No roteiro de 2027 |

## 2. O que a Vereda entrega

A Vereda entrega a API, os webhooks, a documentação e um ambiente de homologação. Conectores prontos para sistemas de mercado não fazem parte do contrato padrão. Projetos de integração sob medida podem ser orçados à parte, como serviço profissional.

## 3. Exportação para o ERP

O relatório de gastos por centro de custo pode ser exportado automaticamente todo dia útil, às 6h, para um endereço SFTP do cliente. O arquivo segue o layout descrito no anexo técnico, com uma linha por solicitação concluída e os emolumentos externos separados das taxas da Vereda.

## 4. Responsabilidades

O cliente é responsável pela guarda do segredo da integração, pela conferência das assinaturas dos webhooks e pelo tratamento dos dados que copiar para os próprios sistemas. A Vereda é responsável pela disponibilidade da API conforme o anexo de níveis de serviço.

## 5. Limitações

A integração não permite aprovar orçamentos nem aceitar pendências: essas ações exigem uma pessoa no portal ou no aplicativo. Também não é possível criar usuários pela API; o cadastro de usuários segue pelo portal ou pelo SSO SAML do plano Corporativo.
"""),

D("tecnologia", "limites-desempenho-capacidade.md", "Limites de uso, desempenho e capacidade", "2026-09-18", "1.0", ["Tecnologia"], """
## 1. Limites da API

| Item | Limite |
|---|---|
| Requisições por minuto, por integração | 600 |
| Requisições simultâneas, por integração | 20 |
| Pedidos abertos por requisição em lote | 500 |
| Tamanho máximo do corpo da requisição | 5 MB |

Ao passar do limite, a API responde com o código 429 e o cabeçalho `Retry-After`, em segundos.

## 2. Limites do portal

| Item | Limite |
|---|---|
| Linhas por importação CSV | 5.000 |
| Arquivos por envio manual ao dossiê | 50 |
| Tamanho de arquivo para extração | 50 MB e 200 páginas |
| Usuários simultâneos por empresa | Sem limite contratual; capacidade dimensionada para 2.000 |

## 3. Metas de desempenho

- Abertura de pedido pelo portal: resposta em até 2 segundos em 95% das requisições.
- Consulta de estado pela API: resposta em até 500 milissegundos em 95% das requisições.
- Extração assistida: resultado em até 10 minutos para documentos de até 50 páginas em 90% dos casos.

As metas de desempenho são objetivos internos de engenharia, não compromissos contratuais. Os compromissos de disponibilidade estão no anexo de níveis de serviço.

## 4. Capacidade

A plataforma é dimensionada para processar até 200 mil pedidos por mês no conjunto de clientes. O teste de carga semestral mais recente (cenário fictício, setembro de 2026) sustentou 3 vezes o pico de tráfego observado no trimestre sem degradação das metas.

## 5. Crescimento acima dos limites

Clientes que precisem de limites maiores na API podem pedir um ajuste pelo gerente de conta. O aumento é avaliado pela equipe de tecnologia e formalizado em aditivo, sem custo adicional até 1.200 requisições por minuto.
"""),

D("tecnologia", "ambientes-homologacao.md", "Ambientes de produção e homologação", "2026-08-12", "1.0", ["Tecnologia"], """
## 1. Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| Produção | Operação real do cliente | Dados reais do cliente |
| Homologação | Testes de integração e de novas versões | Apenas dados sintéticos |
| Demonstração | Apresentações comerciais e treinamento | Dados sintéticos fixos |

## 2. Homologação para clientes

Clientes do plano Corporativo recebem acesso ao ambiente de homologação, com as mesmas versões que irão para produção pelo menos 10 dias antes da publicação. No ambiente de homologação, nenhum pedido é enviado a emissores reais: os emissores são simulados e devolvem documentos de exemplo.

## 3. Dados nos ambientes de teste

Dados de produção nunca são copiados para homologação ou demonstração. Testes que precisem de volume usam massas sintéticas geradas por ferramenta interna, com identificadores artificiais no padrão TIT-SINT e IMOV-SINT.

## 4. Separação

Os ambientes ficam em contas de nuvem separadas, com credenciais, chaves de criptografia e redes próprias. Pessoas da equipe de desenvolvimento não têm acesso de escrita à produção; mudanças chegam lá só pelo pipeline de publicação.

## 5. Disponibilidade da homologação

O ambiente de homologação não tem compromisso de disponibilidade. Ele pode ficar indisponível durante a preparação de uma nova versão, com aviso no portal de desenvolvedores.
"""),

D("tecnologia", "ciclo-desenvolvimento-seguro.md", "Ciclo de desenvolvimento seguro", "2026-09-03", "1.4", ["Tecnologia", "Segurança e privacidade"], """
## 1. Etapas

1. **Desenho:** mudanças relevantes passam por análise de ameaças antes do desenvolvimento.
2. **Código:** toda mudança é revisada por outra pessoa antes de entrar na linha principal.
3. **Testes automáticos:** testes unitários, de integração e de isolamento entre empresas rodam em cada mudança.
4. **Análise de segurança:** análise estática de código e verificação de dependências com vulnerabilidades conhecidas rodam no pipeline.
5. **Publicação:** só mudanças com todos os testes verdes e aprovação registrada chegam à produção, sempre com plano de reversão.

## 2. Testes de isolamento

Os testes de isolamento tentam acessar dados de uma empresa a partir do usuário de outra, por todos os recursos da API e do portal. Um único teste falho bloqueia a publicação.

## 3. Dependências

Dependências com vulnerabilidade crítica conhecida bloqueiam a publicação. Vulnerabilidades altas em dependências devem ser corrigidas em até 30 dias, seguindo o prazo da gestão de vulnerabilidades.

## 4. Segredos

Segredos nunca ficam no código. Uma verificação automática procura chaves e senhas em cada mudança e bloqueia a publicação se encontrar alguma.

## 5. Treinamento

Pessoas desenvolvedoras fazem um treinamento anual de desenvolvimento seguro, com foco nas falhas mais comuns em aplicações web e APIs.
"""),

D("tecnologia", "observabilidade-plataforma.md", "Observabilidade e monitoramento técnico", "2026-08-30", "1.1", ["Tecnologia"], """
## 1. O que é monitorado

- Disponibilidade do portal, do aplicativo e da API, medida a cada minuto de três regiões diferentes.
- Tempo de resposta e taxa de erro por recurso da API.
- Fila de eventos e atraso dos webhooks.
- Tempo de processamento da extração assistida.
- Uso de recursos do banco relacional e das réplicas.

## 2. Alertas técnicos

Alertas técnicos vão para a escala de plantão da engenharia. A indisponibilidade do portal ou da API por mais de 3 minutos aciona imediatamente o responsável por incidentes.

## 3. Página de status

A página de status pública mostra a situação do portal, da API, do aplicativo e da extração. Durante um incidente de severidade 1, ela é atualizada a cada 60 minutos, como prevê o plano de continuidade.

## 4. Métricas para o cliente

O relatório mensal de disponibilidade é enviado ao contato corporativo de cada cliente do plano Corporativo até o quinto dia útil do mês seguinte. Ele mostra a disponibilidade medida, as manutenções programadas e os incidentes do mês.

## 5. Retenção de métricas técnicas

Métricas técnicas agregadas são guardadas por 13 meses, para comparação com o mesmo mês do ano anterior. Elas não contêm conteúdo de documentos nem dados de titulares.
"""),

D("tecnologia", "modelo-dados-retencao-tecnica.md", "Modelo de dados e retenção técnica", "2026-09-11", "1.0", ["Tecnologia", "Segurança e privacidade"], """
## 1. Entidades principais

| Entidade | Conteúdo | Dono |
|---|---|---|
| Empresa | Dados cadastrais, plano, unidades | Cliente |
| Usuário | Nome, e-mail corporativo, perfil, unidades | Cliente |
| Pedido | Tipo documental, titular, localidade, estado, orçamento | Cliente |
| Documento | Arquivo recebido, campos extraídos, conferência | Cliente |
| Dossiê | Checklist, pendências, histórico | Cliente |
| Log de auditoria | Ações de usuários e integrações | Vereda, por obrigação de segurança |

Todas as entidades do cliente carregam o identificador da empresa, e as políticas de acesso por linha do banco impedem consultas sem esse identificador.

## 2. Onde os dados ficam

Os dados ficam no provedor fictício Nuvem Aurora, na região de São Paulo, com cópia para a região secundária no Brasil. Arquivos de documentos ficam em armazenamento de objetos criptografado; dados estruturados, no banco relacional com réplicas.

## 3. Retenção técnica

| Dado | Prazo |
|---|---|
| Arquivos temporários da extração | Apagados em até 30 dias |
| Cópias de backup | 35 dias |
| Dados operacionais após o fim do contrato | Eliminados em até 90 dias, salvo retenção documentada |

## 4. Devolução dos dados

No fim do contrato, o cliente pode pedir a exportação completa dos dossiês e documentos em até 30 dias. Depois disso, a eliminação segue o prazo de 90 dias, com certificado de eliminação enviado ao contato corporativo.
"""),

D("tecnologia", "gestao-mudancas-releases.md", "Gestão de mudanças e publicação de versões", "2026-07-22", "1.2", ["Tecnologia"], """
## 1. Tipos de mudança

| Tipo | Exemplo | Aprovação |
|---|---|---|
| Padrão | Nova versão mensal, já testada em homologação | Responsável técnico |
| Normal | Mudança de infraestrutura ou de banco de dados | Comitê de mudanças |
| Emergencial | Correção de falha que afeta clientes | Responsável por incidentes, com registro posterior no comitê |

## 2. Janela de publicação

As versões mensais são publicadas na primeira terça-feira do mês, entre 22h e 2h, horário de Brasília. Mudanças que exigem indisponibilidade são manutenções programadas, avisadas ao contato corporativo com 72 horas de antecedência, como prevê o anexo de níveis de serviço.

## 3. Plano de reversão

Toda mudança tem plano de reversão testado em homologação. Se os indicadores de erro passarem do limite definido nos primeiros 30 minutos depois da publicação, a reversão é automática.

## 4. Comunicação

As notas de versão são publicadas no centro de ajuda no dia da publicação. Mudanças que afetam a API são anunciadas com 90 dias de antecedência no portal de desenvolvedores.

## 5. Registro

Cada mudança fica registrada com descrição, aprovador, data, resultado dos testes e eventual reversão. O registro é guardado por 24 meses e pode ser apresentado em auditorias de clientes do plano Corporativo.
"""),

D("tecnologia", "arquitetura-ia-extracao.md", "Arquitetura da extração assistida por IA", "2026-10-01", "1.1", ["Tecnologia", "Segurança e privacidade"], """
## 1. Etapas do processamento

1. **Recepção:** o arquivo chega do emissor ou do envio manual e recebe uma verificação de formato e de vírus.
2. **Reconhecimento de texto:** PDFs digitalizados e imagens passam por OCR; PDFs pesquisáveis usam o texto embutido.
3. **Classificação do tipo documental:** um modelo identifica o tipo (por exemplo, certidão trabalhista ou matrícula).
4. **Extração de campos:** um modelo de linguagem preenche os campos do tipo documental e indica a página e o trecho de cada um.
5. **Conferência automática:** o código confere se o trecho indicado existe no texto do documento; campo sem trecho válido é descartado.
6. **Fila de conferência:** o analista do cliente revisa os campos, começando pelos de confiança baixa.

## 2. Modelos usados

Os modelos de linguagem são usados por meio de um provedor de IA contratado pela Vereda, com cláusula que proíbe o uso dos dados para treinar modelos gerais. A inferência fica restrita ao serviço contratado, com retenção técnica de 30 dias no provedor.

## 3. Isolamento

Cada documento é processado de forma isolada, sem mistura com documentos de outras empresas. Instruções escritas dentro de um documento são tratadas como conteúdo, nunca como comando para o modelo.

## 4. Avaliação contínua

A qualidade da extração é medida mensalmente contra um conjunto sintético de 400 documentos rotulados. Uma nova versão de modelo ou de instrução só entra em produção se mantiver pelo menos 95% de campos corretos no conjunto de avaliação.
"""),

D("tecnologia", "suporte-tecnico-niveis.md", "Suporte técnico e níveis de atendimento", "2026-06-25", "1.1", ["Tecnologia"], """
## 1. Canais

| Canal | Horário | Planos |
|---|---|---|
| Centro de ajuda e chamados pelo portal | Sempre disponível para abertura | Todos |
| E-mail de suporte | Dias úteis, das 8h às 20h | Todos |
| Telefone de plantão para severidade 1 | 24 horas, 7 dias por semana | Corporativo |
| Gerente de conta | Dias úteis, horário comercial | Corporativo |

## 2. Severidades

| Severidade | Descrição | Primeira resposta |
|---|---|---|
| 1 | Plataforma indisponível ou falha que impede todos os pedidos | 30 minutos |
| 2 | Funcionalidade principal degradada, com contorno | 4 horas úteis |
| 3 | Dúvida, falha pontual ou pedido de melhoria | 1 dia útil |

A meta de restauração para severidade 1 está no anexo de níveis de serviço.

## 3. Escalonamento

Chamados de severidade 1 sem solução em 2 horas são escalados para o diretor de tecnologia. O cliente pode pedir o escalonamento de qualquer chamado pelo gerente de conta.

## 4. Idioma

O atendimento é feito em português. Atendimento em inglês está disponível só por e-mail, no plano Corporativo.
"""),

D("tecnologia", "requisitos-navegadores-acessibilidade.md", "Requisitos de navegadores e acessibilidade", "2026-05-14", "1.0", ["Tecnologia", "Produto"], """
## 1. Navegadores suportados

O portal funciona nas duas versões mais recentes do Chrome, Edge, Firefox e Safari. Navegadores fora dessa lista podem funcionar, mas não recebem correção de falhas específicas.

## 2. Requisitos da estação

- Resolução mínima de 1280 por 720 pixels.
- Conexão de pelo menos 5 Mbps para envio de arquivos grandes.
- Cookies e JavaScript habilitados para o domínio do portal.

## 3. Acessibilidade

O portal segue as diretrizes WCAG 2.1 no nível AA nas telas de pedido, dossiê e relatórios. Todas as ações podem ser feitas pelo teclado, e os campos têm rótulos lidos por leitores de tela. A avaliação de acessibilidade mais recente foi interna, em maio de 2026; não há certificação externa.

## 4. Pendências conhecidas

O visualizador de documentos digitalizados ainda não oferece texto alternativo para imagens sem OCR. A correção está prevista para o primeiro semestre de 2027.
"""),
]
