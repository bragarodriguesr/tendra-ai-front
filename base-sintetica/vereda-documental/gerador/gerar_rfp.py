"""Gera a RFP da Vereda Documental e o gabarito para a avaliação da fase U (cenários U7 e U16).
Uso: python3 gerar_rfp.py   (rodar de dentro desta pasta)"""
import json, pathlib
from openpyxl import Workbook
from openpyxl.styles import Font

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PASTA = RAIZ / "rfps"
ARQUIVO = "RFP-V1-Banco-Pampa-Homologacao.xlsx"
COMPRADOR = "Banco Pampa S.A. (fictício)"

# (ref, área na planilha, critério, pergunta, área esperada da classificação, documentos esperados, caso)
# Documentos esperados: nome do arquivo, sem a pasta. Lista vazia: a base não responde (Sem rascunho esperado).
PERGUNTAS = [
    ("1.01", "COMERCIAL", "Modelo comercial", "Quais planos de contratação a plataforma oferece e o que diferencia cada um?", "Comercial", ["comparativo-planos.md", "contrato-prestacao-servicos.md"], None),
    ("1.02", "COMERCIAL", "Modelo comercial", "Qual é a mensalidade do plano Corporativo e quantos usuários estão incluídos?", "Comercial", ["tabela-precos-2026.md", "proposta-padrao-corporativo.md"], None),
    ("1.03", "COMERCIAL", "Modelo comercial", "Quanto custa cada solicitação concluída no plano Corporativo?", "Comercial", ["tabela-precos-2026.md", "contrato-prestacao-servicos.md"], None),
    ("1.04", "COMERCIAL", "Modelo comercial", "Há desconto por volume de solicitações? A partir de quantas por mês?", "Comercial", ["politica-descontos-volume.md"], None),
    ("1.05", "COMERCIAL", "Modelo comercial", "Os emolumentos dos cartórios estão incluídos na mensalidade?", "Comercial", ["politica-reembolso-emolumentos.md", "tabela-precos-2026.md"], None),
    ("1.06", "COMERCIAL", "Modelo comercial", "Como funciona o reajuste anual dos preços?", "Comercial", ["politica-reajuste.md", "condicoes-gerais-contratacao.md"], None),
    ("1.07", "COMERCIAL", "Faturamento", "Qual é o vencimento das faturas e o que acontece em caso de atraso?", "Comercial", ["faturamento-pagamento.md"], None),
    ("1.08", "COMERCIAL", "Piloto", "É possível fazer um piloto antes da contratação? Em quais condições?", "Comercial", ["condicoes-piloto-poc.md"], None),
    ("1.09", "COMERCIAL", "Referências", "Quantos clientes a empresa atende hoje e em quais segmentos?", "Comercial", ["referencias-clientes-sinteticos.md", "apresentacao-institucional.md"], None),
    ("1.10", "COMERCIAL", "Modelo comercial", "Qual é o preço por hora de um projeto de integração sob medida?", "Comercial", ["tabela-precos-2026.md"], None),
    ("2.01", "PRODUTO", "Funcionalidades", "Quais tipos de certidão a plataforma consegue solicitar para pessoa jurídica?", "Produto", ["catalogo-tipos-documentais.md", "catalogo-documentos-cobertura.md"], None),
    ("2.02", "PRODUTO", "Funcionalidades", "A plataforma tem cobertura de certidões no Mato Grosso? Por qual canal?", "Produto", ["matriz-cobertura-uf.md", "cadastro-emissores-municipios.md"], None),
    ("2.03", "PRODUTO", "Funcionalidades", "Como são organizados os dossiês e o que significa um dossiê completo?", "Produto", ["modulo-dossies-checklists.md", "diligencia-imobiliaria.md"], None),
    ("2.04", "PRODUTO", "Funcionalidades", "Quais itens compõem o checklist de crédito rural com garantia de imóvel?", "Produto", ["modelos-checklist-detalhados.md"], None),
    ("2.05", "PRODUTO", "Funcionalidades", "Com que antecedência a plataforma avisa o vencimento de uma certidão?", "Produto", ["alertas-vencimento-renovacao.md", "portal-operacoes-documentais.md"], None),
    ("2.06", "PRODUTO", "Funcionalidades", "Quais campos são extraídos de uma matrícula de imóvel?", "Produto", ["modulo-extracao-campos.md"], None),
    ("2.07", "PRODUTO", "Funcionalidades", "Existe aplicativo móvel para aprovar despesas? Quais sistemas operacionais são suportados?", "Produto", ["aplicativo-movel-aprovacoes.md"], None),
    ("2.08", "PRODUTO", "Funcionalidades", "Quais relatórios gerenciais estão disponíveis?", "Produto", ["painel-relatorios-indicadores.md", "portal-operacoes-documentais.md"], None),
    ("2.09", "PRODUTO", "Implantação", "Quanto tempo leva a implantação do plano Corporativo?", "Produto", ["implantacao-onboarding.md", "proposta-padrao-corporativo.md"], None),
    ("2.10", "PRODUTO", "Roteiro", "A extração de campos funciona para documentos em inglês?", "Produto", ["modulo-extracao-campos.md", "roteiro-produto-2027.md"], None),
    ("2.11", "PRODUTO", "Funcionalidades", "A plataforma concede crédito ou emite parecer jurídico?", "Produto", ["analise-ia-extracao.md", "visao-geral-plataforma.md"], None),
    ("3.01", "TECNOLOGIA", "Integração", "A plataforma oferece API? Qual é o método de autenticação?", "Tecnologia", ["api-referencia-v1.md", "portal-operacoes-documentais.md"], None),
    ("3.02", "TECNOLOGIA", "Integração", "Quais eventos podem ser recebidos por webhook e como a autenticidade é garantida?", "Tecnologia", ["webhooks-eventos.md"], None),
    ("3.03", "TECNOLOGIA", "Integração", "Qual é o limite de requisições por minuto da API no plano Profissional?", "Tecnologia", ["tabela-precos-2026.md"], "fonte-em-outra-area"),
    ("3.04", "TECNOLOGIA", "Integração", "Qual é o limite de requisições por minuto da API no plano Corporativo?", "Tecnologia", ["limites-desempenho-capacidade.md"], None),
    ("3.05", "TECNOLOGIA", "Arquitetura", "Em que região os dados ficam hospedados e qual é o provedor de nuvem?", "Tecnologia", ["arquitetura-sistemas-aplicacoes.md", "modelo-dados-retencao-tecnica.md"], None),
    ("3.06", "TECNOLOGIA", "Continuidade", "Quais são o RPO e o RTO da plataforma?", "Tecnologia", ["plano-continuidade-negocios.md", "anexo-sla-slo-rto.md"], "conflito-rpo-rto"),
    ("3.07", "TECNOLOGIA", "Continuidade", "Com que frequência são feitos backups e por quanto tempo ficam guardados?", "Tecnologia", ["politica-backup-restauracao.md", "arquitetura-sistemas-aplicacoes.md"], None),
    ("3.08", "TECNOLOGIA", "Nível de serviço", "Qual é a disponibilidade mensal garantida e qual é o crédito em caso de descumprimento?", "Tecnologia", ["anexo-sla-slo-rto.md"], None),
    ("3.09", "TECNOLOGIA", "Suporte", "Qual é o tempo de primeira resposta para um chamado de severidade 1?", "Tecnologia", ["suporte-tecnico-niveis.md", "anexo-sla-slo-rto.md"], None),
    ("3.10", "TECNOLOGIA", "Ambientes", "Existe ambiente de homologação para testar a integração?", "Tecnologia", ["ambientes-homologacao.md"], None),
    ("3.11", "TECNOLOGIA", "Mudanças", "Como são publicadas novas versões e com que antecedência mudanças na API são avisadas?", "Tecnologia", ["gestao-mudancas-releases.md", "notas-versao-2026.md"], None),
    ("3.12", "TECNOLOGIA", "Exportação", "Qual é o layout do arquivo de exportação de gastos para o ERP?", "Tecnologia", ["anexo-layout-exportacao.md"], None),
    ("4.01", "SEGURANÇA", "Certificações", "A empresa possui certificação ISO/IEC 27001 ou SOC 2?", "Segurança e privacidade", ["declaracao-iso27001-em-implantacao.md"], None),
    ("4.02", "SEGURANÇA", "Criptografia", "Quais algoritmos de criptografia são usados em repouso e em trânsito?", "Segurança e privacidade", ["politica-seguranca-informacao.md", "criptografia-chaves.md"], None),
    ("4.03", "SEGURANÇA", "Acesso", "O acesso à plataforma exige autenticação de dois fatores?", "Segurança e privacidade", ["politica-seguranca-informacao.md", "portal-operacoes-documentais.md"], None),
    ("4.04", "SEGURANÇA", "Incidentes", "Em quanto tempo o cliente é comunicado de um incidente de segurança?", "Segurança e privacidade", ["plano-resposta-incidentes.md", "politica-seguranca-informacao.md"], None),
    ("4.05", "SEGURANÇA", "Registros", "Por quanto tempo os logs de segurança são guardados?", "Segurança e privacidade", ["norma-registro-e-monitoramento.md", "politica-seguranca-informacao.md"], "conflito-retencao-logs"),
    ("4.06", "SEGURANÇA", "Vulnerabilidades", "Qual é o prazo para corrigir uma vulnerabilidade crítica?", "Segurança e privacidade", ["gestao-vulnerabilidades.md", "politica-seguranca-informacao.md"], None),
    ("4.07", "SEGURANÇA", "Testes", "É feito teste de intrusão independente? Qual foi o resultado mais recente?", "Segurança e privacidade", ["relatorio-teste-intrusao-2026.md"], None),
    ("4.08", "PRIVACIDADE", "LGPD", "Quem é o encarregado de dados e como contatá-lo?", "Segurança e privacidade", ["politica-privacidade-plataforma.md", "auditoria-privacidade.md"], None),
    ("4.09", "PRIVACIDADE", "LGPD", "Os documentos são usados para treinar modelos de inteligência artificial?", "Segurança e privacidade", ["analise-ia-extracao.md", "propriedade-intelectual.md"], None),
    ("4.10", "PRIVACIDADE", "Subprocessadores", "Quais são os subprocessadores e há transferência internacional de dados?", "Segurança e privacidade", ["gestao-fornecedores-subprocessadores.md"], None),
    ("4.11", "SEGURANÇA", "Pessoas", "Quantas pessoas trabalham exclusivamente na equipe de segurança da informação?", "Segurança e privacidade", [], "sem-resposta"),
    ("5.01", "JURÍDICO", "Contrato", "Qual é a vigência do contrato e o aviso prévio para rescisão?", "Jurídico", ["contrato-prestacao-servicos.md", "condicoes-gerais-contratacao.md"], None),
    ("5.02", "JURÍDICO", "Contrato", "Qual é o limite de responsabilidade da contratada?", "Jurídico", ["limitacao-responsabilidade-seguros.md", "contrato-prestacao-servicos.md"], None),
    ("5.03", "JURÍDICO", "Contrato", "Em quanto tempo o documento recebido do emissor é disponibilizado ao cliente?", "Jurídico", ["contrato-prestacao-servicos.md", "portal-operacoes-documentais.md"], "conflito-prazo-disponibilizacao"),
    ("5.04", "JURÍDICO", "Proteção de dados", "O contrato inclui acordo de tratamento de dados? O cliente pode auditar?", "Jurídico", ["acordo-tratamento-dados-dpa.md"], None),
    ("5.05", "JURÍDICO", "Seguros", "A empresa mantém seguro de responsabilidade civil e de riscos cibernéticos?", "Jurídico", ["limitacao-responsabilidade-seguros.md"], None),
    ("5.06", "JURÍDICO", "Representação", "Como a plataforma lida com emissores que exigem procuração do titular?", "Jurídico", ["procuracoes-representacao.md", "catalogo-documentos-cobertura.md"], None),
    ("5.07", "JURÍDICO", "Contrato", "A contratada aceita multa de 20% do contrato por descumprimento do SLA?", "Jurídico", [], "compromisso-nao-sustentado"),
    ("5.08", "JURÍDICO", "Integridade", "A empresa possui política anticorrupção e canal de denúncias?", "Jurídico", ["politica-anticorrupcao-integridade.md"], None),
    ("6.01", "GERAL", "Institucional", "Descreva brevemente a empresa, o ano de fundação e o número de colaboradores.", "Geral", ["apresentacao-institucional.md"], None),
    ("6.02", "GERAL", "Institucional", "A empresa possui escritório físico em Porto Alegre para atendimento presencial?", "Geral", [], "sem-resposta"),
]


