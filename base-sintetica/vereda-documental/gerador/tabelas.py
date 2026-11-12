"""Documentos de tabela e lista, comuns em bases reais, para a base passar do limiar de PU11 com folga."""
from comum import D
from referencia import rfp_passada

CHECKLISTS = {
    "Aquisição de imóvel urbano": [
        ("Certidão de inteiro teor da matrícula", "Sim", "30 dias"), ("Certidão de ônus reais", "Sim", "30 dias"),
        ("Certidão de ações reais e pessoais reipersecutórias", "Sim", "30 dias"), ("Certidão de débitos municipais (imobiliário)", "Sim", "Conforme o emissor"),
        ("Certidão de débitos federais do vendedor", "Sim", "180 dias"), ("Certidão negativa de débitos trabalhistas do vendedor", "Sim", "180 dias"),
        ("Certidão de distribuição cível do vendedor", "Sim", "30 dias"), ("Certidão de protesto do vendedor", "Sim", "30 dias"),
        ("Certidão de falência do vendedor pessoa jurídica", "Quando aplicável", "30 dias"), ("Contrato social consolidado do vendedor", "Quando aplicável", "Conforme o emissor"),
        ("Habite-se", "Sim", "A do documento"), ("Certidão de valor venal", "Não", "Conforme o emissor"),
        ("Declaração de débitos condominiais", "Quando aplicável", "30 dias"), ("Planta e memorial descritivo", "Não", "A do documento"),
    ],
    "Crédito rural com garantia de imóvel": [
        ("Certidão de inteiro teor da matrícula do imóvel rural", "Sim", "30 dias"), ("Certificado de cadastro de imóvel rural", "Sim", "A do documento"),
        ("Certidão de georreferenciamento", "Quando aplicável", "A do documento"), ("Certidão de débitos ambientais", "Sim", "Conforme o emissor"),
        ("Cédula de produto rural da safra", "Sim", "A do documento"), ("Certidão de registro de penhor rural", "Quando aplicável", "30 dias"),
        ("Certidão de débitos federais do produtor", "Sim", "180 dias"), ("Certidão de distribuição cível do produtor", "Sim", "30 dias"),
        ("Certidão de protesto do produtor", "Sim", "30 dias"), ("Certidão de outorga de uso de água", "Quando aplicável", "A do documento"),
        ("Licença ambiental de operação", "Quando aplicável", "A do documento"), ("Certidão de regime de bens do produtor", "Quando aplicável", "90 dias"),
    ],
    "Homologação de fornecedor": [
        ("Comprovante de situação cadastral federal", "Sim", "90 dias"), ("Certidão de débitos federais e dívida ativa da União", "Sim", "180 dias"),
        ("Certidão de débitos estaduais", "Sim", "Conforme o emissor"), ("Certidão de débitos municipais (mobiliário)", "Sim", "Conforme o emissor"),
        ("Certidão de regularidade do FGTS", "Sim", "30 dias"), ("Certidão negativa de débitos trabalhistas", "Sim", "180 dias"),
        ("Certidão de falência e recuperação judicial", "Sim", "30 dias"), ("Contrato social consolidado", "Sim", "Conforme o emissor"),
        ("Alvará de funcionamento", "Quando aplicável", "A do documento"), ("Atestado de capacidade técnica", "Não", "A do documento"),
        ("Certidão de infrações trabalhistas", "Não", "180 dias"),
    ],
    "Abertura de conta de pessoa jurídica": [
        ("Comprovante de situação cadastral federal", "Sim", "90 dias"), ("Contrato social consolidado ou estatuto", "Sim", "Conforme o emissor"),
        ("Última alteração contratual", "Sim", "Conforme o emissor"), ("Ata de eleição dos administradores", "Quando aplicável", "Conforme o emissor"),
        ("Procuração dos representantes", "Quando aplicável", "A do documento"), ("Certidão simplificada da junta comercial", "Sim", "30 dias"),
        ("Certidão de protesto", "Não", "30 dias"), ("Certidão de distribuição federal cível", "Não", "30 dias"),
    ],
}


