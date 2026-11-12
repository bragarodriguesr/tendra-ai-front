"""Base sintética da Vereda Documental (fase U). Cada documento é um dicionário; o gerador
escreve o .md com o cabeçalho de FORMATO_BASE_MD.md e o aviso padrão da Vereda."""

AVISO = ("CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. "
         "Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências "
         "abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira "
         "ou comprovação de conformidade.")
ESCOPO = ("Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para "
          "avaliação do Tendra.ai.")


def D(pasta, nome, titulo, atualizado_em, versao, areas, corpo, tipo="documento"):
    """areas: rótulo esperado do autor para a avaliação U7 (o gabarito), não vai no arquivo."""
    return {"pasta": pasta, "nome": nome, "titulo": titulo, "atualizado_em": atualizado_em, "versao": versao,
            "areas": areas, "corpo": corpo.strip("\n"), "tipo": tipo}
