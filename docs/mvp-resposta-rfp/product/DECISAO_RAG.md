---
decisao: recuperacao-de-contexto-rag
status: proposta
data: 28/10/2026
constitution: 1.0.0
---

# Decisão: recuperação de contexto (RAG) na geração das respostas

## Resumo

No MVP, a Tendra **não usa um pipeline de RAG clássico** (embeddings, banco vetorial e busca por pergunta). A geração recebe **a base inteira** de documentos ativos e não vencidos da organização, com citações ativadas, e o próprio modelo localiza e cita os trechos. A busca antes da geração só entra quando algum dos **gatilhos de medição** da seção 5 for atingido, e dentro do módulo de recuperação que já existe, sem mudar a geração, a checagem nem a revisão.

## 1. Contexto

### 1.1 Como a Tendra funciona hoje

A abordagem atual é **contexto longo com citações**:

| Etapa | O que acontece | Onde está |
|---|---|---|
| Carga | Cada `.md` é dividido em **blocos** (parágrafo, lista, tabela ou código), com seção, caminho de títulos e linhas. Os blocos ficam no Postgres (tabelas `documentos` e `blocos`). | `backend/src/base/blocos.ts`, `backend/src/base/carga.ts` |
| Seleção | **Regra fixa, sem busca:** todos os documentos ativos e não vencidos da organização da tarefa. A mesma seleção vale para todas as perguntas da RFP. | `backend/src/recuperacao/buscarFontes.ts` |
| Teto | Acima de 25 MB ou 400 mil tokens, a tarefa falha inteira, sem usar só parte da base (cenário 11). | idem |
| Geração | As perguntas são divididas em lotes (padrão 10). Cada lote é uma requisição com as instruções, **a base inteira** e as perguntas do lote, marcadas como `[P1]` a `[P10]`. A base é marcada para cache: da segunda requisição em diante, a releitura custa cerca de 10% do preço. | `backend/src/geracao/gerarRespostas.ts` |
| Separação | O modelo devolve um texto com as respostas, cada uma começando pelo seu marcador. O código separa as respostas pelos marcadores, porque a API não combina citações com saída estruturada. | `backend/src/geracao/separarRespostas.ts` |
| Checagem | O código confere cada citação contra o bloco, remove texto sem fonte válida e calcula os alertas. Uma segunda chamada aponta conflitos entre fontes. | `backend/src/rastreabilidade/`, `backend/src/regras/`, `backend/src/geracao/conflitos.ts` |

**Os blocos já são um chunking, mas com outra função:** são a **unidade de citação** (`seção · linha N`), não a unidade de busca.

**O nome `buscarFontes` não indica uma busca no sentido do RAG.** A função aplica regras (organização, ativo, não vencido, teto) e devolve todos os blocos que passam. O nome foi escolhido para que uma busca real possa entrar ali depois.

### 1.2 O que é um RAG clássico

```
CARGA (uma vez por documento)
  documento → trechos → embedding de cada trecho → banco vetorial

A CADA PERGUNTA
  1. pergunta → embedding (o mesmo modelo da carga) → um vetor
  2. BUSCA: o banco devolve os k trechos cujos vetores estão mais próximos (vizinhos mais próximos)
  3. GERAÇÃO: o modelo recebe a pergunta e só esses trechos, e escreve a resposta
```

- Um **embedding** é uma lista de números (por exemplo, 1.024) que representa o significado de um texto. Textos de significado parecido ficam próximos, mesmo com outras palavras ou em outro idioma. A proximidade é medida, em geral, pela similaridade de cosseno.
- **Quem decide o que o modelo lê é a busca, não o modelo.** Se a busca não trouxer o trecho certo, o modelo não sabe que ele existe.
- **O banco vetorial devolve trechos, não respostas.** A resposta é escrita pelo modelo de linguagem a partir dos trechos.
- **É a base que é dividida, não a pergunta.** A pergunta vira um único vetor. Dividir uma pergunta composta em sub-perguntas é uma técnica avançada e opcional.

### 1.3 Comparação

| | RAG clássico | Tendra no MVP |
|---|---|---|
| Quem escolhe o que o modelo lê | A busca, por semelhança com a pergunta | Uma regra fixa: toda a base ativa da organização |
| Quando a escolha acontece | Antes da geração, a cada pergunta | Antes da tarefa, igual para todas as perguntas |
| O que o modelo lê | 5 a 10 trechos por pergunta | A base inteira, em cada lote |
| Como os trechos são encontrados | Cálculo de semelhança entre vetores | O modelo lê e relaciona o texto |
| Para que servem os blocos | Para buscar | Para citar |
| Banco vetorial e embeddings | Necessários | Não usados |
| Limite de tamanho da base | Praticamente nenhum | O que cabe numa requisição (teto de 400 mil tokens) |
| Aproveitamento de cache | Baixo: o contexto muda a cada pergunta ou lote | Alto: o contexto é o mesmo em todos os lotes |

