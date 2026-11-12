from comum import D

DOCS = [
D("comercial", "tabela-precos-2026.md", "Tabela de preços 2026", "2026-01-12", "2026.1", ["Comercial"], """
## 1. Mensalidades

| Plano | Mensalidade da plataforma | Usuários incluídos | Usuário adicional |
|---|---|---|---|
| Essencial | R$ 900 | 10 | R$ 40 por mês |
| Profissional | R$ 1.800 | 25 | R$ 35 por mês |
| Corporativo | R$ 3.000 | 60 | R$ 30 por mês |

Valores inventados para testes do Tendra.ai.

## 2. Taxas por solicitação

| Plano | Taxa por solicitação concluída |
|---|---|
| Essencial | R$ 18 |
| Profissional | R$ 15 |
| Corporativo | R$ 12 |

Emolumentos e taxas cobrados pelos emissores são reembolsados à parte, pelo valor aprovado no orçamento.

## 3. Extração assistida

A extração está incluída nos planos Profissional e Corporativo até 2.000 páginas por mês. Páginas excedentes custam R$ 0,20 cada.

## 4. Serviços profissionais

| Serviço | Preço |
|---|---|
| Sessão adicional de treinamento (até 2 horas) | R$ 1.200 |
| Migração acima de 5.000 documentos | Orçamento à parte |
| Projeto de integração sob medida | R$ 280 por hora |

## 5. Limites técnicos por plano

O plano Essencial não tem acesso à API. O Profissional tem API somente de leitura, limitada a 120 requisições por minuto. O Corporativo tem API completa, com os limites do documento de limites e capacidade.

## 6. Validade da tabela

Esta tabela vale para contratos assinados entre 1º de janeiro e 31 de dezembro de 2026. Contratos em vigor seguem a regra de reajuste do contrato.
"""),

D("comercial", "proposta-padrao-corporativo.md", "Proposta comercial padrão do plano Corporativo", "2026-09-15", "3.0", ["Comercial"], """
## 1. Escopo da proposta

A proposta padrão do plano Corporativo inclui:
- acesso ao portal e ao aplicativo móvel para até 60 usuários;
- módulos de solicitação, dossiês, extração e análise assistida;
- API REST versão 1 e webhooks;
- SSO SAML 2.0;
- gerente de implantação nas três primeiras fases e gerente de conta depois;
- telefone de plantão para severidade 1.

## 2. Condições comerciais

- Mensalidade da plataforma de R$ 3.000, mais R$ 12 por solicitação concluída.
- Reembolso de emolumentos externos aprovados no orçamento.
- Vigência de 24 meses, com renovação por períodos de 12 meses mediante aceite escrito.

## 3. Prazo de implantação

A implantação típica leva de 5 a 7 semanas, da preparação ao fim do piloto, conforme o plano de implantação.

## 4. Validade da proposta

A proposta vale por 30 dias a partir do envio. Depois disso, os valores podem ser revistos conforme a tabela de preços vigente.

## 5. O que não está incluído

Conectores prontos para ERP ou CRM, desenvolvimento de integrações sob medida e migração acima de 5.000 documentos não estão incluídos e são orçados à parte.
"""),

D("comercial", "politica-descontos-volume.md", "Política de descontos por volume", "2026-03-04", "1.0", ["Comercial"], """
## 1. Desconto sobre a taxa por solicitação

| Solicitações concluídas por mês | Desconto sobre a taxa |
|---|---|
| Até 500 | Sem desconto |
| 501 a 2.000 | 10% |
| 2.001 a 5.000 | 15% |
| Acima de 5.000 | 20% |

O desconto é calculado sobre as solicitações do mês e aplicado na fatura seguinte. Ele não vale para emolumentos externos.

## 2. Desconto sobre a mensalidade

Contratos com pagamento anual antecipado recebem 8% de desconto sobre as mensalidades do ano. O desconto não se acumula com condições especiais de piloto.

## 3. Aprovação

Descontos acima dos previstos nesta política precisam de aprovação da diretoria comercial e ficam registrados no contrato.

## 4. Setor público

Contratações públicas seguem as regras do edital e não usam esta política. As condições para o setor público estão no documento de regras de contratação pública.
"""),

D("comercial", "faturamento-pagamento.md", "Faturamento, pagamento e inadimplência", "2026-06-10", "1.1", ["Comercial", "Jurídico"], """
## 1. Ciclo de faturamento

A fatura é emitida no primeiro dia útil de cada mês, com a mensalidade do mês corrente e as solicitações concluídas e os emolumentos do mês anterior. O vencimento é no décimo dia corrido após a emissão.

## 2. Formas de pagamento

Boleto bancário ou transferência. Cartão de crédito não é aceito no cenário.

## 3. Detalhamento

A fatura traz o detalhamento por centro de custo, com o número de cada solicitação, o tipo documental e os emolumentos reembolsados. O mesmo detalhamento pode ser exportado para o ERP do cliente.

## 4. Atraso

Pagamentos em atraso têm multa de 2% e juros de 1% ao mês. Depois de 30 dias de atraso, a Vereda pode suspender a abertura de novos pedidos, com aviso prévio de 10 dias ao contato financeiro. O acesso aos dossiês para consulta e download continua liberado durante a suspensão.

## 5. Contestação

O cliente pode contestar itens da fatura em até 30 dias do vencimento. Itens contestados não entram no cálculo de atraso enquanto a contestação estiver em análise.
"""),

D("comercial", "casos-uso-segmentos.md", "Casos de uso por segmento", "2026-08-07", "1.0", ["Comercial", "Produto"], """
## 1. Instituições financeiras

Formação de dossiês de crédito corporativo e rural, com certidões das empresas e dos sócios, matrículas de imóveis dados em garantia e atos societários. O ganho principal relatado em clientes sintéticos é a redução do tempo de montagem do dossiê de 9 para 3 dias úteis.

## 2. Incorporadoras e imobiliárias

Due diligence de imóveis antes da compra ou do lançamento, com checklist de matrícula, certidões do vendedor e documentos técnicos. Alertas de vencimento ajudam a manter as certidões válidas até a escritura.

## 3. Áreas de compras

Homologação de fornecedores com certidões fiscais e trabalhistas renovadas automaticamente, para manter o cadastro em dia sem pedidos manuais.

## 4. Escritórios de advocacia

Organização de documentos de operações de fusão e aquisição, com sala de documentos e lista de pedidos para a empresa-alvo. O escritório continua responsável pela análise jurídica.

## 5. Agronegócio

Dossiês de crédito rural com cédulas de produto rural, matrículas e certidões, com destaque de divergências entre a descrição do imóvel nos diferentes documentos.
"""),

D("comercial", "programa-parceiros.md", "Programa de parceiros", "2026-05-06", "1.0", ["Comercial"], """
## 1. Tipos de parceiro

| Tipo | Papel |
|---|---|
| Indicação | Apresenta clientes e recebe comissão sobre o primeiro ano |
| Implantação | Faz a implantação e o treinamento em nome da Vereda |
| Tecnologia | Desenvolve integrações com sistemas de mercado |

## 2. Comissão de indicação

O parceiro de indicação recebe 10% das mensalidades pagas pelo cliente indicado nos primeiros 12 meses. A comissão não incide sobre taxas por solicitação nem sobre emolumentos.

## 3. Requisitos

Parceiros de implantação e de tecnologia passam por treinamento e certificação interna da Vereda e assinam acordo de confidencialidade e de tratamento de dados antes de acessar ambientes de clientes.

## 4. Responsabilidade perante o cliente

Mesmo quando a implantação é feita por parceiro, a Vereda continua responsável pelo serviço contratado perante o cliente.
"""),

D("comercial", "politica-reembolso-emolumentos.md", "Política de reembolso de emolumentos", "2026-04-15", "1.0", ["Comercial"], """
## 1. O que são emolumentos

Emolumentos são taxas cobradas pelos emissores (cartórios, órgãos públicos e tribunais) para emitir os documentos. Eles não são receita da Vereda.

## 2. Aprovação prévia

Nenhum emolumento é pago sem orçamento aprovado pelo cliente. O orçamento mostra o valor estimado informado pelo emissor ou pela tabela pública do emissor.

## 3. Diferença de valor

Quando o valor cobrado pelo emissor é maior do que o orçado em até 10%, a Vereda paga e repassa a diferença na fatura, com aviso ao solicitante. Acima de 10%, o pedido volta para "Aguardando orçamento" e precisa de nova aprovação.

## 4. Pedido cancelado

Se o pedido for cancelado depois do pagamento ao emissor, o emolumento já pago é cobrado do cliente, a menos que o emissor faça a devolução.

## 5. Comprovantes

O comprovante de cada pagamento ao emissor fica disponível no pedido e é anexado ao detalhamento da fatura.
"""),

D("comercial", "condicoes-piloto-poc.md", "Condições para piloto e prova de conceito", "2026-07-01", "1.0", ["Comercial"], """
## 1. Duração

O piloto dura até 60 dias, com uma unidade e até 20 usuários do cliente.

## 2. Condições

- Mensalidade de plataforma gratuita durante o piloto.
- Taxa por solicitação do plano escolhido, com 50% de desconto.
- Emolumentos externos reembolsados normalmente.

## 3. Critérios de sucesso

Os critérios de sucesso são combinados por escrito antes do início, por exemplo: tempo médio de montagem do dossiê, percentual de pedidos entregues no prazo e satisfação dos usuários.

## 4. Fim do piloto

Ao fim do piloto, o cliente decide pela contratação ou pelo encerramento. Se encerrar, os dados são exportados a pedido e eliminados em até 90 dias, como no fim de qualquer contrato.

## 5. Limites

O piloto não inclui API nem SSO. Integrações só são liberadas depois da assinatura do contrato.
"""),

D("comercial", "sucesso-cliente-governanca.md", "Sucesso do cliente e governança da conta", "2026-08-25", "1.0", ["Comercial"], """
## 1. Ritos

| Rito | Periodicidade | Participantes |
|---|---|---|
| Reunião de acompanhamento | Mensal | Gerente de conta e responsável do cliente |
| Revisão de negócios | Trimestral | Diretoria do cliente e da Vereda |
| Pesquisa de satisfação | Semestral | Usuários do cliente |

## 2. Indicadores acompanhados

- Pedidos entregues no prazo estimado do emissor.
- Tempo médio de montagem do dossiê.
- Chamados por severidade e tempo de resposta.
- Adoção por unidade e por perfil.

## 3. Plano de ação

Quando um indicador fica abaixo da meta combinada por dois meses seguidos, o gerente de conta apresenta um plano de ação na reunião mensal seguinte.

## 4. Pesquisa de satisfação

A nota média de satisfação dos clientes do plano Corporativo no primeiro semestre de 2026 foi 8,6 de 10, no cenário fictício.
"""),

D("comercial", "referencias-clientes-sinteticos.md", "Referências de clientes (cenário sintético)", "2026-09-05", "1.0", ["Comercial"], """
## 1. Aviso

Todos os clientes abaixo são fictícios, criados para testes do Tendra.ai. Não há clientes reais citados.

## 2. Referências

| Cliente fictício | Segmento | Plano | Desde |
|---|---|---|---|
| Banco Meridional | Instituição financeira | Corporativo | 2025 |
| Construtora Atlas | Incorporadora | Profissional | 2024 |
| Cooperativa Campo Verde | Agronegócio | Corporativo | 2025 |
| Rede Farmácias Ipê | Varejo (compras) | Essencial | 2026 |

## 3. Número de clientes

No cenário, a Vereda atende 42 empresas clientes, das quais 11 no plano Corporativo.

## 4. Contato de referência

Contatos de referência são indicados pelo gerente de conta só depois da autorização do cliente fictício e mediante agendamento.
"""),

D("comercial", "comparativo-planos.md", "Comparativo dos planos Essencial, Profissional e Corporativo", "2026-09-08", "1.1", ["Comercial", "Produto"], """
## 1. Funcionalidades

| Funcionalidade | Essencial | Profissional | Corporativo |
|---|---|---|---|
| Solicitação e acompanhamento | Sim | Sim | Sim |
| Dossiês e checklists | Sim | Sim | Sim |
| Extração assistida | Não | Sim | Sim |
| Análise assistida | Não | Não | Sim |
| API | Não | Somente leitura | Completa |
| Webhooks | Não | Não | Sim |
| SSO SAML 2.0 | Não | Não | Sim |
| Perfis personalizados | Não | Não | Sim |
| Telefone de plantão | Não | Não | Sim |
| Ambiente de homologação | Não | Não | Sim |

## 2. Quando escolher cada plano

- **Essencial:** equipes pequenas que precisam pedir e organizar certidões.
- **Profissional:** equipes que querem a leitura assistida dos documentos.
- **Corporativo:** empresas com várias unidades, integração com sistemas próprios e exigências de segurança como SSO.

## 3. Mudança de plano

A mudança para um plano superior vale a partir do mês seguinte ao pedido. A mudança para um plano inferior só pode ser feita na renovação do contrato.
"""),

D("comercial", "politica-reajuste.md", "Política de reajuste de preços", "2026-01-20", "1.0", ["Comercial"], """
## 1. Índice

Os valores de mensalidade, taxas por solicitação e serviços profissionais são reajustados anualmente pelo IPCA acumulado em 12 meses, na data de aniversário do contrato.

## 2. Aviso

O cliente é avisado do reajuste com 30 dias de antecedência, por e-mail ao contato financeiro.

## 3. Índice negativo

Se o IPCA acumulado for negativo, os valores ficam iguais, sem redução.

## 4. Emolumentos

Emolumentos externos seguem as tabelas dos emissores e não estão sujeitos a esta política.
"""),
]
