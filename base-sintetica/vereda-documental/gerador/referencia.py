"""Documentos de referência longos: institucionais (Geral), tabelas por UF e RFPs passadas."""
import random
from comum import D

UFS = [("AC", "Acre"), ("AL", "Alagoas"), ("AP", "Amapá"), ("AM", "Amazonas"), ("BA", "Bahia"), ("CE", "Ceará"),
       ("DF", "Distrito Federal"), ("ES", "Espírito Santo"), ("GO", "Goiás"), ("MA", "Maranhão"), ("MT", "Mato Grosso"),
       ("MS", "Mato Grosso do Sul"), ("MG", "Minas Gerais"), ("PA", "Pará"), ("PB", "Paraíba"), ("PR", "Paraná"),
       ("PE", "Pernambuco"), ("PI", "Piauí"), ("RJ", "Rio de Janeiro"), ("RN", "Rio Grande do Norte"),
       ("RS", "Rio Grande do Sul"), ("RO", "Rondônia"), ("RR", "Roraima"), ("SC", "Santa Catarina"), ("SP", "São Paulo"),
       ("SE", "Sergipe"), ("TO", "Tocantins")]
GRANDES = {"SP", "RJ", "MG", "PR", "RS", "SC", "DF", "BA", "GO", "PE"}


def matriz_cobertura():
    rnd = random.Random(2026)
    linhas = ["| UF | Débitos estaduais | Distribuição judicial | Matrícula de imóvel | Junta comercial | Protesto |",
              "|---|---|---|---|---|---|"]
    for sigla, nome in UFS:
        def canal(base):
            if sigla in GRANDES:
                return rnd.choice(["Integração", "Integração", "Portal do emissor"])
            return rnd.choice(base)
        linhas.append(f"| {nome} ({sigla}) | {canal(['Portal do emissor', 'Integração'])} | "
                      f"{canal(['Portal do emissor', 'Assistida', 'Assistida'])} | "
                      f"{canal(['Assistida', 'Portal do emissor', 'Sem cobertura'])} | "
                      f"{canal(['Integração', 'Portal do emissor'])} | "
                      f"{canal(['Assistida', 'Portal do emissor', 'Sem cobertura'])} |")
    tabela = "\n".join(linhas)
    return D("referencia", "matriz-cobertura-uf.md", "Matriz de cobertura por unidade federativa", "2026-09-04", "2026.3",
             ["Produto"], f"""
## 1. Como ler a matriz

A matriz mostra, para cada unidade federativa e família documental, o canal usado pela Vereda para obter o documento. Ela complementa o catálogo de documentos e cobertura e é revista a cada trimestre. A cobertura de cada pedido é confirmada antes do protocolo; a matriz não é promessa de cobertura integral.

| Canal | O que significa |
|---|---|
| Integração | Pedido automático com o emissor, sem intervenção manual |
| Portal do emissor | A equipe de operações faz o pedido no portal oficial do emissor |
| Assistida | O pedido depende de contato com o emissor e pode exigir procuração |
| Sem cobertura | A Vereda não obtém o documento nessa localidade; o cliente pode anexar o documento obtido por conta própria |

## 2. Matriz por UF

{tabela}

## 3. Certidões federais

Certidões de débitos federais, certidão trabalhista nacional e certidão de regularidade do FGTS são obtidas por integração em todas as unidades federativas.

## 4. Prazos típicos por canal

| Canal | Prazo típico do emissor |
|---|---|
| Integração | Até 1 dia útil |
| Portal do emissor | 1 a 3 dias úteis |
| Assistida | 3 a 15 dias úteis, conforme o emissor |

Os prazos são do emissor e não fazem parte dos níveis de serviço da Vereda. O prazo da Vereda começa a contar quando o arquivo é recebido do emissor.

## 5. Atualização

Mudanças na matriz são publicadas no centro de ajuda. Quando uma localidade perde cobertura, os pedidos em andamento são concluídos pelo canal anterior sempre que possível.
""")