CHECKLISTS["Due diligence de fusão ou aquisição"] = [
    ("Contrato social consolidado e alterações dos últimos 5 anos", "Sim", "Conforme o emissor"), ("Livro de registro de ações ou quotas", "Sim", "A do documento"),
    ("Atas de assembleias e reuniões dos últimos 3 anos", "Sim", "A do documento"), ("Certidão de falência e recuperação judicial", "Sim", "30 dias"),
    ("Certidão de débitos federais e dívida ativa da União", "Sim", "180 dias"), ("Certidão de débitos estaduais", "Sim", "Conforme o emissor"),
    ("Certidão de débitos municipais (mobiliário)", "Sim", "Conforme o emissor"), ("Certidão negativa de débitos trabalhistas", "Sim", "180 dias"),
    ("Certidão de regularidade do FGTS", "Sim", "30 dias"), ("Certidão de distribuição cível estadual", "Sim", "30 dias"),
    ("Certidão de distribuição federal cível", "Sim", "30 dias"), ("Certidão de execuções fiscais", "Sim", "30 dias"),
    ("Certidão de protesto de títulos", "Sim", "30 dias"), ("Matrículas dos imóveis próprios", "Quando aplicável", "30 dias"),
    ("Licença ambiental de operação", "Quando aplicável", "A do documento"), ("Alvará de funcionamento", "Sim", "A do documento"),
    ("Certidão de registro de marca", "Quando aplicável", "A do documento"), ("Certidões dos sócios pessoas físicas", "Sim", "30 dias"),
]
CHECKLISTS["Locação comercial"] = [
    ("Certidão de inteiro teor da matrícula", "Sim", "30 dias"), ("Certidão de ônus reais", "Sim", "30 dias"),
    ("Certidão de débitos municipais (imobiliário)", "Sim", "Conforme o emissor"), ("Habite-se", "Sim", "A do documento"),
    ("Auto de vistoria do corpo de bombeiros", "Sim", "A do documento"), ("Certidão de uso do solo", "Sim", "Conforme o emissor"),
    ("Certidão de distribuição cível do locador", "Sim", "30 dias"), ("Certidão de protesto do locador", "Não", "30 dias"),
    ("Comprovante de situação cadastral do locatário", "Sim", "90 dias"), ("Contrato social do locatário", "Sim", "Conforme o emissor"),
]


def checklists():
    corpo = ("## 1. Sobre os modelos\n\nOs modelos abaixo vêm prontos no ambiente de demonstração. A empresa pode copiá-los e ajustar os itens, "
             "a obrigatoriedade e quem aceita pendências. A coluna \"Antiguidade máxima\" indica quantos dias o documento pode ter na data de "
             "conclusão do dossiê; ela é configurável e não altera a validade do documento.\n\n")
    for n, (nome, itens) in enumerate(CHECKLISTS.items(), 2):
        corpo += f"## {n}. {nome}\n\n| Item | Obrigatório | Antiguidade máxima |\n|---|---|---|\n"
        corpo += "\n".join(f"| {i} | {o} | {a} |" for i, o, a in itens) + "\n\n"
    corpo += f"## {len(CHECKLISTS) + 2}. Aceite de pendências\n\nItens marcados como \"Quando aplicável\" podem ser dispensados pelo analista com justificativa. Itens obrigatórios só podem ficar pendentes com aceite de um aprovador.\n"
    return D("produto", "modelos-checklist-detalhados.md", "Modelos de checklist detalhados", "2026-09-20", "1.3", ["Produto"], corpo)


CAMPOS = [
    ("id_solicitacao", "Texto", "Identificador interno da solicitação na Vereda"), ("protocolo_emissor", "Texto", "Número de protocolo do emissor, quando existe"),
    ("data_abertura", "Data", "Data de abertura do pedido"), ("data_protocolo", "Data", "Data de envio ao emissor"),
    ("data_recebimento", "Data e hora", "Recebimento do arquivo do emissor"), ("data_entrega", "Data e hora", "Disponibilização no dossiê"),
    ("tipo_documental", "Texto", "Tipo documental do catálogo"), ("familia", "Texto", "Família documental"),
    ("uf", "Texto (2)", "Unidade federativa"), ("municipio", "Texto", "Município, quando o emissor é municipal"),
    ("canal", "Texto", "Integração, portal do emissor ou assistida"), ("titular_identificador", "Texto", "Identificador do titular (sintético em demonstração)"),
    ("unidade", "Texto", "Unidade da empresa cliente"), ("centro_custo", "Texto", "Centro de custo informado no pedido"),
    ("solicitante", "Texto", "E-mail corporativo de quem abriu o pedido"), ("aprovador", "Texto", "E-mail corporativo de quem aprovou o orçamento"),
    ("taxa_vereda", "Decimal", "Taxa da Vereda pela solicitação concluída"), ("emolumento_orcado", "Decimal", "Valor estimado no orçamento"),
    ("emolumento_cobrado", "Decimal", "Valor efetivamente cobrado pelo emissor"), ("diferenca_repassada", "Decimal", "Diferença repassada na fatura"),
    ("desconto_volume", "Decimal", "Desconto por volume aplicado sobre a taxa"), ("estado_final", "Texto", "Entregue ou cancelado"),
    ("motivo_cancelamento", "Texto", "Preenchido só para pedidos cancelados"), ("dossie", "Texto", "Identificador do dossiê de destino"),
    ("prazo_emissor_dias", "Inteiro", "Dias úteis entre protocolo e recebimento"), ("prazo_vereda_dias", "Inteiro", "Dias úteis entre recebimento e entrega"),
]


