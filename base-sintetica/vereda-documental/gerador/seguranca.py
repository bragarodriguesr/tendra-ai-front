from comum import D

DOCS = [
D("seguranca", "politica-privacidade-plataforma.md", "Política de privacidade da plataforma", "2026-09-27", "2.0", ["Segurança e privacidade"], """
## 1. A quem se aplica

Esta política se aplica aos dados pessoais tratados pela plataforma Vereda: dos usuários das empresas clientes e dos titulares que aparecem nos documentos solicitados e organizados pelo cliente.

## 2. Papéis no tratamento

- **Dados de titulares nos documentos:** a empresa cliente define a finalidade e quais titulares entram nos pedidos. A Vereda trata esses dados por conta do cliente, conforme as instruções do contrato e do acordo de tratamento de dados.
- **Dados de usuários do portal:** a Vereda trata nome, e-mail corporativo e registros de acesso para operar a conta e manter a segurança da plataforma.
- **Emissores e fontes oficiais:** têm responsabilidades próprias sobre os documentos que emitem.

## 3. Dados tratados

| Categoria | Exemplos | Finalidade |
|---|---|---|
| Identificação do titular | Nome, identificador documental | Solicitar e organizar documentos pedidos pelo cliente |
| Conteúdo documental | Certidões, matrículas, atos societários | Organização e extração assistida |
| Dados de usuários | Nome, e-mail corporativo, perfil | Acesso ao portal e segurança |
| Registros de acesso | Login, ações, endereço IP | Segurança, auditoria e investigação de incidentes |

## 4. Compartilhamento

Dados são compartilhados apenas com os emissores necessários para atender o pedido e com os subprocessadores listados no documento de gestão de fornecedores. A Vereda não vende dados nem os usa para publicidade.

## 5. Encarregado

O encarregado pelo tratamento de dados no cenário é identificado como DPO-SINT-001, pelo contato dpo@vereda-sintetica.example. O domínio .example não recebe mensagens; o contato existe só para testes.

## 6. Direitos dos titulares

Pedidos de titulares chegam pelo canal autenticado e são encaminhados ao controlador responsável, conforme o procedimento de direitos dos titulares.
"""),

D("seguranca", "ripd-extracao-documental.md", "Relatório de impacto: extração documental assistida", "2026-08-19", "1.0", ["Segurança e privacidade"], """
## 1. Escopo da avaliação

Este relatório de impacto à proteção de dados avalia o módulo de extração assistida, que lê documentos com dados de titulares e preenche campos estruturados com ajuda de modelos de linguagem.

## 2. Riscos identificados

| Risco | Probabilidade | Impacto | Medida |
|---|---|---|---|
| Uso de documentos para treinar modelos gerais | Baixa | Alto | Contrato com o provedor de IA proíbe o treinamento; auditoria anual do contrato |
| Extração de dados além da finalidade | Média | Médio | Campos extraídos limitados por tipo documental |
| Erro de extração levando a decisão errada | Média | Alto | Conferência humana obrigatória e campos sem trecho válido descartados |
| Acesso indevido entre empresas | Baixa | Alto | Isolamento por empresa testado a cada publicação |
| Retenção excessiva no provedor de IA | Baixa | Médio | Retenção técnica de 30 dias, verificada trimestralmente |

## 3. Dados sensíveis

O módulo não foi desenhado para tratar dados pessoais sensíveis. Quando um documento contém dado sensível (por exemplo, informação de saúde em uma certidão judicial), a extração não cria campo estruturado para ele; o texto fica apenas no arquivo original.

## 4. Conclusão

O risco residual foi considerado aceitável pela comissão de privacidade, com revisão anual ou a cada mudança relevante no provedor de IA. Esta avaliação é interna e não constitui certificação.
"""),

D("seguranca", "plano-resposta-incidentes.md", "Plano de resposta a incidentes de segurança", "2026-09-19", "1.5", ["Segurança e privacidade"], """
## 1. Classificação

| Severidade | Exemplo |
|---|---|
| Crítica | Acesso indevido confirmado a dados de clientes |
| Alta | Suspeita fundamentada de acesso indevido ou vazamento |
| Média | Tentativa de ataque contida, sem acesso a dados |
| Baixa | Evento de segurança sem impacto |

## 2. Etapas

1. **Detecção e triagem:** alertas do monitoramento são triados em até 15 minutos.
2. **Contenção:** isolar sistemas afetados e preservar evidências.
3. **Investigação:** identificar a causa, o alcance e os dados envolvidos.
4. **Comunicação:** avisar os clientes afetados e, quando aplicável, a autoridade de proteção de dados.
5. **Recuperação:** restaurar a operação normal.
6. **Lições aprendidas:** relatório final em até 15 dias após o encerramento.

## 3. Comunicação ao cliente

Incidentes que afetem dados do cliente são comunicados ao contato corporativo em até 72 horas após a confirmação, com a descrição do ocorrido, os dados envolvidos, as medidas tomadas e as próximas ações. A comunicação inicial pode ser complementada à medida que a investigação avança.

## 4. Equipe

A resposta é coordenada pelo responsável por incidentes, com apoio das lideranças de tecnologia, segurança, privacidade e jurídico. O encarregado de dados participa sempre que houver dados pessoais envolvidos.

## 5. Exercícios

A equipe faz um exercício de mesa de resposta a incidentes a cada semestre, com um cenário diferente a cada vez.
"""),

D("seguranca", "gestao-vulnerabilidades.md", "Gestão de vulnerabilidades", "2026-09-06", "1.3", ["Segurança e privacidade", "Tecnologia"], """
## 1. Fontes

Vulnerabilidades chegam por varreduras automáticas, análise de dependências, testes de intrusão, avisos de fornecedores e o canal de divulgação responsável.

## 2. Prazos de correção

| Severidade | Prazo |
|---|---|
| Crítica | 15 dias corridos |
| Alta | 30 dias corridos |
| Média | 90 dias corridos |
| Baixa | Próximo ciclo de manutenção |

Quando a correção não é possível no prazo, uma medida de contenção é aplicada e a exceção é aprovada pelo responsável de segurança, com nova data.

## 3. Varreduras

- Varredura de infraestrutura externa: trimestral, como prevê a política de segurança.
- Varredura de dependências: em cada publicação.
- Varredura de configuração da nuvem: semanal.

## 4. Divulgação responsável

Pesquisadores podem relatar vulnerabilidades pelo endereço seguranca@vereda-sintetica.example. O relato recebe confirmação em até 2 dias úteis. O programa não paga recompensas no cenário.

## 5. Indicadores

O comitê de segurança acompanha mensalmente o número de vulnerabilidades abertas por severidade e o percentual corrigido dentro do prazo. A meta é 100% das críticas dentro do prazo.
"""),

D("seguranca", "criptografia-chaves.md", "Norma de criptografia e gestão de chaves", "2026-08-05", "1.1", ["Segurança e privacidade", "Tecnologia"], """
## 1. Em repouso

Bancos de dados, armazenamento de objetos e cópias de backup são criptografados com AES-256. As chaves ficam no serviço de gestão de chaves do provedor de nuvem, separadas por ambiente.

## 2. Em trânsito

Todo tráfego externo usa TLS 1.2 ou superior. Conexões com TLS 1.0 e 1.1 são recusadas. O tráfego interno entre serviços também é criptografado.

## 3. Rotação

| Chave | Rotação |
|---|---|
| Chaves de criptografia de dados | Anual, automática |
| Segredos de integração da API | A critério do cliente, a qualquer momento |
| Certificados TLS | Antes do vencimento, automática |

## 4. Acesso às chaves

Nenhuma pessoa tem acesso direto às chaves de criptografia de dados. Operações administrativas sobre chaves exigem aprovação de duas pessoas e ficam registradas.

## 5. Chave gerenciada pelo cliente

A opção de chave gerenciada pelo próprio cliente não está disponível. Ela foi avaliada e não entrou no roteiro de 2027.
"""),

D("seguranca", "gestao-fornecedores-subprocessadores.md", "Gestão de fornecedores e subprocessadores", "2026-09-21", "1.2", ["Segurança e privacidade", "Jurídico"], """
## 1. Subprocessadores atuais

| Fornecedor | Serviço | Local de tratamento |
|---|---|---|
| Nuvem Aurora (fictício) | Infraestrutura de nuvem, banco de dados e armazenamento | Brasil |
| Mensageria Ipê (fictício) | Envio de e-mails e notificações | Brasil |
| Provedor de IA (fictício) | Inferência dos modelos da extração assistida | Estados Unidos, com cláusulas contratuais padrão |

## 2. Avaliação

Cada subprocessador passa por avaliação de segurança e privacidade antes da contratação e uma vez por ano depois disso. A avaliação considera certificações, questionário de segurança, contrato de tratamento de dados e histórico de incidentes.

## 3. Aviso de mudança

Clientes do plano Corporativo são avisados com 30 dias de antecedência sobre a inclusão de um novo subprocessador. O cliente pode se opor, com justificativa, dentro desse prazo; se não houver acordo, pode rescindir o contrato sem multa.

## 4. Transferência internacional

O provedor de IA processa dados fora do Brasil. A transferência segue cláusulas contratuais padrão e a retenção técnica é limitada a 30 dias, sem uso para treinamento de modelos gerais.

## 5. Encerramento

No fim do contrato com um subprocessador, a Vereda exige a eliminação dos dados e um certificado de eliminação em até 30 dias.
"""),

D("seguranca", "norma-uso-aceitavel.md", "Norma de uso aceitável da plataforma", "2026-04-28", "1.0", ["Segurança e privacidade", "Jurídico"], """
## 1. Usos permitidos

A plataforma deve ser usada para solicitar, organizar e analisar documentos com finalidade legítima, ligada às atividades da empresa cliente, como concessão de crédito, compra de imóveis, homologação de fornecedores e due diligence.

## 2. Usos proibidos

- Solicitar documentos de pessoas sem finalidade legítima ou sem base legal.
- Usar credenciais de outra pessoa ou compartilhar a própria.
- Tentar acessar dados de outras empresas ou contornar controles de acesso.
- Enviar arquivos com código malicioso.
- Fazer testes de intrusão sem autorização por escrito da Vereda.

## 3. Consequências

O uso proibido pode levar à suspensão do usuário e, em casos graves, à suspensão da conta da empresa, com aviso ao contato corporativo. A Vereda pode comunicar autoridades quando houver indício de crime.

## 4. Testes de segurança pelo cliente

Clientes do plano Corporativo podem fazer um teste de intrusão por ano no ambiente de homologação, com aviso de 15 dias e escopo aprovado pela equipe de segurança da Vereda.
"""),

D("seguranca", "relatorio-teste-intrusao-2026.md", "Resumo do teste de intrusão de 2026", "2026-07-30", "1.0", ["Segurança e privacidade"], """
## 1. Escopo

O teste de intrusão anual foi feito em julho de 2026 por empresa independente fictícia (Auditoria Sabiá), no portal, no aplicativo móvel e na API versão 1, no ambiente de homologação com dados sintéticos.

## 2. Resultados

| Severidade | Achados | Corrigidos até 30/09/2026 |
|---|---|---|
| Crítica | 0 | — |
| Alta | 1 | 1 |
| Média | 3 | 3 |
| Baixa | 5 | 4 |

O achado alto tratava de um limite de tentativas de login que podia ser contornado com troca de endereço IP; a correção passou a contar as tentativas por conta. O achado baixo em aberto trata de cabeçalhos informativos do servidor e está previsto para a versão de novembro.

## 3. Isolamento entre empresas

Os testes de acesso entre empresas não encontraram falhas em nenhum recurso da API ou do portal.

## 4. Disponibilização

O relatório completo é confidencial. Clientes do plano Corporativo podem lê-lo mediante acordo de confidencialidade, em sessão acompanhada, sem cópia.
"""),

D("seguranca", "programa-conscientizacao.md", "Programa de conscientização em segurança", "2026-03-30", "1.0", ["Segurança e privacidade"], """
## 1. Público

Todos os colaboradores e prestadores com acesso a sistemas internos participam do programa.

## 2. Conteúdo

- Treinamento anual de segurança e privacidade, com prova final e nota mínima de 80%.
- Treinamento de entrada, antes do primeiro acesso a sistemas.
- Simulações de phishing trimestrais.
- Comunicados curtos mensais sobre golpes e boas práticas.

## 3. Indicadores de 2026

No primeiro semestre de 2026, 98% dos colaboradores concluíram o treinamento anual dentro do prazo. A taxa de clique nas simulações de phishing caiu de 9% para 4% entre janeiro e junho.

## 4. Consequências

Quem não concluir o treinamento anual em até 30 dias depois do prazo tem o acesso a sistemas de produção suspenso até a conclusão.
"""),

D("seguranca", "norma-classificacao-descarte.md", "Norma de classificação, manuseio e descarte", "2026-02-18", "1.0", ["Segurança e privacidade"], """
## 1. Classes

As informações são classificadas em pública, interna, confidencial e restrita, como define a política de segurança. Documentos de titulares, dados financeiros e movimentações documentais dos clientes são sempre restritos.

## 2. Manuseio

| Classe | Envio por e-mail | Impressão | Armazenamento |
|---|---|---|---|
| Pública | Permitido | Permitida | Qualquer local corporativo |
| Interna | Só para endereços corporativos | Permitida | Sistemas corporativos |
| Confidencial | Só com criptografia | Com registro | Sistemas aprovados |
| Restrita | Proibido; só pela plataforma | Proibida | Apenas na plataforma |

## 3. Descarte

Mídias com informação confidencial ou restrita são destruídas de forma segura, com certificado de destruição. Arquivos digitais são eliminados conforme os prazos de retenção, com registro da eliminação.

## 4. Mesa limpa

Documentos impressos com informação interna ou superior não podem ficar sobre mesas fora do horário de trabalho. Telas devem ser bloqueadas sempre que a pessoa se afasta.
"""),

D("seguranca", "direitos-titulares-procedimento.md", "Procedimento de atendimento a titulares", "2026-09-28", "1.1", ["Segurança e privacidade"], """
## 1. Canal

Titulares fazem pedidos pelo canal autenticado no site, que gera um número de protocolo. A identidade é validada de forma proporcional ao pedido: pedidos de acesso a documentos exigem validação mais forte do que pedidos de informação.

## 2. Encaminhamento

Quando o pedido envolve dados tratados por conta de um cliente, a Vereda encaminha o pedido ao cliente em até 2 dias úteis e apoia a resposta. A Vereda não decide sozinha sobre pedidos que cabem ao controlador.

## 3. Prazos

| Pedido | Prazo de resposta ao titular |
|---|---|
| Confirmação de tratamento | Imediata, quando o dado é da própria Vereda |
| Acesso completo | 15 dias |
| Correção, eliminação ou oposição | Conforme decisão do controlador |

## 4. Registro

Cada pedido fica registrado com o protocolo, a data, as ações tomadas e a resposta. O relatório de acompanhamento é semanal, como prevê a avaliação interna de privacidade.
"""),

D("seguranca", "declaracao-iso27001-em-implantacao.md", "Situação da certificação ISO/IEC 27001", "2026-10-03", "1.0", ["Segurança e privacidade"], """
## 1. Situação atual

A Vereda Documental não possui certificação ISO/IEC 27001 no cenário fictício. O sistema de gestão de segurança da informação está em implantação, com auditoria de certificação prevista para o segundo semestre de 2027.

## 2. O que já existe

- Política de segurança da informação e normas de apoio aprovadas pela diretoria.
- Análise de riscos anual, com plano de tratamento.
- Inventário de ativos e de fornecedores.
- Indicadores mensais de segurança acompanhados pelo comitê.

## 3. Outras certificações

A Vereda também não possui certificação SOC 2, PCI DSS ou certificação de conformidade com a LGPD. As avaliações internas de privacidade não substituem uma certificação.

## 4. Evidências para clientes

Enquanto a certificação não existe, clientes podem pedir o questionário de segurança preenchido, o resumo do teste de intrusão e as políticas de segurança, mediante acordo de confidencialidade.
"""),
]