## 2. Decisão

1. **No MVP, manter o contexto longo com citações**, sem embeddings, sem banco vetorial e sem busca antes da geração.
2. **Medir desde já** o tamanho da base de cada organização (bytes e tokens), o custo e o tempo por tarefa, e a relevância na avaliação contra o gabarito.
3. **Introduzir a busca antes da geração só quando um gatilho da seção 5 for atingido**, sempre dentro de `buscarFontes`, e com avaliação aprovada antes de integrar (constitution, princípio IV).

## 3. Motivos

- **Não há perda de evidência por erro de busca.** Quando uma resposta sai errada, o problema está na base ou na geração, nunca em "a busca não achou". No MVP, isso separa as causas de erro e torna a avaliação mais confiável.
- **Conflitos entre fontes aparecem.** As duas fontes contraditórias estão no contexto. Com busca, uma delas pode não ser recuperada, e o alerta de conflito (cenário 22) deixaria de funcionar.
- **Perguntas em outro idioma funcionam sem esforço extra.** RFPs em inglês com base em português são respondidas porque o modelo lê tudo. Uma busca só por palavras falharia entre idiomas.
- **As bases do MVP são pequenas:** documentos sintéticos de uma empresa por organização, muito abaixo do teto.
- **Menos complexidade (constitution, princípio I):** sem indexação, sem sincronização do índice ao recarregar a base e sem mais um fornecedor de dados.

## 4. Alternativas consideradas

| Alternativa | Por que não agora |
|---|---|
| **RAG com embeddings e pgvector** | Acrescenta um fornecedor de embeddings (a Anthropic não oferece; a recomendação dela é a Voyage AI), indexação e risco de perda de evidência, sem necessidade com bases pequenas. É o caminho quando os gatilhos dispararem (seção 6). |
| **Busca só por palavras (texto completo no Postgres)** | Mais simples que vetores e sem fornecedor novo, mas falha com perguntas em outro idioma e com sinônimos. Útil como parte de uma busca híbrida, não sozinha. |
| **Enviar os arquivos originais (por exemplo, PDF) direto ao modelo** | Cada página de PDF é processada como texto e como imagem, o que custa mais a cada tarefa. Para uma base reutilizada em muitas tarefas, converter para texto uma vez na carga é mais barato. |

## 5. Gatilhos para introduzir a busca antes da geração

| Gatilho | Por quê |
|---|---|
| A base ativa de uma organização passa de **60% do teto** (cerca de 240 mil tokens) | Antecipar a troca antes que as tarefas falhem no teto |
| O **custo ou o tempo por tarefa** passa de um limite a definir | Cada lote relê a base inteira; mesmo com cache, uma RFP de 200 perguntas faz 20 releituras |
| A **relevância** fica abaixo de 80% na avaliação | Contexto muito grande dilui a atenção do modelo |
| Respostas aprovadas passam a ser reaproveitadas como fonte | O histórico de respostas cresce mais rápido que a base de documentos |

`[DECISÃO PENDENTE: limites de custo e de tempo por tarefa que disparam o gatilho.]`

## 6. Caminho de evolução, em ordem de custo-benefício

1. **Medir.** Tamanho da base por organização, custo e tempo por tarefa. As métricas por tarefa já existem (cenário 37); falta acompanhar a base.
2. **Melhorar os blocos para busca,** mantendo-os como unidade de citação:
   - limitar o tamanho de blocos longos, como tabelas e parágrafos extensos (o `FORMATO_BASE_MD.md` deixa esse limite "a definir");
   - prefixar cada bloco com o título do documento e o caminho de seções antes de calcular o embedding ("recuperação contextual");
   - buscar o bloco e enviar ao modelo a seção inteira em que ele está ("recuperar o pedaço, enviar o pai").
3. **Busca híbrida no Postgres:** busca por palavras (texto completo, em português) combinada com embeddings no pgvector, que o Supabase oferece no mesmo banco. A parte por palavras pega termos exatos como "ISO 27001" e números de cláusula; a parte vetorial pega sinônimos e outros idiomas.
4. **Reordenação** dos trechos encontrados por um modelo pequeno, para enviar à geração só os mais relevantes de cada pergunta.
5. **Biblioteca de respostas aprovadas** como fonte adicional, com quem aprovou, quando e validade. É a camada de maior valor de produto e está fora do escopo do MVP.