def layout_exportacao():
    corpo = ("## 1. Arquivo\n\nO arquivo de exportação de gastos é um CSV em UTF-8, separado por ponto e vírgula, com cabeçalho na primeira linha e uma linha "
             "por solicitação concluída ou cancelada com cobrança. Datas no formato AAAA-MM-DD e valores com ponto decimal.\n\n## 2. Campos\n\n"
             "| Campo | Tipo | Descrição |\n|---|---|---|\n" + "\n".join(f"| `{c}` | {t} | {d} |" for c, t, d in CAMPOS) +
             "\n\n## 3. Entrega\n\nO arquivo é gerado todo dia útil às 6h e enviado ao SFTP do cliente, com nome `gastos_AAAAMMDD.csv`. "
             "Arquivos não recebidos podem ser gerados de novo pelo portal por até 90 dias.\n\n## 4. Mudanças no layout\n\n"
             "Campos novos são acrescentados ao fim da linha, com aviso de 60 dias. Campos existentes não mudam de posição nem de tipo.\n")
    return D("tecnologia", "anexo-layout-exportacao.md", "Anexo técnico: layout da exportação de gastos", "2026-08-21", "1.1",
             ["Tecnologia", "Comercial"], corpo)


CONTROLES = [
    ("Políticas de segurança da informação", "Implementado"), ("Papéis e responsabilidades de segurança", "Implementado"),
    ("Segregação de funções", "Implementado"), ("Contato com autoridades", "Implementado"), ("Inteligência de ameaças", "Em implantação"),
    ("Segurança da informação em projetos", "Implementado"), ("Inventário de ativos", "Implementado"), ("Uso aceitável de ativos", "Implementado"),
    ("Classificação da informação", "Implementado"), ("Transferência de informação", "Implementado"), ("Controle de acesso", "Implementado"),
    ("Gestão de identidade", "Implementado"), ("Informação de autenticação", "Implementado"), ("Direitos de acesso", "Implementado"),
    ("Segurança em relacionamento com fornecedores", "Implementado"), ("Segurança em serviços de nuvem", "Implementado"),
    ("Planejamento da gestão de incidentes", "Implementado"), ("Aprendizado com incidentes", "Implementado"), ("Coleta de evidências", "Em implantação"),
    ("Continuidade durante interrupções", "Implementado"), ("Requisitos legais e contratuais", "Implementado"), ("Privacidade e proteção de dados pessoais", "Implementado"),
    ("Análise independente de segurança", "Em implantação"), ("Seleção de pessoal", "Implementado"), ("Conscientização e treinamento", "Implementado"),
    ("Processo disciplinar", "Implementado"), ("Trabalho remoto", "Implementado"), ("Perímetros físicos", "Não aplicável (sem data center próprio)"),
    ("Mesa limpa e tela limpa", "Implementado"), ("Dispositivos de usuários", "Implementado"), ("Acesso privilegiado", "Implementado"),
    ("Proteção contra malware", "Implementado"), ("Gestão de vulnerabilidades técnicas", "Implementado"), ("Gestão de configuração", "Em implantação"),
    ("Exclusão de informação", "Implementado"), ("Mascaramento de dados", "Em implantação"), ("Prevenção de vazamento de dados", "Em implantação"),
    ("Backup", "Implementado"), ("Redundância", "Implementado"), ("Registro de eventos", "Implementado"), ("Monitoramento", "Implementado"),
    ("Sincronização de relógios", "Implementado"), ("Segurança de redes", "Implementado"), ("Filtragem web", "Implementado"),
    ("Uso de criptografia", "Implementado"), ("Ciclo de desenvolvimento seguro", "Implementado"), ("Codificação segura", "Implementado"),
    ("Testes de segurança", "Implementado"), ("Separação de ambientes", "Implementado"), ("Gestão de mudanças", "Implementado"),
    ("Dados de teste", "Implementado"),
]


