"""Os 16 documentos que já estavam na base publicada da Vereda Documental, reconstruídos a partir dos blocos do
banco em 12/11/2026, com as mesmas linhas (aviso na linha 12, escopo na 14, uma seção a cada 4 linhas a partir da 16),
para a avaliação conferir as citações em disco. Não são carregados de novo: já estão na base publicada."""
from comum import AVISO, ESCOPO

EXISTENTES = [
    ("analise-ia-extracao.md", "Extração e análise documental assistida por IA", "2026-09-18", [
        ("1. Entrada", "PDF pesquisável, PDF digitalizado e imagens PNG ou JPEG; limite sintético de 50 MB e 200 páginas por arquivo."),
        ("2. Extração", "Tipo documental, titular, emissor, data de emissão, validade quando explícita e menções a restrições; cada campo aponta página e trecho de origem."),
        ("3. Classificação", "Classes sem apontamento, com apontamento, inconclusivo e ilegível. A classe é uma triagem assistida, sujeita a revisão humana; ilegível nunca equivale a sem apontamento."),
        ("4. Evidência", "Cada indicação traz página e trecho associado; quando não há evidência suficiente, a plataforma retorna inconclusivo e não completa lacunas por inferência."),
        ("5. Revisão", "Analista confirma ou corrige campos, registra justificativa e mantém texto original, sugestão, decisão e identidade do revisor no histórico."),
        ("6. Limites", "Não; a plataforma apoia triagem e conferência. Aprovação de crédito, aceite de risco e parecer jurídico exigem responsáveis humanos."),
        ("7. Dados de treino", "No cenário fictício, documentos não são usados para treinamento de modelos gerais. Inferência é restrita ao serviço contratado, com retenção técnica de 30 dias."),
    ]),
    ("anexo-sla-slo-rto.md", "Anexo de níveis de serviço", "2026-04-01", [
        ("1. Disponibilidade", "Disponibilidade mensal de 99,5%, excluídas manutenções avisadas com 72 horas de antecedência."),
        ("2. Severidade 1", "Resposta em até 30 minutos e meta de restauração em 8 horas."),
        ("3. Créditos", "Crédito de 5% da mensalidade de plataforma se a disponibilidade ficar abaixo de 99,5%, mediante solicitação em até 30 dias."),
        ("4. Manutenção", "Aviso por e-mail ao contato corporativo com 72 horas de antecedência; duração excluída do cálculo limitada a 4 horas por mês."),
        ("6. Recuperação", "O anexo SLA determina RPO de 60 minutos e RTO de 4 horas."),
    ]),
    ("arquitetura-sistemas-aplicacoes.md", "Arquitetura de sistemas e integrações", "2026-09-12", [
        ("1. Hospedagem", "Região principal em São Paulo e recuperação em região secundária no Brasil, em provedor fictício Nuvem Aurora."),
        ("2. Isolamento", "Identificador de tenant obrigatório nas consultas e políticas de acesso por linha; testes automatizados verificam acessos entre empresas."),
        ("3. Componentes", "Portal web, aplicativo, gateway de API, serviços de adesão e solicitação, fila de eventos e banco relacional com réplicas."),
        ("4. Subprocessadores", "Fornecedores fictícios Nuvem Aurora (infraestrutura) e Mensageria Ipê (notificações); ambos sujeitos a avaliação anual e contrato de tratamento."),
        ("5. Backup", "Backup completo diário, incrementais a cada 15 minutos e retenção de 35 dias; restauração amostral mensal."),
        ("6. Mudanças", "Revisão de código por pessoa diferente, testes de segurança no pipeline e aprovação de mudança com plano de reversão."),
    ]),
    ("auditoria-privacidade.md", "Avaliação interna de privacidade", "2026-09-28", [
        ("1. Papéis", "Cliente controla finalidade e seleção dos titulares; plataforma opera organização e extração documental sob instruções e controla segurança da própria conta. Emissores e fontes oficiais possuem responsabilidades próprias; não presumir papel único para toda a cadeia."),
        ("2. DPO", "Encarregado fictício identificado como DPO-SINT-001, contato dpo@vereda-sintetica.example. O domínio .example não recebe mensagens."),
        ("3. Titulares", "Canal autenticado com protocolo, validação proporcional de identidade e encaminhamento ao controlador responsável; relatório de acompanhamento semanal."),
        ("4. Eliminação", "Dados operacionais da plataforma são eliminados em até 90 dias, ressalvadas retenções documentadas e bloqueios de preservação. Documentos obtidos de emissores podem ter regras específicas não incluídas neste pacote."),
        ("5. Pendências", "Sim: revisão do inventário de integrações com vencimento interno em 30/11/2026. A avaliação é interna e não constitui certificação LGPD."),
    ]),
    ("catalogo-documentos-cobertura.md", "Catálogo sintético de documentos e cobertura", "2026-09-04", [
        ("1. Famílias", "Certidões fiscais, trabalhistas e judiciais, matrícula imobiliária, atos societários e documentos cadastrais. O catálogo é ilustrativo e não implica acesso universal a emissores."),
        ("2. Cobertura", "Matriz por tipo documental, unidade federativa, município, emissor e canal; a cobertura é confirmada antes do protocolo. Não existe promessa de cobertura integral de todo o Brasil."),
        ("3. Canais", "Integrações autorizadas, portais de emissores e solicitação operacional assistida. Exigência de procuração ou autorização é conferida por canal."),
        ("4. Autorização", "O pedido fica pendente de autorização quando o canal exige representação; acesso restrito não é contornado e credenciais pessoais não são compartilhadas."),
        ("5. Custos externos", "Orçamento por solicitação e aprovação do cliente antes do protocolo; despesas não aprovadas não são realizadas."),
        ("6. Validade", "A validade é transcrita do documento ou regra do emissor registrada na matriz. Se não houver validade documentada, o campo fica desconhecido, sem atribuir prazo padrão."),
        ("7. Identificação", "Identificadores artificiais TIT-SINT e IMOV-SINT, sem CPF, CNPJ ou matrícula real. O ambiente de demonstração não envia estes registros a emissores reais."),
    ]),
    ("contrato-prestacao-servicos.md", "Contrato de serviços de inteligência documental", "2026-06-17", [
        ("1. Objeto", "Solicitação, acompanhamento, organização e pré-análise de documentos em dossiês digitais. A Vereda Documental é uma empresa fictícia e não é órgão emissor, cartório ou escritório de advocacia."),
        ("2. Modalidades", "Essencial: gestão e solicitação; Profissional: gestão e extração assistida; Corporativo: análise assistida, API e segregação por unidades."),
        ("3. Preço", "Mensalidade sintética de R$ 3.000 no Corporativo, mais R$ 12 por solicitação concluída e reembolso de emolumentos externos aprovados. Valores inventados para testes."),
        ("4. Vigência", "Vigência de 24 meses e renovação por períodos de 12 meses mediante aceite escrito das partes."),
        ("5. Rescisão", "Aviso prévio de 60 dias corridos; solicitações protocoladas antes da rescisão são entregues ou encerradas com prestação de contas."),
        ("6. Responsabilidade", "O limite corresponde às mensalidades pagas nos 12 meses anteriores; não cobre dolo, fraude ou violação comprovada de confidencialidade."),
        ("7. Disponibilização", "O contrato prevê até 2 dias úteis entre o recebimento do arquivo do emissor e a disponibilização ao cliente."),
        ("8. Foro", "Comarca de São Paulo/SP no modelo simplificado do cenário."),
    ]),
    ("diligencia-credito-agro.md", "Diligência documental de crédito e agronegócio", "2026-09-23", [
        ("1. Operação", "Formação de dossiês documentais para crédito corporativo, crédito rural e negociação com fornecedores; não há concessão de crédito pela plataforma."),
        ("2. Agro", "Descrição do imóvel, partes, safra, produto, valor e menções a garantias, quando legíveis e presentes no arquivo. Nenhum registro ou garantia é constituído pela extração."),
        ("3. Garantias", "Não; apenas destaca dados e inconsistências. Avaliação econômica e jurídica da garantia é feita por especialistas do cliente."),
        ("4. Decisão", "A operação fica pendente de conferência; o sistema registra fontes divergentes e exige decisão documentada do responsável, sem resolver silenciosamente."),
    ]),
    ("diligencia-imobiliaria.md", "Checklist de due diligence imobiliária", "2026-09-22", [
        ("1. Checklist", "Matrícula, certidões do titular, documentos societários quando aplicáveis e documentos técnicos selecionados pelo cliente. O checklist é configurável e não substitui avaliação jurídica."),
        ("2. Imóvel", "Comparação assistida entre identificador, endereço e descrição constantes dos documentos; divergências ficam pendentes de validação pelo analista."),
        ("3. Ônus", "Menções são destacadas com página e trecho, sem concluir automaticamente sobre vigência, extinção ou efeito jurídico."),
        ("4. Conclusão", "Todos os documentos obrigatórios entregues e conferidos por responsável; pendência aceita precisa de justificativa e aprovador. Completo não significa risco inexistente."),
        ("5. Homônimos", "Ocorrências ficam em revisão com comparação de identificadores documentados; coincidência de nome não confirma identidade."),
    ]),
    ("fluxo-emissao-certidoes.md", "Fluxo operacional de emissão e acompanhamento", "2026-09-10", [
        ("1. Abertura", "Tipo documental, titular sintético, localidade, finalidade, centro de custo e autorização quando exigida."),
        ("2. Estados", "Rascunho, aguardando autorização, aguardando orçamento, aprovado, protocolado, exigência do emissor, recebido, entregue e cancelado."),
        ("3. Protocolo", "Cada pedido tem ID interno, protocolo externo quando existente, canal, data de envio e histórico de alterações."),
        ("4. Exigências", "Registrar motivo e documentos exigidos, notificar solicitante e suspender a meta interna de andamento enquanto se aguarda resposta; o histórico preserva o motivo."),
        ("5. Falha externa", "Registrar falha externa, reprogramar consulta com intervalo progressivo e notificar o cliente. Não marcar documento como negativo ou entregue."),
        ("6. Cancelamento", "Pode ser solicitado cancelamento operacional, mas despesas já incorridas não são estornadas automaticamente; depende de confirmação do emissor."),
        ("7. Duplicidade", "Chave por empresa, titular, tipo documental, localidade e janela de solicitação; pedido repetido retorna protocolo anterior até decisão expressa de renovação."),
    ]),
    ("norma-controle-de-acessos.md", "Norma de controle de acessos", "2026-09-05", [
        ("1. Aprovação", "Solicitação por chamado, aprovação do gestor e do dono do sistema, com perfil mínimo necessário."),
        ("2. Revisão", "Revisão trimestral, com registro de decisões e remoção de privilégios sem justificativa."),
        ("3. Desligamento", "Revogação em até 4 horas após o RH interno comunicar formalmente o desligamento."),
        ("4. Privilégios", "Acesso temporário de até 2 horas, aprovação individual, MFA, registro da sessão e proibição de contas compartilhadas."),
        ("5. Terceiros", "Patrocinador interno, finalidade documentada e expiração em até 30 dias, renovável com nova aprovação."),
    ]),
    ("norma-registro-e-monitoramento.md", "Norma de registro e monitoramento", "2026-09-08", [
        ("1. Eventos", "Login, falha de login, alteração de perfil, exportação, aprovação de pedidos, emissão solicitada e ação administrativa."),
        ("2. Monitoramento", "Operação sintética de monitoramento 24 horas por dia, 7 dias por semana, com escala de plantão."),
        ("3. Integridade", "Armazenamento imutável com segregação de contas e verificação diária de integridade."),
        ("4. Alertas", "Triagem em até 15 minutos, com escalonamento para o responsável por incidentes."),
        ("5. Retenção", "A norma operacional determina 24 meses de retenção."),
    ]),
    ("plano-continuidade-negocios.md", "Plano de continuidade de negócios", "2026-09-14", [
        ("1. Processos", "Autenticação, consulta de dossiês, abertura de pedidos, conferência de solicitações e recepção de solicitações de emissão."),
        ("2. Recuperação", "O plano de continuidade determina RPO de 15 minutos e RTO de 2 horas."),
        ("3. Comitê", "Lideranças de operações, tecnologia, segurança, privacidade e relacionamento empresarial; operações coordena a comunicação."),
        ("4. Comunicação", "Página de status e atualização ao contato corporativo a cada 60 minutos durante incidente de severidade 1."),
        ("5. Teste", "Exercício completo semestral e teste de mesa trimestral."),
    ]),
    ("politica-seguranca-informacao.md", "Política de segurança da informação", "2026-03-12", [
        ("1. Classificação", "Classes pública, interna, confidencial e restrita. Identidade, dados financeiros e movimentações documentais são restritos."),
        ("2. Senhas", "No mínimo 12 caracteres e troca em caso de suspeita de comprometimento."),
        ("3. MFA", "MFA para administradores do portal, equipe técnica e produção; acesso do solicitante exige segundo fator em operações sensíveis."),
        ("4. Criptografia", "AES-256 em repouso e TLS 1.2 ou superior em trânsito."),
        ("5. Retenção", "A política determina 6 meses de retenção."),
        ("6. Vulnerabilidades", "Varreduras trimestrais."),
        ("7. Correção crítica", "Correção de vulnerabilidades críticas em até 15 dias corridos."),
        ("8. Incidentes", "Comunicação contratual à empresa afetada em até 72 horas após confirmação."),
        ("9. Treinamento", "Treinamento anual para colaboradores."),
        ("11. Pentest", "Teste anual independente."),
    ]),
    ("portal-operacoes-documentais.md", "Portal operacional e gestão de dossiês", "2026-09-15", [
        ("1. Perfis", "Administrador, solicitante, analista e auditor de consulta, com acesso por organização e unidade."),
        ("2. Lotes", "Importação CSV com titular sintético, família documental, localidade e centro de custo; erros são reportados por linha antes da confirmação."),
        ("3. API", "API REST versão 1 com OAuth 2.0 para pedidos, consulta de status e download autorizado; exige integração pelo cliente."),
        ("4. SSO", "SSO SAML 2.0 no plano Corporativo e MFA obrigatória para todos os usuários internos e de empresas clientes."),
        ("5. Dossiê", "Dossiês por negócio, titular e imóvel, com checklist configurável, responsável, pendências e histórico de versões."),
        ("6. Relatórios", "Pedidos por status, gastos por centro de custo, tempo por etapa e documentos próximos do vencimento; exportação CSV."),
        ("7. Aprovação", "Solicitante prepara o orçamento e aprovador diferente autoriza despesas acima de R$ 500, conforme configuração da empresa."),
        ("8. Alertas", "Avisos internos a 30 e 7 dias do vencimento conhecido; documento sem data de validade não recebe vencimento presumido."),
        ("9. Disponibilização", "O portal operacional prevê disponibilização em até 1 dia útil após o recebimento do emissor."),
    ]),
    ("procedimento-recuperacao-desastres.md", "Procedimento e exercício de recuperação", "2026-09-25", [
        ("1. Acionamento", "Diretor de tecnologia e responsável de operações, em decisão conjunta registrada no incidente."),
        ("2. Sequência", "Declarar incidente; interromper escritas; validar réplica; ativar serviços secundários; conferir conferência; liberar tráfego gradualmente e comunicar clientes."),
        ("3. Resultado", "Exercício fictício de 24/09/2026: RPO observado de 12 minutos e RTO de 1 hora e 42 minutos; evidência EX-SINT-2026-09, sem relatório externo real."),
        ("4. Retorno", "Após validação de integridade e reconferência, janela aprovada pelo comitê, replicação reversa e monitoramento reforçado por 24 horas."),
    ]),
    ("termo-responsabilidade-administrador.md", "Termo do administrador do portal", "2026-05-20", [
        ("1. Responsabilidade do administrador", "O administrador da contratante revoga imediatamente o acesso de usuários de sua organização e revisa as permissões trimestralmente."),
        ("2. Credenciais", "Credenciais são individuais e intransferíveis; contas genéricas e compartilhadas são proibidas."),
        ("3. Dados", "Exportações restritas à finalidade de gestão do benefício, com acesso limitado e descarte seguro após o prazo interno da contratante."),
        ("4. Incidentes", "O termo prevê comunicação à empresa em até 72 horas após confirmação."),
    ]),
]


def texto(nome, titulo, data, secoes):
    linhas = ["---", f"titulo: {titulo}", "tipo: documento", f"atualizado_em: {data}", 'versao: "1.0"', "---", "",
              f"# {titulo}", "", "---", "", AVISO, "", ESCOPO, ""]
    for cabecalho, paragrafo in secoes:
        linhas += [f"## {cabecalho}", "", paragrafo, ""]
    return "\n".join(linhas)
