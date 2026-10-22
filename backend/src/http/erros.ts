/** Erro de um pedido HTTP com o código de resposta e a mensagem legível que o front mostra. */
export class ErroDaRota extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.statusCode = statusCode;
  }
}
