"""Documentos extensos, comuns em bases reais: questionário de segurança, condições gerais, manual,
catálogo de tipos documentais, análise de riscos e uma terceira RFP passada."""
from comum import D
from referencia import rfp_passada

FAMILIAS = {
    "Fiscal": ["Certidão de débitos federais e dívida ativa da União", "Certidão de débitos estaduais", "Certidão de débitos municipais (mobiliário)",
               "Certidão de débitos municipais (imobiliário)", "Certidão de regularidade do FGTS", "Certidão de débitos de ICMS",
               "Comprovante de inscrição estadual", "Comprovante de situação cadastral federal", "Certidão de dívida ativa estadual",
               "Certidão negativa de tributos imobiliários", "Certidão de regularidade previdenciária", "Certidão de débitos de ISS"],
    "Trabalhista": ["Certidão negativa de débitos trabalhistas", "Certidão de ações trabalhistas por região", "Certidão de infrações trabalhistas",
                    "Certidão de cumprimento de cota de aprendizes", "Certidão de cumprimento de cota de pessoas com deficiência"],
    "Judicial": ["Certidão de distribuição cível estadual", "Certidão de distribuição criminal estadual", "Certidão de distribuição federal cível",
                 "Certidão de distribuição federal criminal", "Certidão de falência e recuperação judicial", "Certidão de execuções fiscais",
                 "Certidão de ações eleitorais", "Certidão de distribuição de Juizados Especiais", "Certidão de inquéritos",
                 "Certidão de objeto e pé"],
    "Imobiliária": ["Certidão de inteiro teor da matrícula", "Certidão de ônus reais", "Certidão de ações reais e pessoais reipersecutórias",
                    "Certidão vintenária", "Certidão de transcrição", "Certidão de valor venal", "Certidão de uso do solo",
                    "Certidão de numeração predial", "Habite-se", "Certidão de cadastro rural", "Certificado de cadastro de imóvel rural",
                    "Certidão de georreferenciamento", "Certidão de aforamento", "Certidão de débitos condominiais (declaração)",
                    "Planta e memorial descritivo"],
    "Societária": ["Certidão simplificada da junta comercial", "Certidão de inteiro teor de ato societário", "Ficha cadastral completa",
                   "Contrato social consolidado", "Última alteração contratual", "Ata de assembleia", "Estatuto social",
                   "Certidão de breve relato", "Livro de registro de ações", "Procuração pública", "Certidão de pessoa jurídica em cartório",
                   "Certidão de registro de marca", "Atestado de capacidade técnica"],
    "Protesto e crédito": ["Certidão de protesto de títulos", "Certidão de protesto por comarca", "Relatório de cadastro positivo (autorizado)",
                           "Certidão de cartório de títulos e documentos", "Certidão de registro de penhor rural", "Certidão de registro de cédula"],
    "Ambiental e regulatória": ["Licença ambiental de operação", "Certidão de débitos ambientais", "Certificado de regularidade do IBAMA",
                                "Alvará de funcionamento", "Auto de vistoria do corpo de bombeiros", "Licença sanitária",
                                "Certidão de outorga de uso de água", "Certidão de áreas contaminadas", "Registro em conselho de classe",
                                "Certidão de regularidade no órgão de defesa do consumidor"],
    "Pessoa física": ["Certidão de nascimento", "Certidão de casamento", "Certidão de óbito", "Certidão de antecedentes criminais",
                      "Certidão de quitação eleitoral", "Certidão de interdição e tutela", "Certidão de pacto antenupcial",
                      "Certidão de regime de bens", "Comprovante de situação cadastral de pessoa física", "Certidão de distribuição de família",
                      "Certidão de testamento", "Certidão de união estável", "Certidão de averbação de divórcio", "Certidão de inventário"],
}


