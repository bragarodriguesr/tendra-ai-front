/**
 * Painel de Usuários (fase Q, docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md). No modo compartilhado a lista
 * vem de /api/gestao/usuarios e quem decide é o backend; no modo local (sem login), a tela usa os dados
 * de exemplo abaixo, só no navegador. As regras de área seguem a fase N: só o Aprovador tem área.
 */
import { C_LEVEL } from "./areas.js";

/**
 * Áreas que o Aprovador pode ter (PN1 e PN2), na ordem da lista suspensa. Só no modo local: no
 * compartilhado, a lista vem do backend (DF7). Regra repetida, registrada em product/ARQUITETURA.md.
 */
export const AREAS_DO_APROVADOR = ["Produto", "Tecnologia", "Segurança e privacidade", "Comercial", "Jurídico", C_LEVEL];

/** Pessoas de exemplo (fictícias), só no modo local (DF1), com as duas da lista de configuração do backend. */
export const USUARIOS_DE_EXEMPLO = [
  { id: "exemplo-carla", nome: "Carla Diretora", email: "carla.diretora@pulse.com.br", papel: "Aprovador", areas: [C_LEVEL], ativo: true },
  { id: "exemplo-kadu", nome: "Kadu Mendes", email: "kadu.mendes@pulse.com.br", papel: "Revisor", areas: [], ativo: true },
  { id: "exemplo-marcelo", nome: "Marcelo Vieira", email: "marcelo.vieira@pulse.com.br", papel: "Aprovador", areas: ["Jurídico", "Comercial"], ativo: true },
  { id: "exemplo-paula", nome: "Paula Rocha", email: "paula.rocha@pulse.com.br", papel: "Revisor", areas: [], ativo: false }
];

/** Marcar ou desmarcar uma área (Q6): C-Level desmarca as demais, e outra área desmarca C-Level. */
export function areasAoMarcar(areas, area) {
  if (areas.includes(area)) return areas.filter((a) => a !== area);
  return area === C_LEVEL ? [C_LEVEL] : [...areas.filter((a) => a !== C_LEVEL), area];
}

const texto = (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Valor de cada coluna ordenável (Q2b); a coluna Ações não ordena. */
export const VALOR_DA_COLUNA = {
  pessoa: (u) => u.nome,
  papel: (u) => u.papel,
  areas: (u) => (u.areas.length ? u.areas.join(", ") : "Geral"),
  situacao: (u) => (u.ativo ? "Ativo" : "Inativo")
};

/** Ordem padrão pelo nome; com uma coluna escolhida, por ela, com empate pelo nome. */
export function ordenarUsuarios(usuarios, ordenacao) {
  const base = [...usuarios].sort((a, b) => texto(a.nome, b.nome));
  if (!ordenacao) return base;
  const valor = VALOR_DA_COLUNA[ordenacao.coluna], sinal = ordenacao.direcao === "desc" ? -1 : 1;
  return base.sort((a, b) => sinal * texto(valor(a), valor(b)) || texto(a.nome, b.nome));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recusa do formulário "Adicionar usuário" (Q3 e Q4), ou null quando pode adicionar. Só antecipa as
 * recusas do backend (DF6), com as mesmas mensagens; conta inexistente e outra organização só ele sabe.
 */
export function recusaDoNovoUsuario(usuarios, nome, email) {
  if (nome.trim() === "") return "Informe o nome da pessoa.";
  if (!EMAIL.test(email.trim())) return "Informe um e-mail válido.";
  if (usuarios.some((u) => u.email === email.trim().toLowerCase())) return "Esta pessoa já está na lista.";
  return null;
}

/** O acesso nasce como Revisor, área Geral (sem área), ativo (Q3). Só no modo local: no compartilhado, vem do backend. */
export const novoUsuario = (nome, email) => {
  const emailNormalizado = email.trim().toLowerCase();
  return { id: "exemplo-" + emailNormalizado, nome: nome.trim(), email: emailNormalizado, papel: "Revisor", areas: [], ativo: true };
};

/** Aprovadores ativos depois de uma mudança: a organização precisa de ao menos um (Q8). */
export const aprovadoresAtivos = (usuarios) => usuarios.filter((u) => u.ativo && u.papel === "Aprovador").length;
