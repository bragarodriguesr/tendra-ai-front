# Formato dos arquivos `.md` da base de conhecimento

*Definido em 21/10/2026. Status: `draft`. Complementa a seção 20 do `PRD_Front-end_Tendra.ai_MVP_v3.md` e o quadro 1 de `docs/mvp-resposta-rfp/PIPELINE_IA_MVP.md`.*

No MVP, a base de conhecimento entra no banco por um comando de carga, a partir de arquivos `.md` escritos pela equipe. Este documento define o cabeçalho obrigatório desses arquivos, o que o comando valida e como o arquivo vira fonte citável.

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
| 3 | A **identidade** do documento é o caminho relativo à pasta da base (por exemplo `politicas/seguranca.md`) | É a opção mais simples e não exige um campo a mais para manter. Recarregar o mesmo caminho substitui a versão anterior. Renomear o arquivo cria um documento novo. |
| 4 | **Campos desconhecidos** geram aviso, não erro | Mantém compatibilidade com campos que entrarem depois. O aviso ainda mostra erros de digitação, como `atualizado_ em`. |
| 5 | O estado **ativo ou inativo** não entra no cabeçalho | Ele vive só no banco e na chave Ativar/Desativar da T2, para não haver duas fontes da verdade. Recarregar um arquivo não muda esse estado. |
| 6 | Quem carregou **não entra** no cabeçalho | Vem de uma opção do comando de carga, e alimenta a coluna "Enviado por" da T2. |

## 3. Corpo do arquivo e fonte citada

- **Codificação:** UTF-8 (a marca BOM é tolerada).
- **Seções:** os títulos (`#`, `##`, `###`) definem a hierarquia de seções. Texto antes do primeiro título pertence à seção "(início)".
- **Blocos:** o comando divide o texto por seção e parágrafo, lista ou tabela. Cada bloco guarda o caminho do arquivo, a seção e a linha em que começa.
- **Número da linha:** conta desde a **primeira linha do arquivo, cabeçalho incluído**, para que quem abre o arquivo encontre a linha citada sem conversão.
- **Fonte citada:** aparece como `caminho · seção · linha`, por exemplo `politicas/seguranca.md · 4.2 Retenção de logs · linha 87`. O nome exibido na tela é o `titulo`.
- O cabeçalho em si não é citável.
- **RFP passada:** o corpo é livre. Recomenda-se um título por pergunta e a resposta logo abaixo, para a citação cair na pergunta certa, mas isso não é validado.

## 4. Validação

O comando valida cada arquivo e, quando recusa um, segue com os demais.

| Situação | Resultado | Mensagem (exemplo) |
|---|---|---|
| Arquivo não começa com `---` na linha 1, ou o bloco não é fechado | Recusado | `politicas/seguranca.md: cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1.` |
| YAML inválido ou chave repetida | Recusado | `politicas/seguranca.md: cabeçalho ilegível (linha 3).` |
| Campo obrigatório ausente | Recusado | `politicas/seguranca.md: campo atualizado_em ausente. Use AAAA-MM-DD.` |
| `titulo` fora de 3 a 120 caracteres | Recusado | `politicas/seguranca.md: titulo deve ter de 3 a 120 caracteres.` |
| `tipo` diferente de `documento` e `rfp-passada` | Recusado | `politicas/seguranca.md: tipo inválido "politica". Use documento ou rfp-passada.` |
| `atualizado_em` fora do formato `AAAA-MM-DD` ou data inexistente | Recusado | `politicas/seguranca.md: atualizado_em "14/08/2026" inválido. Use AAAA-MM-DD.` |
| `atualizado_em` no futuro | Recusado | `politicas/seguranca.md: atualizado_em está no futuro.` |
| `versao` com mais de 20 caracteres | Recusado | `politicas/seguranca.md: versao deve ter até 20 caracteres.` |
| Corpo vazio depois do cabeçalho | Recusado | `politicas/seguranca.md: o arquivo não tem conteúdo.` |
| Arquivo fora de UTF-8 | Recusado | `politicas/seguranca.md: o arquivo precisa estar em UTF-8.` |
| Campo que não existe na lista | Carregado, com aviso | `politicas/seguranca.md: campo "atualizado_ em" ignorado.` |

## 5. Resumo do comando de carga

Ao terminar, o comando imprime um resumo com:

- **Carregados:** documentos novos.
- **Atualizados:** o caminho já existia e o conteúdo mudou (comparação por hash do conteúdo).
- **Sem mudança:** o hash é igual ao do banco, e o arquivo é ignorado.
- **Recusados:** com o motivo de cada um.
- **Avisos:** campos ignorados.
- **Órfãos:** documentos que estão no banco e não têm mais arquivo na pasta. O comando não apaga nada; quem desativa um documento é a pessoa, pela tela.

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
| 13 | Arquivo renomeado | Rodar a carga | O novo caminho entra como documento novo e o antigo aparece em "Órfãos", sem ser apagado |
| 14 | Título na linha 10 do arquivo | Gerar uma resposta que cita esse trecho | A fonte indica a linha 10, contando o cabeçalho |
| 15 | Documento com `atualizado_em` de 121 dias atrás | Abrir a T2 | A idade aparece com o selo "Mais de 120 dias" |
| 16 | Pasta com um arquivo inválido e dois válidos | Rodar a carga | Os dois válidos são carregados, o inválido é recusado e o código de saída é diferente de zero |

## 7. Fora deste documento

- **Interface do comando** (nome, opções como a pasta da base e `--enviado-por`): ainda por definir.
- **Tamanho máximo de um bloco** e regras para tabelas longas: a definir junto com a avaliação das citações.
- **Conversão de outros formatos para `.md`:** fica por conta de quem escreve o arquivo no MVP; conversão automática volta na Fase 2.