def tabela_emolumentos():
    rnd = random.Random(77)
    linhas = ["| UF | Certidão de matrícula (R$) | Certidão de protesto (R$) | Certidão de distribuição (R$) |",
              "|---|---|---|---|"]
    for sigla, nome in UFS:
        m = rnd.randint(55, 98) + rnd.choice([0, 0.5])
        p = rnd.randint(18, 45) + rnd.choice([0, 0.4])
        d = rnd.randint(0, 30)
        fmt = lambda v: f"{v:.2f}".replace(".", ",")
        linhas.append(f"| {nome} ({sigla}) | {fmt(m)} | {fmt(p)} | {'Gratuita' if d < 8 else fmt(d)} |")
    return D("referencia", "tabela-referencia-emolumentos.md", "Tabela de referência de emolumentos", "2026-03-02",
             "2026.1", ["Comercial"], f"""
## 1. Finalidade

Esta tabela é uma referência interna, usada para montar a estimativa do orçamento antes da confirmação do valor pelo emissor. Os valores são fictícios e foram inventados para testes do Tendra.ai.

## 2. Valores de referência por UF

{chr(10).join(linhas)}

## 3. Uso no orçamento

O orçamento usa o valor informado pelo emissor quando ele está disponível. Sem essa informação, usa o valor desta tabela. A diferença entre o orçado e o cobrado segue a política de reembolso de emolumentos: até 10% é repassada na fatura; acima disso, o pedido volta para nova aprovação.

## 4. Atualização

A tabela é revista em janeiro e em julho. Valores desatualizados não mudam orçamentos já aprovados.
""")


def glossario():
    termos = [
        ("Apontamento", "Registro em uma certidão que indica pendência, débito, processo ou restrição em nome do titular."),
        ("Averbação", "Anotação na matrícula de um imóvel que altera ou complementa as informações registradas."),
        ("Canal", "Forma usada para obter um documento do emissor: integração, portal do emissor ou solicitação assistida."),
        ("Centro de custo", "Unidade de despesa da empresa cliente usada para separar gastos nos relatórios e na fatura."),
        ("Certidão", "Documento oficial que atesta a existência ou a ausência de um fato em nome de um titular."),
        ("Checklist", "Lista de tipos documentais esperados em um dossiê, com indicação de obrigatoriedade."),
        ("Conferência", "Etapa em que o analista confirma ou corrige os campos extraídos de um documento."),
        ("Dossiê", "Conjunto de documentos de um mesmo negócio, titular ou imóvel, com checklist e histórico."),
        ("Emissor", "Órgão, cartório ou tribunal que emite o documento."),
        ("Emolumento", "Taxa cobrada pelo emissor para emitir o documento, reembolsada pelo cliente."),
        ("Exigência do emissor", "Pedido de documento ou informação adicional feito pelo emissor durante o protocolo."),
        ("Extração assistida", "Leitura automática dos campos de um documento, sempre com página e trecho de origem."),
        ("Homônimo", "Pessoa com o mesmo nome do titular; a coincidência de nome não confirma identidade."),
        ("Inconclusivo", "Classe dada quando a extração não encontra evidência suficiente para classificar o documento."),
        ("Matrícula", "Registro de um imóvel no cartório de registro de imóveis, com sua descrição e histórico."),
        ("Matriz de cobertura", "Tabela que indica, por localidade e família documental, o canal disponível."),
        ("Ônus", "Restrição registrada sobre um imóvel, como hipoteca, penhora ou alienação fiduciária."),
        ("Orçamento", "Estimativa de taxas da Vereda e emolumentos que precisa ser aprovada antes do protocolo."),
        ("Pendência aceita", "Item do checklist sem documento, aceito com justificativa por um aprovador."),
        ("Procuração", "Documento que autoriza um representante a pedir documentos em nome do titular."),
        ("Protocolo", "Envio do pedido ao emissor, com número de controle quando o emissor fornece um."),
        ("Renovação", "Novo pedido de um documento cuja validade está perto do fim."),
        ("Solicitação concluída", "Pedido que terminou com o documento entregue no dossiê; é a base da taxa por solicitação."),
        ("Titular", "Pessoa física ou jurídica a quem o documento se refere."),
        ("Validade", "Prazo em que o documento é aceito, transcrito do documento ou definido pela regra do emissor."),
    ]
    corpo = "## 1. Termos\n\n" + "\n\n".join(f"**{t}.** {d}" for t, d in termos) + """

## 2. Siglas

| Sigla | Significado |
|---|---|
| API | Interface de programação usada para integrar sistemas |
| MFA | Autenticação em mais de um fator |
| RPO | Objetivo de ponto de recuperação: quanto dado pode ser perdido em um desastre |
| RTO | Objetivo de tempo de recuperação: em quanto tempo o serviço volta |
| SSO | Login único com o provedor de identidade do cliente |
| SLA | Acordo de nível de serviço |
"""
    return D("institucional", "glossario-termos.md", "Glossário de termos da plataforma", "2026-08-14", "1.0", ["Geral"], corpo)