def catalogo():
    linhas = ["| Família | Tipo documental | Extração de campos | Validade típica |", "|---|---|---|---|"]
    validade = {"Fiscal": "180 dias ou a do documento", "Trabalhista": "180 dias", "Judicial": "Conforme o emissor",
                "Imobiliária": "30 dias para negócios, conforme o uso", "Societária": "Conforme o emissor",
                "Protesto e crédito": "30 dias", "Ambiental e regulatória": "A do documento", "Pessoa física": "90 dias para negócios"}
    extraidos = {"Fiscal", "Trabalhista", "Judicial", "Imobiliária", "Societária"}
    total = 0
    for familia, tipos in FAMILIAS.items():
        for tipo in tipos:
            total += 1
            linhas.append(f"| {familia} | {tipo} | {'Sim' if familia in extraidos else 'Não (só leitura e busca)'} | {validade[familia]} |")
    return D("referencia", "catalogo-tipos-documentais.md", "Catálogo completo de tipos documentais", "2026-09-04", "2026.3",
             ["Produto"], f"""
## 1. Sobre o catálogo

O catálogo lista os {total} tipos documentais que a plataforma organiza. A disponibilidade de cada um por localidade está na matriz de cobertura por UF. A coluna "Validade típica" é só uma referência: o alerta de vencimento usa a validade do próprio documento ou a regra do emissor cadastrada, nunca esta coluna.

## 2. Tipos documentais

{chr(10).join(linhas)}

## 3. Pedidos de tipos fora do catálogo

O cliente pode anexar ao dossiê qualquer documento fora do catálogo. Esses documentos ficam disponíveis para leitura e busca, sem extração de campos e sem pedido ao emissor pela Vereda.
""")


QUESTIONARIO = [
    ("Governança", [
        ("Existe política de segurança da informação aprovada pela diretoria?", "Sim. A política foi aprovada pela diretoria e é revista uma vez por ano."),
        ("Há uma pessoa responsável pela segurança da informação?", "Sim. O responsável de segurança responde ao diretor de tecnologia e participa do comitê de segurança mensal."),
        ("A empresa possui certificação ISO/IEC 27001 ou SOC 2?", "Não. O sistema de gestão está em implantação, com auditoria de certificação ISO/IEC 27001 prevista para o segundo semestre de 2027."),
        ("Há análise de riscos periódica?", "Sim, anual, com plano de tratamento acompanhado pelo comitê."),
    ]),
    ("Controle de acesso", [
        ("O acesso aos sistemas exige MFA?", "Sim, para administradores do portal, equipe técnica e produção. Para usuários dos clientes, a MFA é obrigatória no portal e no aplicativo."),
        ("Como é feita a concessão de acesso?", "Por chamado, com aprovação do gestor e do dono do sistema, no perfil mínimo necessário."),
        ("Com que frequência os acessos são revistos?", "Trimestralmente, com registro das decisões."),
        ("Em quanto tempo o acesso de um desligado é revogado?", "Em até 4 horas após a comunicação formal do RH interno."),
        ("Contas compartilhadas são permitidas?", "Não. Credenciais são individuais e intransferíveis."),
        ("Como funciona o acesso privilegiado?", "Acesso temporário de até 2 horas, com aprovação individual, MFA e registro da sessão."),
    ]),
    ("Proteção de dados", [
        ("Os dados são criptografados em repouso e em trânsito?", "Sim. AES-256 em repouso e TLS 1.2 ou superior em trânsito."),
        ("Onde os dados ficam armazenados?", "No Brasil, em provedor fictício Nuvem Aurora, com região principal em São Paulo e recuperação em região secundária no Brasil."),
        ("Há transferência internacional de dados?", "Sim, apenas para o provedor de IA da extração assistida, com cláusulas contratuais padrão e retenção técnica de 30 dias."),
        ("Os dados dos clientes são separados entre si?", "Sim. Há identificador de empresa obrigatório nas consultas, políticas de acesso por linha e testes automáticos de isolamento."),
        ("Como são feitos os backups?", "Backup completo diário, incrementais a cada 15 minutos, retenção de 35 dias e restauração amostral mensal."),
        ("Os dados são usados para treinar modelos de IA?", "Não. Nem pela Vereda nem pelo provedor de IA contratado."),
    ]),
    ("Operação e monitoramento", [
        ("Há monitoramento de segurança contínuo?", "Sim, operação de monitoramento 24 horas por dia, 7 dias por semana, com escala de plantão."),
        ("Quais eventos são registrados?", "Login, falha de login, alteração de perfil, exportação, aprovação de pedidos, emissão solicitada e ações administrativas."),
        ("Por quanto tempo os logs são guardados?", "A norma de registro e monitoramento determina 24 meses de retenção para os logs de segurança."),
        ("Os logs são protegidos contra alteração?", "Sim, em armazenamento imutável com verificação diária de integridade."),
        ("Há gestão de vulnerabilidades?", "Sim. Varreduras trimestrais de infraestrutura, análise de dependências em cada publicação e correção de críticas em até 15 dias corridos."),
        ("É feito teste de intrusão?", "Sim, anual, por empresa independente. O teste de 2026 não encontrou achados críticos."),
    ]),
    ("Incidentes e continuidade", [
        ("Existe plano de resposta a incidentes?", "Sim, com classificação por severidade, etapas de contenção e investigação e exercícios semestrais."),
        ("Em quanto tempo o cliente é comunicado de um incidente?", "Em até 72 horas após a confirmação."),
        ("Existe plano de continuidade de negócios?", "Sim, com exercício completo semestral e teste de mesa trimestral."),
        ("Quais são o RPO e o RTO?", "O plano de continuidade determina RPO de 15 minutos e RTO de 2 horas. O exercício de setembro de 2026 observou RPO de 12 minutos e RTO de 1 hora e 42 minutos."),
    ]),
    ("Desenvolvimento", [
        ("Há revisão de código?", "Sim, toda mudança é revisada por outra pessoa antes de entrar na linha principal."),
        ("Há testes de segurança no pipeline?", "Sim, análise estática, verificação de dependências e de segredos, que bloqueiam a publicação quando encontram problema."),
        ("Dados de produção são usados em testes?", "Não. Os ambientes de teste usam apenas dados sintéticos."),
    ]),
    ("Fornecedores", [
        ("Quais são os subprocessadores?", "Nuvem Aurora (infraestrutura), Mensageria Ipê (notificações) e o provedor de IA da extração assistida, todos fictícios."),
        ("Os fornecedores são avaliados?", "Sim, antes da contratação e uma vez por ano."),
        ("O cliente é avisado sobre novos subprocessadores?", "Sim, com 30 dias de antecedência, no plano Corporativo."),
    ]),
]


