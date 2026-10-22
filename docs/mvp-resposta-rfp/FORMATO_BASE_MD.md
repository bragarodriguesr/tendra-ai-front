# Formato dos arquivos `.md` da base de conhecimento

*Definido em 21/10/2026; revisado em 22/10/2026 para a carga pela tela. Status: `draft`. Complementa a seção 20 do `PRD_Front-end_Tendra.ai_MVP_v3.md` e o quadro 1 de `docs/mvp-resposta-rfp/PIPELINE_IA_MVP.md`.*

No MVP, a base de conhecimento entra no banco a partir de arquivos `.md` escritos pela equipe. A pessoa sobe os arquivos pela tela **Base de conhecimento** (botão "Subir documentos", que abre o seletor de arquivos do computador). O comando `carregar-base` faz a mesma carga a partir de uma pasta, para quem prefere o terminal. Este documento define o cabeçalho obrigatório desses arquivos, o que a carga valida e como o arquivo vira fonte citável.

## 1. Cabeçalho

O arquivo começa, na linha 1, com um bloco YAML entre duas linhas `---`:

```markdown
---
titulo: Política de Segurança da Informação
tipo: documento
atualizado_em: 2026-08-14
versao: "3.2"
---

# Política de Segurança da Informação

## 4. Registro de acessos

### 4.2 Retenção de logs

Os logs de acesso são mantidos por 12 meses em armazenamento imutável...
```

| Campo | Obrigatório | Regra | Uso no produto |
|---|---|---|---|
| `titulo` | Sim | Texto de 3 a 120 caracteres | Nome do documento na tela da Base e na fonte citada |
| `tipo` | Sim | `documento` ou `rfp-passada` | Coluna Tipo da T2 ("Documento" ou "RFP passada") e selo "Histórico importado" |
| `atualizado_em` | Sim | Data `AAAA-MM-DD`, não pode ser futura | Idade em dias e alerta de mais de 120 dias |
| `versao` | Não | Texto de até 20 caracteres; número é aceito e convertido para texto | Coluna Versão da T2 (sem o campo, aparece "Sem versão") |

Entre as duas linhas `---` só entram esses quatro campos. Qualquer outro campo gera um aviso e é ignorado (seção 4), o que deixa espaço para evoluções futuras, como a classificação por disciplina (F-07 do PRD), sem quebrar arquivos existentes.

## 2. Decisões que definem o formato

| # | Decisão | Motivo |
|---|---|---|
| 1 | `atualizado_em` é **obrigatório**, sem data padrão tirada do arquivo | A data de modificação do arquivo muda a cada cópia ou `git clone` e não mede a atualidade do conteúdo. Sem a data, o alerta de fonte antiga não seria confiável. |
| 2 | `atualizado_em` é a data em que o conteúdo foi **conferido**, não a da última edição | Corrigir uma vírgula não renova a data. Isso evita que a data seja usada só para calar o alerta de 120 dias. |
| 3 | A **identidade** do documento é o **nome do arquivo**, sem as pastas (por exemplo `seguranca.md`). *Revisada em 22/10/2026: antes era o caminho relativo à pasta.* | O seletor de arquivos do navegador entrega só o nome, sem a pasta; com o nome como identidade, a tela e o comando chegam ao mesmo documento. Enviar de novo o mesmo nome substitui a versão anterior. Renomear o arquivo cria um documento novo. Por isso cada documento da base precisa de um nome único: dois arquivos com o mesmo nome na mesma carga são recusados. |
| 4 | **Campos desconhecidos** geram aviso, não erro | Mantém compatibilidade com campos que entrarem depois. O aviso ainda mostra erros de digitação, como `atualizado_ em`. |
| 5 | O estado **ativo ou inativo** não entra no cabeçalho | Ele vive só no banco e na chave Ativar/Desativar da T2, para não haver duas fontes da verdade. Recarregar um arquivo não muda esse estado. |
| 6 | Quem carregou **não entra** no cabeçalho | Vem da pessoa que está usando a tela (ou da opção `--enviado-por` do comando) e alimenta a coluna "Enviado por" da T2. |

## 3. Corpo do arquivo e fonte citada

