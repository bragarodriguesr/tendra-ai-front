/**
 * Áreas da fase N (SPEC_FASE_N.md). A pergunta tem uma área principal (PN4), atribuída pela IA
 * (PN5) ou "Geral" quando não há área clara ou a classificação falha (PN6). Só o Aprovador tem
 * área (PN3); C-Level vale por todas (PN2). Lista fixa, a mesma para todas as organizações (PN1).
 */

export const AREA_GERAL = "Geral";
export const C_LEVEL = "C-Level";

/** Áreas que a IA pode atribuir a uma pergunta, além de "Geral". */
export const AREAS_DAS_PERGUNTAS = ["Produto", "Tecnologia", "Segurança e privacidade", "Comercial", "Jurídico"] as const;

/** Áreas de uma pergunta, "Geral" incluída: as opções da troca de área (PN7). */
export const AREAS_DOS_ITENS = [...AREAS_DAS_PERGUNTAS, AREA_GERAL] as const;

/** Áreas que um Aprovador pode ter. */
export const AREAS_DO_APROVADOR = [...AREAS_DAS_PERGUNTAS, C_LEVEL] as const;

export class ErroDeArea extends Error {
  override name = "ErroDeArea";
}

/** Área de pergunta da lista, ou null. Aceita a forma exata, sem diferença de maiúsculas e espaços nas pontas. */
export function areaDoItem(texto: string): string | null {
  const procurada = texto.trim().toLocaleLowerCase("pt-BR");
  return AREAS_DOS_ITENS.find((area) => area.toLocaleLowerCase("pt-BR") === procurada) ?? null;
}

/**
 * Áreas do perfil, validadas e sem repetição. O Revisor não tem área (PN3); C-Level não se combina
 * com outras, porque já vale por todas.
 */
export function validarAreasDoPerfil(papel: string, informadas: string[]): string[] {
  const areas: string[] = [];
  for (const informada of informadas.map((area) => area.trim()).filter((area) => area !== "")) {
    const area = AREAS_DO_APROVADOR.find((candidata) => candidata.toLocaleLowerCase("pt-BR") === informada.toLocaleLowerCase("pt-BR"));
    if (area === undefined) throw new ErroDeArea(`Área inválida "${informada}". Use ${AREAS_DO_APROVADOR.join(", ")}.`);
    if (!areas.includes(area)) areas.push(area);
  }
  if (areas.length > 0 && papel !== "Aprovador") throw new ErroDeArea("Só o Aprovador tem área.");
  if (areas.includes(C_LEVEL) && areas.length > 1) throw new ErroDeArea("C-Level já vale por todas as áreas: não combine com outras.");
  return areas;
}

/**
 * Quem pode aprovar a pergunta dessa área (cenários N5 a N7). `areas` indefinido é a pessoa do modo
 * local, sem login, que não tem área: nada restringe, como o papel (cenário 41).
 */
export function podeAprovarArea(areas: readonly string[] | undefined, area: string): boolean {
  if (areas === undefined) return true;
  return area === AREA_GERAL || areas.includes(C_LEVEL) || areas.includes(area);
}

export const motivoDeAreaRestrita = (area: string) => `Só a área ${area} ou C-Level aprova esta resposta.`;
