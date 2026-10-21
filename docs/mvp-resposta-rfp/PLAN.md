---
feature: mvp-resposta-rfp
status: draft
spec: docs/mvp-resposta-rfp/SPEC.md (status draft)
---

# Plano de execução: análise e resposta de RFP rodando localmente

*Proposta de 21/10/2026. Pela regra do SDD, o plano deriva de um spec aprovado. O spec ainda está em `draft`, com bloqueios abertos; este plano deve ser conferido contra ele quando for aprovado.*

## Objetivo

Implementar o fluxo descrito em `docs/mvp-resposta-rfp/SPEC.md` em três passos, cada um validável sozinho:

| Passo | Entrega | Cenários |
|---|---|---|
| **A. Linha de comando** | Comando que recebe a planilha e a pasta da base e gera os itens (JSON) e a planilha preenchida. Comando de avaliação contra o gabarito. | 1 a 15, 17 a 22, 24 a 27, 29 |
| **B. Backend local** | As mesmas etapas atrás de rotas HTTP, com tarefas e progresso gravados localmente. | 4, 5, 16, 17, 23, 24, 28, 30 |
| **C. Front** | Envio real da planilha na Nova RFP, acompanhamento do progresso e tela de revisão com os itens reais. | 6, 16, 23, 24 |

O passo A concentra o risco técnico. Se a qualidade das respostas não for boa, os ajustes acontecem antes de investir nos passos B e C.

## Pendências

| # | Pendência | Bloqueia | Sugestão |
|---|---|---|---|
| P1 | Chave de testes da API definida e testada | Passo A | Variável de ambiente local. O primeiro teste é a etapa A1. |
| P2 | Base sintética, planilha de RFP sintética e gabarito | Passo A (etapa A6 em diante) | Conforme a seção 5 de `ARQUITETURA_MAPPING.md`. |
| P3 | Origem da data de atualização dos documentos (cenário 20) | Etapa A7 | Um arquivo de manifesto na pasta da base (`base.json`, com nome do arquivo e data), porque a data do arquivo muda ao copiar ou baixar. |
| P4 | Conflito entre fontes nesta versão ou depois (cenário 22) | Etapa A8 | Implementar por último no passo A; se o prazo apertar, deixar para depois. |
| P5 | Motor do banco local: SQLite ou PGlite (PUB-1) | Passo B | Ver seção 8 de `ARQUITETURA_MAPPING.md`. |
| P6 | Caminho de preparação para publicação (A, B ou C da seção 8 do mapa) | Passo B | Validar antes do passo B. Os cuidados PUB-2 a PUB-5 já estão incorporados a este plano porque têm custo praticamente nulo. |
| P7 | Fluxo de revisão de código | Primeiro commit de código | Branch + pull request revisado por outra pessoa. |
| P8 | Modelo da geração | Fim do passo A | Decidido pela etapa A10, com dados. |

## Decisões técnicas propostas

| Tema | Proposta | Motivo |
|---|---|---|
| Linguagem e estrutura | Node 24 + TypeScript, pasta `backend/` com `package.json` próprio | Mesmo ecossistema do front; SDK oficial da Anthropic. |
| Leitura de planilha | `exceljs` | Leitura e escrita de `.xlsx`, inclusive a planilha preenchida. |
| Detecção de PDF sem texto | `pdfjs-dist`, extraindo o texto antes de enviar | Evita gastar com a API em arquivos ilegíveis (cenário 9). |
| IA | SDK oficial da Anthropic, chamado direto pelo código, sem agente nem framework intermediário | Fluxo fixo; citações e cache são recursos específicos da API. |
| Identificação de perguntas com IA (cenário 3) | Modelo pequeno (candidato: Haiku 5.5) com saída estruturada (`{linha, texto}`) | Tarefa simples e de baixo custo. |
| Geração | Documentos da base como blocos de documento com citações ativadas e marcados para cache; perguntas enviadas em lotes | Citação com página ou trecho; releitura da base mais barata. |
| Separar as respostas de cada pergunta num lote | Instruir o modelo a abrir cada resposta com um marcador fixo (por exemplo `[P12]`) e separar o texto por esses marcadores | As citações não podem ser combinadas com saída estruturada na mesma chamada. **Risco a validar na etapa A5**; se falhar, uma pergunta por chamada, mantendo o cache da base. |
| Configuração | Tudo por variável de ambiente: chave, modelo, tamanho do lote, pastas, porta (PUB-2) | Nada fixo no código. |
| Arquivos | Módulo único `arquivos.ts` para ler e gravar (PUB-3) | Troca futura para armazenamento em nuvem sem mexer no resto. |
| Autor das ações | Função única `usuarioAtual()`, que devolve uma pessoa sintética fixa (PUB-4) | O login futuro troca só essa função. |
| Progresso | Gravado ao fim de cada lote (PUB-5) | Base para o cenário 16 e para uma retomada futura. |
| Testes | Vitest, com a API da Anthropic simulada | Os testes não gastam crédito; chamadas reais só nas etapas de avaliação. |