- **Codificação:** UTF-8 (a marca BOM é tolerada).
- **Seções:** os títulos (`#`, `##`, `###`) definem a hierarquia de seções. Texto antes do primeiro título pertence à seção "(início)".
- **Blocos:** a carga divide o texto por seção e parágrafo, lista ou tabela. Cada bloco guarda o nome do arquivo, a seção e a linha em que começa.
- **Número da linha:** conta desde a **primeira linha do arquivo, cabeçalho incluído**, para que quem abre o arquivo encontre a linha citada sem conversão.
- **Fonte citada:** aparece como `arquivo · seção · linha`, por exemplo `seguranca.md · 4.2 Retenção de logs · linha 87`. O nome exibido na tela é o `titulo`.
- O cabeçalho em si não é citável.
- **RFP passada:** o corpo é livre. Recomenda-se um título por pergunta e a resposta logo abaixo, para a citação cair na pergunta certa, mas isso não é validado.

## 4. Validação

A carga valida cada arquivo e, quando recusa um, segue com os demais. A tela mostra o motivo de cada recusa no quadro "Resultado do envio"; o comando imprime o mesmo motivo.

| Situação | Resultado | Mensagem (exemplo) |
|---|---|---|
| Arquivo não começa com `---` na linha 1, ou o bloco não é fechado | Recusado | `seguranca.md: cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1.` |
| YAML inválido ou chave repetida | Recusado | `seguranca.md: cabeçalho ilegível (linha 3).` |
| Campo obrigatório ausente | Recusado | `seguranca.md: campo atualizado_em ausente. Use AAAA-MM-DD.` |
| `titulo` fora de 3 a 120 caracteres | Recusado | `seguranca.md: titulo deve ter de 3 a 120 caracteres.` |
| `tipo` diferente de `documento` e `rfp-passada` | Recusado | `seguranca.md: tipo inválido "politica". Use documento ou rfp-passada.` |
| `atualizado_em` fora do formato `AAAA-MM-DD` ou data inexistente | Recusado | `seguranca.md: atualizado_em "14/08/2026" inválido. Use AAAA-MM-DD.` |
| `atualizado_em` no futuro | Recusado | `seguranca.md: atualizado_em está no futuro.` |
| `versao` com mais de 20 caracteres | Recusado | `seguranca.md: versao deve ter até 20 caracteres.` |
| Corpo vazio depois do cabeçalho | Recusado | `seguranca.md: o arquivo não tem conteúdo.` |
| Arquivo fora de UTF-8 | Recusado | `seguranca.md: o arquivo precisa estar em UTF-8.` |
| Dois arquivos com o mesmo nome na mesma carga (em pastas diferentes) | Os dois recusados | `seguranca.md: há mais de um arquivo com este nome nesta carga (a/seguranca.md, b/seguranca.md). Cada documento da base precisa de um nome único.` |
| Arquivo que não termina em `.md` | Ignorado | `planilha.xlsx: formato não aceito nesta versão` |
| Campo que não existe na lista | Carregado, com aviso | `seguranca.md: campo "atualizado_ em" ignorado.` |

## 5. Resumo da carga

Ao terminar, a tela mostra o quadro "Resultado do envio" e o comando imprime um resumo, ambos com:

- **Carregados:** documentos novos.
- **Atualizados:** o nome já existia e o conteúdo mudou (comparação por hash do conteúdo).
- **Sem mudança:** o hash é igual ao do banco, e o arquivo é ignorado.
- **Recusados:** com o motivo de cada um.
- **Ignorados:** arquivos que não são `.md`.
- **Avisos:** campos ignorados.
- **Órfãos (só no comando):** documentos que estão no banco e não têm arquivo de mesmo nome na pasta. Na tela não há órfãos, porque a pessoa envia só os arquivos que escolheu. Nada é apagado; quem desativa um documento é a pessoa, pela tela.

O comando termina com código de saída diferente de zero se algum arquivo for recusado, para o resultado poder ser verificado em automação.

## 6. Cenários de teste

