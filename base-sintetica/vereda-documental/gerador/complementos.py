"""Complementos para a base passar do limiar de PU11 (50 mil tokens) com folga: perguntas frequentes,
cadastro de emissores por município e norma de operações documentais."""
import random
from comum import D

FAQ = [
    ("Conta e acesso", [
        ("Esqueci a senha. Como recupero?", "Use \"Esqueci a senha\" na tela de entrada. O link chega ao e-mail corporativo e vale por 30 minutos. Empresas com SSO recuperam a senha pelo provedor de identidade da própria empresa."),
        ("Perdi o celular com o autenticador.", "Peça ao administrador da sua empresa para redefinir o segundo fator. Por segurança, o suporte da Vereda não redefine o segundo fator sem o pedido do administrador."),
        ("Posso usar o mesmo login em duas empresas?", "Não. Cada empresa cliente tem os próprios usuários. Quem trabalha para duas empresas clientes recebe um usuário em cada uma."),
        ("Por que minha sessão expirou?", "No portal, a sessão expira após 30 minutos sem uso; no aplicativo, após 15 minutos."),
        ("Como mudo a minha unidade padrão?", "Em \"Meu perfil\", escolha a unidade padrão entre as unidades às quais você pertence."),
    ]),
    ("Pedidos", [
        ("Por que meu pedido está em \"Aguardando autorização\"?", "O emissor exige procuração ou autorização do titular. Anexe o documento no pedido para seguir."),
        ("Posso pedir um documento que não está no catálogo?", "Não pela Vereda. Você pode anexar ao dossiê o documento obtido por conta própria."),
        ("O emissor está fora do ar. O pedido foi perdido?", "Não. A falha fica registrada e a plataforma tenta de novo com intervalo progressivo. Você é avisado por e-mail."),
        ("Como cancelo um pedido?", "Abra o pedido e use \"Cancelar pedido\". Emolumentos já pagos ao emissor não são devolvidos automaticamente."),
        ("Por que o valor cobrado é diferente do orçado?", "O emissor pode cobrar valor diferente da estimativa. Até 10% a mais, a diferença vai para a fatura; acima disso, o pedido volta para nova aprovação."),
        ("O que acontece se eu pedir o mesmo documento duas vezes?", "Dentro da mesma janela de solicitação, a plataforma devolve o protocolo anterior, a menos que você peça expressamente a renovação."),
    ]),
    ("Dossiês e conferência", [
        ("O que quer dizer \"Completo\"?", "Que todos os itens obrigatórios do checklist foram cumpridos ou têm pendência aceita. Não quer dizer que o negócio não tem risco."),
        ("Quem pode aceitar uma pendência?", "Um aprovador com permissão para o checklist do dossiê, com justificativa escrita."),
        ("Por que um campo ficou vazio?", "O documento não traz o dado, ou o trecho indicado pela extração não foi encontrado no texto. A plataforma não completa lacunas por inferência."),
        ("O que é um documento \"inconclusivo\"?", "A extração não encontrou evidência suficiente para classificar o resultado. O analista deve ler o documento."),
        ("Posso editar um documento recebido do emissor?", "Não. O arquivo original é preservado; você pode corrigir apenas os campos extraídos, com motivo registrado."),
    ]),
    ("Relatórios e faturas", [
        ("Onde vejo os gastos da minha unidade?", "No relatório \"Gastos por centro de custo\", filtrando pela sua unidade."),
        ("Posso receber relatórios por e-mail?", "Sim, com envio diário, semanal ou mensal, apenas para usuários da própria empresa."),
        ("Como contesto um item da fatura?", "Pelo contato financeiro do cliente, em até 30 dias do vencimento."),
    ]),
    ("Segurança e privacidade", [
        ("A Vereda vê os meus documentos?", "A equipe de operações acessa documentos apenas para atender pedidos assistidos e chamados, com registro no log de auditoria."),
        ("Meus documentos treinam a IA?", "Não. Os documentos não são usados para treinar modelos gerais."),
        ("Como um titular pede acesso aos seus dados?", "Pelo canal autenticado de titulares; o pedido é encaminhado à empresa cliente responsável."),
    ]),
]


def faq():
    corpo = "## 1. Como usar\n\nPerguntas frequentes do centro de ajuda, agrupadas por tema. Para dúvidas não respondidas aqui, abra um chamado.\n\n"
    for n, (tema, itens) in enumerate(FAQ, 2):
        corpo += f"## {n}. {tema}\n\n" + "\n\n".join(f"**{p}**\n\n{r}" for p, r in itens) + "\n\n"
    return D("produto", "perguntas-frequentes-ajuda.md", "Perguntas frequentes do centro de ajuda", "2026-10-08", "2026.10", ["Produto"], corpo)


MUNICIPIOS = {
    "SP": ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba", "São José dos Campos", "Bauru", "Piracicaba"],
    "RJ": ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Petrópolis", "Campos dos Goytacazes"],
    "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Montes Claros"],
    "PR": ["Curitiba", "Londrina", "Maringá", "Cascavel", "Ponta Grossa"],
    "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Passo Fundo"],
    "SC": ["Florianópolis", "Joinville", "Blumenau", "Chapecó"],
    "GO": ["Goiânia", "Anápolis", "Rio Verde"],
    "MT": ["Cuiabá", "Rondonópolis", "Sinop", "Sorriso"],
    "MS": ["Campo Grande", "Dourados"],
    "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Luís Eduardo Magalhães"],
    "PE": ["Recife", "Jaboatão dos Guararapes", "Petrolina"],
    "CE": ["Fortaleza", "Juazeiro do Norte"],
    "DF": ["Brasília"],
    "PA": ["Belém", "Marabá"],
    "AM": ["Manaus"],
    "ES": ["Vitória", "Vila Velha"],
}