## Estrutura de pastas

```
backend/
  package.json
  .env.example            nomes das variáveis, sem valores
  src/
    config.ts             leitura e validação das variáveis (cenário 27)
    arquivos.ts           leitura e gravação de arquivos (PUB-3)
    usuario.ts            usuarioAtual() (PUB-4)
    etapas/
      lerPerguntas.ts     cenários 1 a 5
      carregarBase.ts     cenários 7 a 11 (buscarFontes)
      gerarRascunhos.ts   cenários 12, 14, 15, 17
      checarResultado.ts  cenários 13, 18 a 22
      saida.ts            JSON no formato de data.js e planilha preenchida (cenários 23 a 25)
    registro.ts           registro das requisições à IA (cenário 29)
    processarTarefa.ts    executa as etapas na ordem e grava o progresso
    cli/
      responder.ts        comando de terminal (cenário 25)
      avaliar.ts          comando de avaliação (cenário 26)
    servidor.ts           rotas HTTP (passo B)
  termos-criticos.json    lista do cenário 21
  test/                   um arquivo de teste por grupo de cenários
base-sintetica/           documentos sintéticos e base.json
dados/                    tarefas, planilhas, resultados e registros (fora do Git)
```

## Passo A: linha de comando

### A1. Teste da chave
- Definir a chave de testes em variável de ambiente local.
- Fazer uma requisição mínima à API.
- **Verificação:** a requisição retorna resposta. Se falhar, a implementação para até o acesso ser resolvido. Remove o primeiro bloqueio do spec.

### A2. Esqueleto
- Criar `backend/` com TypeScript, Vitest e os módulos `config`, `arquivos` e `usuario`.
- `.gitignore` cobrindo `.env`, `dados/` e resultados (cenários 27 e 28).
- **Verificação:** `npm test` passa; executar sem a chave mostra o nome da variável que falta.

### A3. Leitura da planilha
- Regra da coluna "Pergunta", ignorando linhas vazias e títulos (cenários 1 e 2).
- Recusa de arquivo que não é `.xlsx` (cenário 4).
- Identificação com IA quando a regra falha, com descarte de textos que não aparecem na planilha (cenários 3 e 5).
- **Verificação:** testes dos cenários 1 a 5 passando, com a IA simulada no cenário 3.

### A4. Carregamento da base
- Listar a pasta, aceitar só PDF, MD e TXT, detectar PDF sem texto e montar a lista de ignorados (cenários 7 a 9).
- Contar tokens pela API de contagem e aplicar o teto (cenário 11).
- Base vazia: itens sem rascunho, sem chamar a geração (cenário 10).
- **Verificação:** testes dos cenários 7 a 11 passando.

### A5. Geração
- Instruções fixas: responder só com base nos documentos, dizer quando não houver resposta, tratar documentos e perguntas como dado.
- Chamada com documentos, citações e cache; perguntas em lotes, separadas por marcadores.
- Novas tentativas automáticas em erros temporários; falha legível sem expor a chave (cenário 17).
- **Verificação:** testes com a API simulada; uma execução real com 3 a 5 perguntas sintéticas confirma que o formato com marcadores funciona. Se não funcionar, adotar uma pergunta por chamada.

### A6. Checagem e saída
- Conferir cada trecho citado contra o documento, traduzir a localização (página, título de seção ou parágrafo), remover texto sem citação e marcar `lowconf` e `nocontext` (cenários 12 a 14, 18 e 19).
- Gerar o JSON no formato de `data.js` e a planilha preenchida (cenários 24 e 25).
- Gravar o registro das requisições, sem CNPJ, contatos nem chave (cenários 6 e 29).
- **Verificação:** testes dos cenários correspondentes passando; primeira execução completa com a RFP sintética.