INSTITUCIONAL = D("institucional", "apresentacao-institucional.md", "Apresentação institucional da Vereda Documental",
                  "2026-09-01", "1.0", ["Geral"], """
## 1. Quem somos

A Vereda Documental é uma empresa fictícia, criada para testes do Tendra.ai, que oferece uma plataforma de emissão, gestão e inteligência documental para empresas. A sede fictícia fica em São Paulo, com uma equipe de 140 pessoas no cenário.

## 2. Missão

Reduzir o tempo e o risco de reunir e conferir documentos em decisões de crédito, compras, operações imobiliárias e due diligence, mantendo cada informação ligada à sua fonte.

## 3. Números do cenário

| Indicador | Valor |
|---|---|
| Empresas clientes | 42 |
| Pedidos processados em 2025 | 610 mil |
| Tipos documentais no catálogo | 85 |
| Fundação | 2019 |

## 4. Estrutura

As áreas da empresa são: produto, tecnologia, operações documentais, segurança e privacidade, comercial e sucesso do cliente, jurídico e financeiro. Operações documentais concentra a equipe que faz pedidos assistidos e confere documentos recebidos.

## 5. Valores

Transparência sobre a origem de cada informação, decisão humana nas etapas críticas e respeito aos dados das pessoas que aparecem nos documentos.
""")

HISTORICO = D("institucional", "historico-incidentes-disponibilidade.md", "Histórico de incidentes e disponibilidade",
              "2026-10-05", "2026.3", ["Tecnologia", "Segurança e privacidade"], """
## 1. Disponibilidade mensal medida

| Mês | Portal e API | Observação |
|---|---|---|
| Janeiro de 2026 | 99,92% | Sem incidentes de severidade 1 |
| Fevereiro de 2026 | 99,71% | Lentidão na extração por 3 horas |
| Março de 2026 | 99,95% | — |
| Abril de 2026 | 99,38% | Incidente de severidade 1 no banco de dados (ver item 2) |
| Maio de 2026 | 99,90% | — |
| Junho de 2026 | 99,88% | — |
| Julho de 2026 | 99,93% | — |
| Agosto de 2026 | 99,81% | Falha de um emissor estadual, sem impacto no portal |
| Setembro de 2026 | 99,96% | Exercício de recuperação sem impacto para clientes |

## 2. Incidente de abril de 2026

No dia 14 de abril de 2026, uma atualização de configuração do banco de dados causou indisponibilidade do portal e da API por 2 horas e 40 minutos. Não houve perda de dados nem acesso indevido. Os clientes do plano Corporativo receberam o crédito de 5% previsto no anexo de níveis de serviço. Como medida, a reversão automática passou a cobrir mudanças de configuração do banco.

## 3. Incidentes de segurança

Não houve incidente de segurança com acesso indevido a dados de clientes em 2025 nem em 2026, até a data deste documento. Duas tentativas de ataque de força bruta ao portal, em junho de 2026, foram bloqueadas pelo controle de tentativas de login.
""")


def rfp_passada(nome, titulo, data, cliente, pares):
    corpo = (f"## 1. Contexto\n\nRespostas aprovadas pela Vereda Documental no questionário de {cliente}, cliente fictício. "
             "As respostas refletem a base vigente na data da proposta e podem estar desatualizadas.\n\n## 2. Perguntas e respostas\n\n")
    corpo += "\n\n".join(f"### 2.{i} {p}\n\n{r}" for i, (p, r) in enumerate(pares, 1))
    return D("rfp-passadas", nome, titulo, data, "1.0", ["Geral"], corpo, tipo="rfp-passada")