def mapeamento_controles():
    impl = sum(1 for _, s in CONTROLES if s == "Implementado")
    corpo = ("## 1. Finalidade\n\nMapeamento interno dos controles de segurança da Vereda contra os temas de controle da ISO/IEC 27002, preparado para a "
             "implantação do sistema de gestão de segurança. Não é uma declaração de conformidade nem substitui a certificação, que a Vereda ainda não possui.\n\n"
             f"## 2. Situação por controle\n\n| Tema de controle | Situação |\n|---|---|\n" + "\n".join(f"| {c} | {s} |" for c, s in CONTROLES) +
             f"\n\n## 3. Resumo\n\nDe {len(CONTROLES)} temas avaliados, {impl} estão implementados. Os temas em implantação têm plano com prazo até o "
             "primeiro semestre de 2027, antes da auditoria de certificação.\n")
    return D("seguranca", "mapeamento-controles-iso27002.md", "Mapeamento de controles de segurança", "2026-09-25", "1.0",
             ["Segurança e privacidade"], corpo)


OBRIGACOES = [
    ("Disponibilidade mensal de 99,5%", "Vereda", "Anexo de níveis de serviço", "Créditos de serviço"),
    ("Aviso de manutenção com 72 horas", "Vereda", "Anexo de níveis de serviço", "Período conta como indisponibilidade"),
    ("Disponibilização do documento em até 2 dias úteis", "Vereda", "Condições gerais", "Registro no relatório de acompanhamento"),
    ("Comunicação de incidente em até 72 horas", "Vereda", "Acordo de tratamento de dados", "Descumprimento contratual grave"),
    ("Aviso de novo subprocessador com 30 dias", "Vereda", "Acordo de tratamento de dados", "Direito de oposição e rescisão sem multa"),
    ("Eliminação dos dados em até 90 dias após o fim", "Vereda", "Acordo de tratamento de dados", "Certificado de eliminação"),
    ("Aprovar orçamentos antes do protocolo", "Cliente", "Condições gerais", "Pedido não segue"),
    ("Ter base legal para os pedidos", "Cliente", "Condições gerais e norma de uso aceitável", "Suspensão do usuário ou da conta"),
    ("Pagar a fatura no vencimento", "Cliente", "Faturamento e pagamento", "Multa, juros e suspensão de novos pedidos"),
    ("Manter administrador responsável pelos acessos", "Cliente", "Termo do administrador", "Responsabilidade do cliente pelos acessos"),
    ("Revisar permissões trimestralmente", "Cliente", "Termo do administrador", "Responsabilidade do cliente pelos acessos"),
    ("Guardar o segredo da integração", "Cliente", "Integrações", "Responsabilidade do cliente pelo uso indevido"),
    ("Aviso prévio de 60 dias para rescisão", "Ambas", "Condições gerais", "Pagamento do período de aviso"),
    ("Sigilo por 5 anos após o fim", "Ambas", "Acordo de confidencialidade", "Perdas e danos comprovados"),
]


def matriz_obrigacoes():
    corpo = ("## 1. Finalidade\n\nResumo das principais obrigações do contrato padrão, para consulta rápida das áreas comercial e de sucesso do cliente. "
             "Em caso de dúvida, vale o texto do documento de origem.\n\n## 2. Obrigações\n\n| Obrigação | Responsável | Documento de origem | Consequência do descumprimento |\n"
             "|---|---|---|---|\n" + "\n".join(f"| {a} | {b} | {c} | {d} |" for a, b, c, d in OBRIGACOES) +
             "\n\n## 3. Atualização\n\nA matriz é revista sempre que o contrato padrão, o anexo de níveis de serviço ou o acordo de tratamento de dados mudam.\n")
    return D("juridico", "matriz-obrigacoes-contratuais.md", "Matriz de obrigações contratuais", "2026-07-02", "1.0",
             ["Jurídico", "Comercial"], corpo)