def questionario():
    corpo = ("## 1. Sobre este questionário\n\nRespostas padrão da Vereda ao questionário de segurança da informação usado em processos de "
             "homologação de fornecedores. As respostas valem na data deste documento e são revistas a cada trimestre.\n\n")
    for n, (tema, itens) in enumerate(QUESTIONARIO, 2):
        corpo += f"## {n}. {tema}\n\n" + "\n\n".join(f"**{p}** {r}" for p, r in itens) + "\n\n"
    return D("seguranca", "questionario-seguranca-padrao.md", "Questionário de segurança padrão respondido", "2026-10-07", "2026.4",
             ["Segurança e privacidade", "Tecnologia"], corpo)


CONDICOES = D("juridico", "condicoes-gerais-contratacao.md", "Condições gerais de contratação", "2026-06-17", "4.0", ["Jurídico", "Comercial"], """
## 1. Partes e objeto

Estas condições gerais regem a contratação da plataforma Vereda por empresas clientes. Fazem parte do contrato, junto com a proposta comercial aceita, o anexo de níveis de serviço e o acordo de tratamento de dados. Em caso de conflito, prevalece primeiro o acordo de tratamento de dados, depois o anexo de níveis de serviço, depois a proposta e, por fim, estas condições.

## 2. Serviços

A Vereda presta os serviços de solicitação, acompanhamento, organização e pré-análise de documentos, conforme o plano contratado. A Vereda não é órgão emissor, cartório nem escritório de advocacia e não garante a emissão de um documento quando o emissor se recusa a emiti-lo, exige requisitos que o cliente não cumpre ou está indisponível.

## 3. Obrigações do cliente

- Informar dados corretos dos titulares e a finalidade de cada pedido.
- Ter base legal para pedir documentos de cada titular.
- Aprovar orçamentos antes do protocolo.
- Pagar as faturas no vencimento.
- Manter um administrador responsável pelos acessos da sua empresa.

## 4. Obrigações da Vereda

- Prestar os serviços com diligência e conforme os níveis de serviço.
- Manter as medidas de segurança descritas na política de segurança.
- Avisar o cliente sobre exigências e falhas dos emissores.
- Guardar sigilo sobre as informações do cliente.

## 5. Preço e pagamento

Os preços estão na proposta comercial. O faturamento, o vencimento, as formas de pagamento e as regras de atraso seguem o documento de faturamento e pagamento. O reajuste é anual pelo IPCA, na data de aniversário do contrato.

## 6. Vigência e renovação

O contrato tem vigência de 24 meses e é renovado por períodos de 12 meses mediante aceite escrito das partes, enviado até 30 dias antes do fim da vigência.

## 7. Rescisão

Qualquer parte pode rescindir o contrato com aviso prévio de 60 dias corridos. Solicitações protocoladas antes da rescisão são entregues ou encerradas com prestação de contas. Em caso de descumprimento grave não corrigido em 15 dias após notificação, a parte prejudicada pode rescindir de imediato.

## 8. Prazo de disponibilização

A Vereda disponibiliza o documento ao cliente em até 2 dias úteis após o recebimento do arquivo do emissor. Prazos de emissão do próprio emissor não fazem parte das obrigações da Vereda.

## 9. Responsabilidade

A responsabilidade da Vereda fica limitada ao valor das mensalidades pagas nos 12 meses anteriores ao fato, exceto em caso de dolo, fraude ou violação comprovada de confidencialidade. Nenhuma parte responde por danos indiretos ou lucros cessantes.

## 10. Caso fortuito e força maior

Nenhuma parte responde por atrasos causados por eventos fora do seu controle razoável, como indisponibilidade de emissores públicos, greves de órgãos públicos ou falhas gerais de energia e telecomunicações, desde que comunique a outra parte assim que possível.

## 11. Cessão

O cliente não pode ceder o contrato sem autorização escrita da Vereda. A Vereda pode ceder o contrato a empresa do mesmo grupo, com aviso ao cliente.

## 12. Foro

Fica eleito o foro da Comarca de São Paulo/SP para resolver questões do contrato.
""")