| # | Dado | Quando | Então |
|---|---|---|---|
| 1 | Arquivo com os quatro campos válidos | Rodar a carga | O documento é gravado com título, tipo, data, versão e blocos com localização |
| 2 | Arquivo sem `versao` | Rodar a carga | O documento é gravado e a tela mostra "Sem versão" |
| 3 | `versao: 3.2` sem aspas | Rodar a carga | A versão é gravada como o texto `3.2` |
| 4 | Arquivo já carregado e sem mudança | Rodar a carga de novo | O arquivo aparece em "Sem mudança" e nada é regravado |
| 5 | Arquivo já carregado, com o texto alterado | Rodar a carga de novo | A versão anterior é substituída, o estado ativo ou inativo é mantido e o arquivo aparece em "Atualizados" |
| 6 | Arquivo sem cabeçalho | Rodar a carga | O arquivo é recusado com o motivo e os demais são carregados |
| 7 | Arquivo sem `atualizado_em` | Rodar a carga | O arquivo é recusado, mesmo que a data de modificação seja recente |
| 8 | `atualizado_em: 14/08/2026` | Rodar a carga | O arquivo é recusado com a orientação de usar `AAAA-MM-DD` |
| 9 | `atualizado_em` no futuro | Rodar a carga | O arquivo é recusado |
| 10 | `tipo: politica` | Rodar a carga | O arquivo é recusado com a lista de valores aceitos |
| 11 | Cabeçalho válido e corpo vazio | Rodar a carga | O arquivo é recusado |
| 12 | Cabeçalho com um campo desconhecido | Rodar a carga | O arquivo é carregado e o resumo traz um aviso |
| 13 | Arquivo renomeado | Rodar a carga | O novo nome entra como documento novo; o antigo continua na base e, no comando, aparece em "Órfãos", sem ser apagado |
| 14 | Título na linha 10 do arquivo | Gerar uma resposta que cita esse trecho | A fonte indica a linha 10, contando o cabeçalho |
| 15 | Documento com `atualizado_em` de 121 dias atrás | Abrir a T2 | A idade aparece com o selo "Mais de 120 dias" |
| 16 | Pasta com um arquivo inválido e dois válidos | Rodar a carga | Os dois válidos são carregados, o inválido é recusado e o código de saída é diferente de zero |
| 17 | Dois arquivos com o mesmo nome em subpastas diferentes | Rodar o comando sobre a pasta | Os dois são recusados, com os caminhos no motivo; o documento já gravado com esse nome não muda |
| 18 | Documento carregado pelo comando | Subir pela tela um arquivo com o mesmo nome e o texto alterado | O documento aparece em "Atualizados" e não é duplicado |
| 19 | Seis arquivos escolhidos na tela: três válidos, um com data futura, um com campo desconhecido e um `.txt` | Subir documentos | O quadro "Resultado do envio" mostra 4 carregados, 1 recusado com o motivo, 1 ignorado e 1 aviso; a lista mostra os 4 documentos |
| 20 | Servidor da base desligado | Abrir a T2 e subir documentos | A tela avisa que o servidor está desconectado e mostra a lista de exemplo; o envio falha com a orientação de iniciar o servidor |

## 7. Fora deste documento

- **Carga pela tela:** na T2, "Subir documentos" e "Importar RFP passada" abrem o seletor de arquivos do computador, que aceita vários `.md` de uma vez (o tipo vem do cabeçalho, não do botão). Os arquivos vão para a rota `POST /api/base/documentos` do servidor local (`npm run servidor`, na pasta `backend/`, ouvindo só em 127.0.0.1), que usa a mesma carga do comando. Limite de 10 MB e 100 arquivos por envio. A chave Ativar/Desativar usa `PATCH /api/base/documentos/:id`.
- **Interface do comando:** definida na etapa A4 como `npm run carregar-base -- <pasta> [--enviado-por <nome>]`, executado na pasta `backend/`. A pasta é lida com as subpastas; arquivos e pastas cujo nome começa com ponto são ignorados. O banco fica em `dados/banco`, fora do controle de versão, e nem a tela nem o comando usam a chave da API.
- **Um processo por vez no banco:** o banco local (PGlite) não aceita dois processos na mesma pasta. Enquanto o servidor está aberto, o comando recusa a carga com a mensagem "O banco de dados está em uso por outro processo"; basta encerrar o servidor (Ctrl+C) ou usar a tela.
- **Tamanho máximo de um bloco** e regras para tabelas longas: a definir junto com a avaliação das citações.
- **Conversão de outros formatos para `.md`:** fica por conta de quem escreve o arquivo no MVP; conversão automática volta na Fase 2.
