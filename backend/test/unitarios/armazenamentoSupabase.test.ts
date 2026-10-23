import { describe, expect, it } from "vitest";
import { ErroDeArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { criarArmazenamentoSupabase } from "../../src/armazenamento/armazenamentoSupabase.ts";

/** Cenário D14 · planilhas no Supabase Storage, com um Storage falso que guarda em memória. */
function storageFalso() {
  const objetos = new Map<string, Uint8Array>();
  const pedidos: { metodo: string; url: string; cabecalhos: Record<string, string> }[] = [];
  const buscar = (async (url: string, init: RequestInit) => {
    const cabecalhos = init.headers as Record<string, string>;
    pedidos.push({ metodo: init.method ?? "GET", url, cabecalhos });
    if (cabecalhos.apikey !== "sb_secret_falsa" && cabecalhos.apikey !== "eyJ.falsa") return new Response("{}", { status: 401 });
    if (init.method === "POST") {
      if (objetos.has(url)) return new Response("{}", { status: 409 });
      objetos.set(url, new Uint8Array(init.body as Uint8Array));
      return new Response("{}", { status: 200 });
    }
    const objeto = objetos.get(url);
    return objeto === undefined ? new Response("{}", { status: 404 }) : new Response(Buffer.from(objeto), { status: 200 });
  }) as typeof fetch;
  return { buscar, pedidos, objetos };
}

const opcoes = (buscar: typeof fetch, chaveDeServico = "sb_secret_falsa") => ({ supabaseUrl: "https://projeto.supabase.co", chaveDeServico, fetch: buscar });

describe("Cenário D14 · Supabase Storage", () => {
  it("grava com nome gerado no bucket privado e lê de volta o mesmo conteúdo", async () => {
    const { buscar, pedidos } = storageFalso();
    const armazenamento = criarArmazenamentoSupabase(opcoes(buscar));
    const caminho = await armazenamento.salvar("rfps", new Uint8Array([1, 2, 3]), "xlsx");

    expect(caminho).toMatch(/^rfps\/[0-9a-f-]{36}\.xlsx$/);
    expect(pedidos[0]).toMatchObject({
      metodo: "POST",
      url: `https://projeto.supabase.co/storage/v1/object/rfps/${caminho}`,
      cabecalhos: { apikey: "sb_secret_falsa", "x-upsert": "false", "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    });
    expect(pedidos[0]?.cabecalhos).not.toHaveProperty("Authorization");
    expect([...(await armazenamento.ler(caminho))]).toEqual([1, 2, 3]);
  });

  it("com a chave antiga (JWT), manda também o Authorization", async () => {
    const { buscar, pedidos } = storageFalso();
    await criarArmazenamentoSupabase(opcoes(buscar, "eyJ.falsa")).salvar("resultados", new Uint8Array([9]), "xlsx");
    expect(pedidos[0]?.cabecalhos.Authorization).toBe("Bearer eyJ.falsa");
  });

  it("recusa extensão inválida e caminho que não foi gerado pelo backend", async () => {
    const armazenamento = criarArmazenamentoSupabase(opcoes(storageFalso().buscar));
    await expect(armazenamento.salvar("rfps", new Uint8Array([1]), "../x")).rejects.toBeInstanceOf(ErroDeArmazenamento);
    await expect(armazenamento.ler("../outro-bucket/arquivo.xlsx")).rejects.toThrow("Caminho fora da pasta de dados.");
  });

  it("transforma recusa e falha de rede em erro de armazenamento, sem mostrar a chave", async () => {
    const recusado = criarArmazenamentoSupabase(opcoes(storageFalso().buscar, "sb_secret_errada"));
    await expect(recusado.salvar("rfps", new Uint8Array([1]), "xlsx")).rejects.toThrow("O armazenamento de arquivos recusou a operação (401).");
    const semRede = criarArmazenamentoSupabase(opcoes((async () => { throw new TypeError("fetch failed"); }) as typeof fetch));
    const erro = await semRede.salvar("rfps", new Uint8Array([1]), "xlsx").catch((e: unknown) => e as Error);
    expect(erro).toBeInstanceOf(ErroDeArmazenamento);
    expect((erro as Error).message).not.toContain("sb_secret");
  });
});