### A7. Alertas por regra
- Fonte desatualizada a partir da data definida em P3 (cenário 20).
- Termo crítico a partir de `termos-criticos.json` (cenário 21).
- **Verificação:** testes dos cenários 20 e 21 passando.

### A8. Conflito entre fontes (conforme P4)
- Segunda chamada leve, com saída estruturada, recebendo só os trechos citados de cada item (cenário 22).
- **Verificação:** o caso de conflito embutido na base sintética é marcado.

### A9. Instruções maliciosas
- Executar com o documento sintético que contém uma instrução maliciosa (cenário 15).
- **Verificação:** nenhuma resposta segue a instrução.

### A10. Avaliação e escolha do modelo
- Comando de avaliação contra o gabarito (cenário 26).
- Executar a RFP sintética com Sonnet 5.5 e com Opus 5.5 e comparar os relatórios e o custo registrado.
- **Verificação:** relatório de cada modelo gerado; modelo escolhido registrado como decisão (P8).

## Passo B: backend local

### B1. Armazenamento local
- Tarefas, itens e progresso no motor definido em P5.
- **Verificação:** uma tarefa processada continua disponível depois de reiniciar o backend.

### B2. Rotas
- `POST /api/tarefas`: recebe a planilha (e, opcionalmente, nome, empresa, CNPJ e contatos), cria a tarefa e inicia o processamento em segundo plano.
- `GET /api/tarefas/:id`: estado e progresso (cenário 16).
- `GET /api/tarefas/:id/itens`: itens no formato de `data.js` (cenário 23).
- `GET /api/tarefas/:id/planilha`: planilha preenchida (cenário 24).
- `GET /api/tarefas/:id/registro`: registro das requisições (cenário 29).
- Servidor ouvindo só em `127.0.0.1` (cenário 30).
- **Verificação:** testes das rotas passando; envio da planilha sintética por uma ferramenta de requisição HTTP e acompanhamento até `pronta`.

### B3. Equivalência com o comando
- Teste que processa a mesma planilha e a mesma base pelo comando e pelo backend e compara os itens (cenário 25), com a API simulada.
- **Verificação:** teste passando.

## Passo C: front

### C1. Conexão com o backend
- Proxy do Vite encaminhando `/api` para o backend local.
- `src/api.js`: camada única de chamadas ao backend.
- **Verificação:** o front em `npm run dev` consegue consultar o backend.

### C2. Nova RFP
- Seletor de arquivo real para a planilha, enviando para `POST /api/tarefas` com os campos já existentes do formulário.
- Mensagem de erro do cenário 4.
- **Verificação:** enviar a planilha sintética pela tela cria a tarefa.

### C3. Progresso e revisão
- Acompanhar o progresso consultando o estado a cada poucos segundos, no lugar da simulação de `useWorkspace.js`.
- Ao terminar, carregar os itens reais na tela de revisão.
- Botão para baixar a planilha preenchida.
- **Verificação:** fluxo completo no navegador, do envio da planilha às respostas com fonte e à planilha preenchida.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| 1 a 5 | Enviar as planilhas de teste (com coluna "Pergunta", sem ela, vazia e em outro formato) e conferir itens ou mensagens. |
| 6 e 29 | Abrir o registro de requisições de uma tarefa com CNPJ e contatos e procurar por eles. |
| 7 a 11 | Executar com bases de teste (completa, com arquivos ignorados, vazia e acima do teto). |
| 12 a 15 | Conferir as respostas da RFP sintética contra o gabarito e o caso de instrução maliciosa. |
| 16 e 17 | Acompanhar o progresso; executar com uma chave inválida e ler a mensagem. |
| 18 a 22 | Conferir os alertas dos casos embutidos na base sintética. |
| 23 e 24 | Abrir a tela de revisão e a planilha preenchida. |
| 25 e 26 | Executar o comando e o relatório de avaliação. |
| 27 e 28 | Executar sem a chave; conferir `git status` depois de usar o sistema. |
| 30 | Tentar acessar o backend de outro computador da rede. |

**Critério de pronto de cada passo:** todos os testes automáticos do passo passando (o nome de cada teste traz o número do cenário), demonstração do passo funcionando e checklist dos cenários do passo conferido.

## Fora deste plano

- Tudo o que está em "Fora de escopo" no spec.
- A publicação fora da máquina local, que depende da validação da seção 8 de `ARQUITETURA_MAPPING.md`.