HISTORICO_PRECOS = D("comercial", "historico-precos-2024-2026.md", "Histórico de preços 2024 a 2026", "2026-01-12", "1.0", ["Comercial"], """
## 1. Mensalidade da plataforma

| Plano | 2024 | 2025 | 2026 |
|---|---|---|---|
| Essencial | R$ 780 | R$ 840 | R$ 900 |
| Profissional | R$ 1.550 | R$ 1.680 | R$ 1.800 |
| Corporativo | R$ 2.500 | R$ 2.700 | R$ 3.000 |

## 2. Taxa por solicitação concluída

| Plano | 2024 | 2025 | 2026 |
|---|---|---|---|
| Essencial | R$ 16 | R$ 17 | R$ 18 |
| Profissional | R$ 14 | R$ 14 | R$ 15 |
| Corporativo | R$ 11 | R$ 12 | R$ 12 |

## 3. Observações

Os valores são os de tabela para novos contratos em cada ano. Contratos assinados em anos anteriores seguem o valor do contrato, reajustado anualmente pelo IPCA. O aumento do plano Corporativo em 2026 acompanhou a inclusão do aplicativo móvel e da análise assistida.
""")

RUNBOOK = D("tecnologia", "runbook-recuperacao-servicos.md", "Roteiro técnico de recuperação de serviços", "2026-09-25", "1.1",
            ["Tecnologia"], """
## 1. Quando usar

Este roteiro técnico detalha a ativação da região secundária, decidida conforme o procedimento de recuperação de desastres. Ele é usado pela equipe de plantão da engenharia.

## 2. Pré-checagem

1. Confirmar no incidente a decisão conjunta do diretor de tecnologia e do responsável de operações.
2. Confirmar o atraso da réplica na região secundária; ele precisa estar dentro do RPO do plano de continuidade.
3. Avisar o responsável por comunicação para atualizar a página de status.

## 3. Ativação

1. Colocar o portal e a API em modo de manutenção, interrompendo as escritas.
2. Promover a réplica do banco relacional na região secundária.
3. Apontar os serviços de aplicação para o banco promovido.
4. Ativar a fila de eventos secundária e conferir o atraso dos webhooks.
5. Rodar a bateria de verificação: login, abertura de pedido, consulta de dossiê e download.
6. Liberar o tráfego em etapas: 10%, 50% e 100%, com 10 minutos de observação entre elas.

## 4. Depois da ativação

Manter monitoramento reforçado por 24 horas, registrar os tempos de cada etapa no incidente e preparar o retorno para a região principal, que só acontece em janela aprovada pelo comitê.

## 5. Tempos de referência

No exercício de setembro de 2026, a ativação completa levou 1 hora e 42 minutos, com perda de dados de 12 minutos.
""")

RFP_FARMACIAS = rfp_passada("rfp-2026-rede-farmacias-ipe.md", "RFP 2026: Rede Farmácias Ipê", "2026-02-10", "Rede Farmácias Ipê (2026)", [
    ("A plataforma mantém as certidões dos fornecedores em dia?", "Sim. Os alertas de vencimento avisam a 30 e a 7 dias, e o plano Corporativo permite renovação automática com aprovação do orçamento."),
    ("Qual plano atende uma área de compras com 8 usuários?", "O plano Essencial, com 10 usuários incluídos."),
    ("O plano Essencial tem extração de campos?", "Não. A extração assistida está nos planos Profissional e Corporativo."),
    ("É possível importar a lista de fornecedores?", "Sim, por planilha CSV, com validação linha a linha."),
    ("Há relatório de gastos por centro de custo?", "Sim, em tela, CSV e PDF."),
    ("A plataforma consulta antecedentes criminais de sócios?", "Apenas quando houver finalidade legítima informada e cobertura do emissor; o pedido exige base legal do cliente."),
    ("Qual é o prazo de implantação do plano Essencial?", "A implantação é remota e padronizada, com duração típica de 3 a 4 semanas."),
    ("Há fidelidade mínima?", "A vigência padrão é de 24 meses, com aviso prévio de 60 dias para rescisão."),
    ("Os dados ficam no Brasil?", "Sim, com exceção da inferência da extração assistida, que não faz parte do plano Essencial."),
    ("A plataforma atende certidões de órgãos de vigilância sanitária?", "A licença sanitária está no catálogo como documento de leitura e busca, sem extração de campos."),
])