RFP_MERIDIONAL = rfp_passada("rfp-2025-banco-meridional.md", "RFP 2025: Banco Meridional", "2025-11-18", "Banco Meridional (2025)", [
    ("A plataforma concede crédito ou emite parecer sobre o cliente?", "Não. A plataforma organiza documentos e destaca informações; a decisão de crédito é do banco."),
    ("Quais certidões são obtidas para pessoa jurídica?", "Certidões fiscais federais, estaduais e municipais, certidão trabalhista, distribuição judicial e protesto, conforme a matriz de cobertura."),
    ("Qual é a disponibilidade contratada?", "Disponibilidade mensal de 99,5%, excluídas as manutenções programadas avisadas com 72 horas de antecedência."),
    ("Há integração por API?", "Sim, no plano Corporativo, com API REST versão 1 e autenticação OAuth 2.0."),
    ("Onde os dados ficam armazenados?", "No Brasil, em provedor de nuvem com região principal em São Paulo e recuperação em região secundária no Brasil."),
    ("Os documentos são usados para treinar modelos de IA?", "Não. Os documentos não são usados para treinar modelos gerais."),
    ("Qual é o prazo de comunicação de incidentes?", "Até 72 horas após a confirmação do incidente."),
    ("Existe segregação de dados entre clientes?", "Sim. Todas as consultas exigem o identificador da empresa e há testes automáticos de isolamento."),
    ("A plataforma suporta login único corporativo?", "Sim, SSO SAML 2.0 no plano Corporativo."),
    ("Qual é o limite de responsabilidade?", "As mensalidades pagas nos 12 meses anteriores, exceto em caso de dolo, fraude ou violação de confidencialidade."),
    ("Como é feito o descarte dos dados ao fim do contrato?", "Os dados operacionais são eliminados em até 90 dias, com certificado de eliminação."),
    ("Há alerta de vencimento de certidões?", "Sim, a 30 e a 7 dias do vencimento conhecido."),
    ("Qual é o valor da mensalidade no plano Corporativo?", "Na proposta de 2025, a mensalidade era de R$ 2.700, mais R$ 12 por solicitação concluída."),
    ("Quem é o encarregado de dados?", "O encarregado é identificado como DPO-SINT-001, no contato dpo@vereda-sintetica.example."),
    ("Há teste de intrusão independente?", "Sim, anual, feito por empresa independente."),
    ("A plataforma tem certificação ISO/IEC 27001?", "Não. A certificação estava prevista, sem data definida, na época da proposta."),
])

RFP_ATLAS = rfp_passada("rfp-2026-construtora-atlas.md", "RFP 2026: Construtora Atlas", "2026-04-22", "Construtora Atlas (2026)", [
    ("A plataforma faz due diligence de imóveis?", "Sim. Há checklist de due diligence imobiliária com matrícula, certidões do vendedor e documentos técnicos."),
    ("Ônus na matrícula são identificados automaticamente?", "As menções a ônus são destacadas com página e trecho, sem conclusão automática sobre vigência ou efeito jurídico."),
    ("É possível compartilhar dossiês com o escritório de advocacia?", "Sim, por link com prazo de até 15 dias e registro de cada acesso."),
    ("Qual é o prazo para disponibilizar o documento recebido do emissor?", "Até 1 dia útil após o recebimento do emissor, conforme o portal operacional."),
    ("Há aplicativo para aprovação de despesas?", "Na época da proposta, o aplicativo estava em desenvolvimento, com lançamento previsto para agosto de 2026."),
    ("Quais planos atendem a uma construtora com 30 usuários?", "O plano Profissional, com 25 usuários incluídos e usuários adicionais cobrados à parte, ou o Corporativo."),
    ("A plataforma calcula a validade das certidões?", "Só quando a validade está no documento ou na regra do emissor; sem isso, o campo fica desconhecido."),
    ("Como são tratados homônimos?", "Ocorrências com o mesmo nome ficam em revisão, com comparação de identificadores; nome igual não confirma identidade."),
    ("Qual é o RPO e o RTO?", "RPO de 15 minutos e RTO de 2 horas, conforme o plano de continuidade de negócios."),
    ("Há exportação do dossiê completo?", "Sim, em arquivo compactado com índice em PDF."),
    ("Existe multa por descumprimento do SLA?", "Não. O contrato prevê apenas créditos de serviço."),
    ("Os emolumentos estão incluídos na mensalidade?", "Não. Os emolumentos são reembolsados à parte, pelo valor aprovado no orçamento."),
])

DOCS = [matriz_cobertura(), tabela_emolumentos(), glossario(), INSTITUCIONAL, HISTORICO, RFP_MERIDIONAL, RFP_ATLAS]