### 6.1 Geração em lotes com busca

Com RAG, a busca é por pergunta, mas a geração pode continuar em lotes. A forma de montar a requisição passa a importar:

| Forma | Vantagem | Desvantagem |
|---|---|---|
| Uma pergunta por chamada | Contexto mínimo e focado | Muitas chamadas e pouco aproveitamento de cache |
| Lote com a união dos trechos das perguntas | Menos chamadas | Contexto maior; risco de usar o trecho de uma pergunta para responder outra |
| Lote por assunto (perguntas que recuperam trechos parecidos) | Contextos menores e coerentes, mais cache | Mais lógica para agrupar |

A escolha é decidida com avaliação contra o gabarito quando a busca for implementada.

## 7. O que não depende desta decisão

### 7.1 Novos formatos de arquivo na base

Aceitar PDF, DOCX, XLSX ou PPTX é um problema de **ingestão**, não de RAG: extrair o texto e dividi-lo em blocos com uma localização citável (`p. N` para PDF, `aba · linha N` para planilha, `slide N` para apresentação). Depois da conversão, a geração, as citações e a checagem não mudam.

Os formatos novos afetam custo e tempo **indiretamente**, porque fazem a base crescer e podem atingir os gatilhos da seção 5 mais cedo. Recomendação: especificar primeiro só a ingestão e medir a base resultante.

### 7.2 Mostrar o documento completo como referência

Mostrar à pessoa o documento inteiro, aberto na linha citada, é uma funcionalidade de **tela e de armazenamento**, separada do RAG. **Um vetor não permite reconstruir o texto**: o embedding representa o significado, não guarda o conteúdo. Por isso o armazenamento tem três camadas:

```
Arquivo original (disco ou Storage)  ◄──  Texto em blocos (Postgres)  ◄──  Índice vetorial (futuro)
o arquivo como foi enviado               documento, seção, linhas e        vetor + identificador do bloco;
                                         texto exato: fonte da verdade     serve só para buscar e pode ser
                                         da citação                        recalculado a partir dos blocos
```

As duas primeiras camadas já existem. A citação aponta sempre para o bloco, nunca para o vetor. Isso mantém a evidência verificável (constitution, princípio VII), com ou sem RAG.

## 8. Formas de reduzir custo e tempo sem RAG

1. **Lotes maiores** (`TENDRA_TAMANHO_LOTE`, padrão 10, máximo 50): menos releituras da base, a validar na avaliação.
2. **Cache de prompt,** já em uso.
3. **Processamento assíncrono em lote da API,** com 50% de desconto e resposta em até 24 horas, para RFPs com prazo folgado.
4. **Filtro por metadados antes da geração,** por regra e sem vetores: por exemplo, por tipo de documento ou por disciplina (F-07 do PRD). **Decidido na fase U (12/11/2026, `spec/SPEC_FASE_U.md`):** os documentos recebem áreas na carga (Haiku 5.5, as mesmas áreas das perguntas da fase N), e, com a base acima de 50 mil tokens, cada pergunta recebe só os documentos da sua área mais os "Geral", com a base inteira como segunda tentativa antes de "Sem rascunho". A regra fica em `selecionarContexto`, sem vetores.
5. **Base limpa:** desativar documentos repetidos ou vencidos. A validade dos documentos (cenário 80) já ajuda.

## 9. Cuidados quando a busca for introduzida

| Cuidado | Princípio da constitution |
|---|---|
| Toda busca filtra pela organização da tarefa, com teste de isolamento, como os cenários 70 e 71 já exigem para a base | VI |
| Mudança na recuperação é mudança de comportamento da IA: só integra com avaliação aprovada, olhando principalmente relevância e conflito | IV |
| O provedor de embeddings recebe o conteúdo da base: entra no estudo de política de dados e na lista de subprocessadores | VI |
| A citação continua apontando para o bloco no Postgres, e a checagem literal continua valendo | VII |
| Falha da busca ou do provedor de embeddings leva a tarefa a estado de falha, nunca a respostas geradas com contexto incompleto | VIII |
| Registro das buscas (pergunta, trechos devolvidos, similaridade) sem conteúdo confidencial | IX |

## 10. Próximos passos

1. Aprovar esta decisão.
2. Especificar a medição da base por organização (passo 1 da seção 6) e definir os limites de custo e de tempo do gatilho.
3. Registrar no `ARQUITETURA.md` a referência a esta decisão.