def gerar():
    PASTA.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    instr = wb.active
    instr.title = "Instruções ao Fornecedor"
    instr["A3"] = "Instruções para o preenchimento do questionário"
    instr["A3"].font = Font(bold=True)
    instr["A6"] = (f"O fornecedor deve responder a cada item da planilha \"Questionário\" e usar a coluna de comentários para esclarecimentos. "
                   f"Comprador: {COMPRADOR}. Prazo para envio das respostas: 10/12/2026.")
    q = wb.create_sheet("Questionário")
    q["A3"] = "Vereda Documental: Homologação de fornecedor de gestão documental"
    q["A4"] = f"Comprador: {COMPRADOR} · Prazo: 10/12/2026"
    for coluna, titulo in zip("ABCDEF", ["Ref", "Área", "Critério", "Pergunta", "Resposta do fornecedor", "Comentários (descreva e/ou esclareça)"]):
        q[f"{coluna}5"] = titulo
        q[f"{coluna}5"].font = Font(bold=True)
    perguntas = []
    for linha, (ref, area_planilha, criterio, pergunta, area, docs, caso) in enumerate(PERGUNTAS, 6):
        q[f"A{linha}"], q[f"B{linha}"], q[f"C{linha}"], q[f"D{linha}"] = ref, area_planilha, criterio, pergunta
        perguntas.append({"ref": ref, "linha": linha, "pergunta": pergunta, "tem_resposta": bool(docs),
                          "estado_esperado_base": "sugerida" if docs else "sem-rascunho", "documentos_esperados": docs,
                          "area_esperada": area, **({"caso": caso} if caso else {}), "notas": []})
    wb.save(PASTA / ARQUIVO)
    gabarito = {
        "data_referencia": "2026-11-12",
        "empresa": "Vereda Documental (fictícia)",
        "observacao": ("Gabarito da fase U (SPEC_FASE_U.md, cenários U7 e U16). area_esperada é a área que a classificação das perguntas deve "
                       "atribuir. Casos: fonte-em-outra-area (a resposta está só num documento de outra área: testa a segunda tentativa com a "
                       "base inteira, U11); conflito-* (fontes que se contradizem, uma delas na base desde antes da fase U); sem-resposta e "
                       "compromisso-nao-sustentado (devem ficar Sem rascunho)."),
        "pasta_base": "base",
        "pasta_atualizacao": "base",
        "rfps": [{"arquivo": f"rfps/{ARQUIVO}", "aba": "Questionário", "perguntas": perguntas}],
    }
    (PASTA / "gabarito-rfp-vereda.json").write_text(json.dumps(gabarito, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return len(perguntas)


if __name__ == "__main__":
    print(gerar(), "perguntas em", PASTA / ARQUIVO)