MANUAL = D("produto", "manual-usuario-portal.md", "Manual do usuário do portal", "2026-09-22", "3.2", ["Produto"], """
## 1. Primeiro acesso

1. Abra o convite recebido por e-mail e crie a senha, com no mínimo 12 caracteres.
2. Configure o segundo fator de autenticação no aplicativo autenticador.
3. Aceite os termos de uso.
4. Escolha a unidade padrão, se você pertencer a mais de uma.

Empresas com SSO entram pelo botão "Entrar com a minha empresa", sem criar senha no portal.

## 2. Abrir um pedido

1. Na tela inicial, escolha "Novo pedido".
2. Selecione o tipo documental e o titular. Se o titular ainda não existe, cadastre o nome e o identificador.
3. Informe a localidade e a finalidade.
4. Escolha o centro de custo e o dossiê de destino.
5. Revise o orçamento e envie para aprovação.

Para muitos pedidos de uma vez, use "Importar planilha" e baixe o modelo CSV. Os erros são mostrados linha a linha antes da confirmação.

## 3. Acompanhar pedidos

A lista de pedidos pode ser filtrada por estado, tipo documental, titular e período. O ícone de alerta aparece nos pedidos com exigência do emissor. Abra o pedido para ver o motivo da exigência e anexar o que foi pedido.

## 4. Trabalhar com dossiês

1. Crie o dossiê a partir de um modelo de checklist.
2. Acompanhe os itens: cada item mostra se o documento foi pedido, recebido, conferido ou está pendente.
3. Para aceitar uma pendência, use "Aceitar pendência", escreva a justificativa e envie ao aprovador.
4. Quando todos os itens obrigatórios estiverem cumpridos, o dossiê passa para "Completo".

## 5. Conferir campos extraídos

Na aba "Conferência", os campos aparecem ordenados por confiança, dos de confiança baixa para os de alta. Clique em um campo para ver a página e o trecho de origem. Confirme ou corrija; a correção exige um motivo.

## 6. Baixar e exportar

Documentos podem ser baixados um a um ou exportados com o dossiê inteiro. Cada download e exportação fica registrado no log de auditoria com o seu usuário.

## 7. Notificações

Nas preferências, escolha quais notificações receber por e-mail: mudança de estado, exigência do emissor, orçamento aguardando aprovação e vencimentos.

## 8. Ajuda

O centro de ajuda tem artigos e vídeos de cada tela. Para abrir um chamado, use "Ajuda" e depois "Falar com o suporte", informando a severidade.
""")