MUNICIPIOS["SP"] += ["Guarulhos", "Osasco", "Santo André", "São Bernardo do Campo", "Jundiaí", "Presidente Prudente", "Marília", "São Carlos", "Franca", "Limeira"]
MUNICIPIOS["RJ"] += ["Nova Iguaçu", "São Gonçalo", "Volta Redonda", "Macaé"]
MUNICIPIOS["MG"] += ["Betim", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis"]
MUNICIPIOS["PR"] += ["Foz do Iguaçu", "Guarapuava", "Toledo"]
MUNICIPIOS["RS"] += ["Santa Maria", "Canoas", "Novo Hamburgo", "Santa Cruz do Sul"]
MUNICIPIOS["SC"] += ["Itajaí", "Criciúma", "Lages"]
MUNICIPIOS["GO"] += ["Aparecida de Goiânia", "Jataí"]
MUNICIPIOS["MT"] += ["Lucas do Rio Verde", "Primavera do Leste", "Tangará da Serra"]
MUNICIPIOS["MS"] += ["Três Lagoas", "Chapadão do Sul"]
MUNICIPIOS["BA"] += ["Barreiras", "Ilhéus", "Camaçari"]
MUNICIPIOS.update({"MA": ["São Luís", "Imperatriz", "Balsas"], "PI": ["Teresina", "Uruçuí"], "TO": ["Palmas", "Araguaína"],
                   "RO": ["Porto Velho", "Vilhena"], "PB": ["João Pessoa", "Campina Grande"], "RN": ["Natal", "Mossoró"],
                   "AL": ["Maceió"], "SE": ["Aracaju"]})


def emissores():
    rnd = random.Random(11)
    linhas = ["| UF | Município | Registro de imóveis | Tributos municipais | Protesto | Atualizado em |", "|---|---|---|---|---|---|"]
    for uf, cidades in MUNICIPIOS.items():
        for cidade in cidades:
            ri = rnd.choice(["Integração", "Portal do emissor", "Assistida"]) if cidade != "Brasília" else "Integração"
            tm = rnd.choice(["Integração", "Portal do emissor", "Portal do emissor", "Assistida"])
            pr = rnd.choice(["Portal do emissor", "Assistida", "Integração"])
            mes = rnd.choice(["07/2026", "08/2026", "09/2026"])
            linhas.append(f"| {uf} | {cidade} | {ri} | {tm} | {pr} | {mes} |")
    return D("referencia", "cadastro-emissores-municipios.md", "Cadastro de emissores por município", "2026-09-30", "2026.3",
             ["Produto"], f"""
## 1. Finalidade

Este cadastro detalha, para os municípios com mais pedidos, o canal usado com cada emissor local. Ele complementa a matriz de cobertura por UF, que mostra o canal predominante no estado. Quando o cadastro e a matriz divergirem para um município, vale o cadastro, que é mais específico.

## 2. Municípios cadastrados

{chr(10).join(linhas)}

## 3. Municípios fora do cadastro

Para municípios fora desta lista, vale o canal da matriz de cobertura da UF. A equipe de operações confirma o canal antes do protocolo e, quando não houver cobertura, avisa o solicitante para anexar o documento obtido por conta própria.

## 4. Contato com emissores

Os contatos operacionais com cada emissor ficam no sistema interno de operações e não são divulgados aos clientes. Pedidos assistidos são feitos apenas pela equipe de operações da Vereda.
""")


OPERACOES = D("operacoes", "norma-operacoes-documentais.md", "Norma de operações documentais", "2026-08-26", "1.3", ["Produto"], """
## 1. Escopo

Esta norma orienta a equipe de operações documentais da Vereda, que faz os pedidos assistidos, confere os documentos recebidos dos emissores e atende chamados operacionais dos clientes.

## 2. Recebimento de documentos

1. Conferir se o arquivo recebido corresponde ao pedido: titular, tipo documental e localidade.
2. Verificar se o arquivo está legível e completo. Arquivo ilegível é marcado como "ilegível" e o pedido é reaberto com o emissor.
3. Registrar a data e a hora do recebimento, que iniciam a contagem do prazo de disponibilização.
4. Liberar o documento para a extração assistida, quando o plano do cliente a inclui.

## 3. Prazos internos

| Atividade | Meta interna |
|---|---|
| Protocolar pedido aprovado em canal de portal | Até 4 horas úteis |
| Protocolar pedido aprovado em canal assistido | Até 1 dia útil |
| Conferir documento recebido | Até 4 horas úteis |
| Responder exigência do emissor com o que o cliente enviou | Até 4 horas úteis |

As metas internas são suspensas enquanto o pedido aguarda resposta do cliente a uma exigência do emissor.

## 4. Pedidos assistidos

Pedidos assistidos são feitos apenas por pessoas da equipe de operações, com credenciais institucionais da Vereda junto aos emissores. É proibido usar credenciais pessoais de clientes ou titulares, mesmo que o cliente as ofereça.

## 5. Exigências do emissor

O motivo da exigência é copiado para o pedido com as palavras do emissor, sem interpretação. O solicitante é avisado por e-mail e, no plano Corporativo, por webhook.

## 6. Qualidade

Uma amostra de 5% dos documentos conferidos por semana passa por segunda conferência por outra pessoa. A taxa de erro de conferência é acompanhada no comitê mensal de operações, com meta abaixo de 1%.

## 7. Registro

Toda ação da equipe de operações em um pedido fica no histórico do pedido, com o nome da pessoa, a data e a descrição da ação, visível para o cliente.
""")

DOCS = [faq(), emissores(), OPERACOES]