ADMIN = D("produto", "manual-administrador-portal.md", "Manual do administrador do portal", "2026-09-22", "2.0", ["Produto", "Segurança e privacidade"], """
## 1. Responsabilidades

O administrador da empresa cliente cria e desativa usuários, define unidades e centros de custo, configura limites de aprovação e modelos de checklist e acompanha o relatório mensal de acessos. O termo do administrador prevê a revogação imediata do acesso de quem sai da empresa e a revisão trimestral das permissões.

## 2. Usuários

1. Em "Administração", abra "Usuários" e use "Convidar usuário".
2. Informe nome, e-mail corporativo, perfil e unidades.
3. O convite vale por 7 dias. Convites vencidos podem ser reenviados.
4. Para desativar, abra o usuário e use "Desativar". O histórico de ações do usuário é preservado.

Com SSO, a criação de usuários pode ser automática no primeiro login, com o perfil padrão definido pelo administrador.

## 3. Limites de aprovação

O limite padrão de despesa sem aprovação adicional é de R$ 500 por pedido. O administrador pode alterar o limite por unidade e por centro de custo. A regra de que quem abre o pedido não aprova o próprio orçamento não pode ser desligada.

## 4. Unidades e centros de custo

Unidades organizam o acesso dos usuários; centros de custo organizam os gastos. Um centro de custo pode ser usado por mais de uma unidade. Centros de custo inativos não aparecem para novos pedidos, mas continuam nos relatórios.

## 5. Integrações

O administrador cria as credenciais da API, cadastra os endereços de webhook e rotaciona os segredos. Cada credencial tem escopos próprios e pode ser revogada a qualquer momento.

## 6. Auditoria

O log de auditoria da empresa mostra logins, alterações de perfil, exportações, downloads e aprovações. Ele pode ser filtrado por usuário, ação e período e exportado em CSV. O acesso ao log é restrito a administradores e auditores de consulta.
""")

BACKUP = D("tecnologia", "politica-backup-restauracao.md", "Política de backup e restauração", "2026-08-08", "1.2", ["Tecnologia", "Segurança e privacidade"], """
## 1. O que é copiado

Banco relacional, armazenamento de objetos com os documentos, configurações das empresas clientes e logs de auditoria.

## 2. Frequência e retenção

| Item | Frequência | Retenção |
|---|---|---|
| Banco relacional | Completo diário e incremental a cada 15 minutos | 35 dias |
| Documentos | Versionamento contínuo | 35 dias para versões apagadas |
| Configurações | Diária | 90 dias |
| Logs de auditoria | Contínua, em armazenamento imutável | Conforme a norma de registro e monitoramento |

## 3. Proteção das cópias

As cópias são criptografadas com AES-256 e guardadas na região secundária no Brasil, em conta de nuvem separada da produção, com permissão de exclusão restrita a duas pessoas.

## 4. Testes de restauração

Uma restauração amostral é feita todo mês, sorteando um dia e conferindo a integridade dos dados restaurados. Uma restauração completa do banco é feita no exercício semestral do plano de continuidade.

## 5. Restauração a pedido do cliente

A restauração de dados apagados por engano pelo cliente pode ser pedida em até 30 dias, por chamado de severidade 2. A restauração é feita apenas para a empresa que pediu, sem afetar as demais.
""")

SATISFACAO = D("comercial", "relatorio-satisfacao-clientes-2026.md", "Relatório de satisfação dos clientes 2026", "2026-07-20", "1.0", ["Comercial", "Produto"], """
## 1. Pesquisa

A pesquisa semestral foi respondida por 318 usuários de 37 empresas clientes fictícias, em junho de 2026.

## 2. Resultados

| Pergunta | Nota média (0 a 10) |
|---|---|
| Satisfação geral com a plataforma | 8,4 |
| Facilidade para abrir pedidos | 8,9 |
| Clareza do acompanhamento dos pedidos | 8,1 |
| Qualidade da extração assistida | 7,6 |
| Atendimento do suporte | 8,7 |
| Probabilidade de recomendar | 8,2 |

No plano Corporativo, a satisfação geral foi 8,6.

## 3. Pontos de melhoria citados

- Mais tipos documentais com extração de campos.
- Extração de documentos em inglês.
- Menos tempo em pedidos com canal assistido.

## 4. Ações

A extração em inglês entrou no roteiro do primeiro semestre de 2027. A equipe de operações passou a publicar no portal o prazo típico por emissor nos canais assistidos.
""")

DOCS = [ADMIN, BACKUP, SATISFACAO, checklists(), layout_exportacao(), mapeamento_controles(), matriz_obrigacoes(), HISTORICO_PRECOS, RUNBOOK, RFP_FARMACIAS]