RISCOS = D("seguranca", "analise-riscos-2026.md", "Análise de riscos de segurança 2026", "2026-03-27", "2026.1", ["Segurança e privacidade"], """
## 1. Método

Os riscos são avaliados por probabilidade (1 a 5) e impacto (1 a 5). O nível é o produto dos dois. Riscos com nível 12 ou mais exigem plano de tratamento aprovado pelo comitê.

## 2. Riscos avaliados

| Risco | Probabilidade | Impacto | Nível | Tratamento |
|---|---|---|---|---|
| Acesso indevido entre empresas clientes | 1 | 5 | 5 | Isolamento por empresa testado a cada publicação |
| Credencial de usuário do cliente comprometida | 3 | 4 | 12 | MFA obrigatória e bloqueio por tentativas |
| Indisponibilidade da região principal de nuvem | 2 | 4 | 8 | Recuperação em região secundária, testada semestralmente |
| Erro de extração usado em decisão do cliente | 3 | 4 | 12 | Conferência humana e descarte de campos sem trecho válido |
| Vazamento por fornecedor | 2 | 5 | 10 | Avaliação anual e cláusulas contratuais |
| Pedido de documento sem base legal pelo cliente | 2 | 4 | 8 | Finalidade obrigatória por pedido e norma de uso aceitável |
| Perda de dados por falha de backup | 1 | 5 | 5 | Restauração amostral mensal |
| Instrução maliciosa em documento enviado ao modelo de IA | 3 | 3 | 9 | Documento tratado como conteúdo e conferência automática dos trechos |
| Indisponibilidade de emissor estadual | 4 | 2 | 8 | Nova tentativa progressiva e aviso ao cliente |
| Uso de dados para treinar modelos gerais pelo provedor de IA | 1 | 5 | 5 | Proibição contratual e auditoria do contrato |

## 3. Planos de tratamento em andamento

- **Credencial comprometida:** implantar detecção de login em localização incomum até dezembro de 2026.
- **Erro de extração:** ampliar o conjunto de avaliação de 400 para 600 documentos rotulados até março de 2027.

## 4. Próxima revisão

A próxima análise completa está prevista para março de 2027, ou antes, se houver mudança relevante na plataforma ou em um fornecedor.
""")

RFP_CAMPO_VERDE = rfp_passada("rfp-2025-cooperativa-campo-verde.md", "RFP 2025: Cooperativa Campo Verde", "2025-08-12",
                              "Cooperativa Campo Verde (2025)", [
    ("A plataforma lê cédulas de produto rural?", "Sim. Extrai emitente, credor, produto, safra, quantidade e garantias mencionadas, com página e trecho."),
    ("A plataforma registra garantias?", "Não. Nenhum registro ou garantia é constituído pela extração; a avaliação da garantia é dos especialistas do cliente."),
    ("Como são tratadas divergências entre documentos do imóvel rural?", "A operação fica pendente de conferência, com as fontes divergentes registradas e decisão documentada do responsável."),
    ("Há cobertura de certidões em Mato Grosso?", "Sim, conforme a matriz de cobertura; parte dos tipos documentais é obtida por solicitação assistida."),
    ("Qual é o prazo de implantação?", "De 5 a 7 semanas no plano Corporativo."),
    ("A cooperativa pode integrar o sistema de crédito pela API?", "Sim, no plano Corporativo, com desenvolvimento da integração pela cooperativa."),
    ("Qual é a taxa por solicitação no plano Corporativo?", "R$ 12 por solicitação concluída, com desconto por volume a partir de 501 solicitações por mês."),
    ("Os associados conseguem acessar a plataforma?", "Não. O acesso é para usuários da cooperativa; associados não têm perfil próprio."),
    ("A plataforma funciona sem internet no campo?", "Não. O portal e o aplicativo precisam de conexão."),
    ("Há suporte por telefone?", "Sim, telefone de plantão 24 horas para severidade 1 no plano Corporativo."),
])

DOCS = [catalogo(), questionario(), CONDICOES, MANUAL, RISCOS, RFP_CAMPO_VERDE]
