"""Gera base-sintetica/vereda-documental/base/ a partir dos módulos de conteúdo.
Uso: python3 gerar.py   (rodar de dentro desta pasta)"""
import json, pathlib, shutil
from comum import AVISO, ESCOPO
import existentes
import produto, tecnologia, seguranca, comercial, juridico, referencia, extensos, complementos, tabelas

MODULOS = [produto, tecnologia, seguranca, comercial, juridico, referencia, extensos, complementos, tabelas]
RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "base"


def escrever():
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    nomes, rotulos = set(), []
    for modulo in MODULOS:
        for d in modulo.DOCS:
            assert d["nome"] not in nomes, d["nome"]
            nomes.add(d["nome"])
            texto = (f"---\ntitulo: {d['titulo']}\ntipo: {d['tipo']}\natualizado_em: {d['atualizado_em']}\n"
                     f"versao: \"{d['versao']}\"\n---\n\n# {d['titulo']}\n\n{AVISO}\n\n{ESCOPO}\n\n{d['corpo']}\n")
            caminho = DESTINO / d["pasta"] / d["nome"]
            caminho.parent.mkdir(parents=True, exist_ok=True)
            caminho.write_text(texto, encoding="utf-8")
            rotulos.append({"documento": f"{d['pasta']}/{d['nome']}", "tipo": d["tipo"], "areas_esperadas": d["areas"]})
    pasta = DESTINO / "existentes"
    pasta.mkdir(parents=True, exist_ok=True)
    for nome, titulo, data, secoes in existentes.EXISTENTES:
        assert nome not in nomes, nome
        nomes.add(nome)
        (pasta / nome).write_text(existentes.texto(nome, titulo, data, secoes), encoding="utf-8")
    (RAIZ / "areas-esperadas-documentos.json").write_text(json.dumps({
        "observacao": "Áreas esperadas dos documentos novos da Vereda Documental, rotuladas pelo autor da base para a avaliação U7 (SPEC_FASE_U.md). RFPs passadas ficam Geral sem classificar (PU2). Os 16 documentos que já estavam na base publicada não estão aqui.",
        "documentos": rotulos}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return len(rotulos)


if __name__ == "__main__":
    print(escrever(), "documentos gerados em", DESTINO)
