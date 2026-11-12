---
feature: selecao-da-base-por-area
status: approved
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_U.md (status approved)
constitution: 1.0.0
---

# Plano: seleção da base por área

*Plano de 12/11/2026, sobre a spec aprovada no mesmo dia (PU1 a PU13).*

## Objetivo

Implementar os cenários U1 a U17:
- áreas nos documentos, atribuídas pelo Haiku 5.5 depois da carga, em segundo plano;
- coluna "Áreas" na tela da Base;
- seleção do contexto por área no processamento, com segunda tentativa na base inteira antes de "Sem rascunho";
- rastreio do contexto por item, só no banco e nas métricas (PU10).

A instrução de geração (`geracao-v3`) e a checagem das citações não mudam.

## Como o estado da classificação fica no banco

| `documentos.areas` | `areas_classificadas_em` | Significa | Na tela | Na seleção |
|---|---|---|---|---|
| `{}` | nula | Pendente: a IA ainda não classificou | "Classificando…" | "Geral" |
| `{Geral}` | nula | A classificação falhou (PU4) e será tentada de novo na próxima subida | "Geral" | "Geral" |
| `{Geral}` | preenchida | A IA escolheu "Geral", ou é uma RFP passada (U5b) | "Geral" | "Geral" |
| `{Tecnologia, Comercial}` | preenchida | Classificado | "Tecnologia, Comercial" | Essas áreas |

Assim, "Classificando…" nunca fica preso depois de uma falha, e a nova tentativa ao iniciar usa só `areas_classificadas_em IS NULL`.

## Pontos do código afetados

| Arquivo | O que muda | Cenários |
|---|---|---|
| `backend/migracoes/014_areas_dos_documentos.sql` (novo) | `documentos.areas text[] NOT NULL DEFAULT '{}'` e `documentos.areas_classificadas_em timestamptz`. As RFPs passadas já gravadas ficam `{Geral}` e marcadas. `itens.contexto text NOT NULL DEFAULT 'base'`, com `CHECK (contexto IN ('area', 'base', 'base_segunda_tentativa'))` | U5b, U6, PU10 |
| `backend/src/persistencia/documentos.ts` | `DocumentoGravado` com `areas` e `areasClassificadasEm`. Ao gravar um conteúdo novo, as áreas voltam a `{}` (ou `{Geral}` marcado, na RFP passada). `gravarAreas(banco, id, hash, areas, classificado)` só grava se o hash ainda é o mesmo, para uma classificação antiga não sobrescrever um reenvio. `listarDocumentosSemClassificacao` | U1, U3, U5 |
| `backend/src/ia/instrucoes/classificacao-documento-v1.md` (novo), `instrucoes.ts`, `cliente.ts` | Instrução nova, versão em `VERSOES_DAS_INSTRUCOES` e a etapa `classificacao-documento` no registro | U1, U4 |
| `backend/src/base/classificarDocumento.ts` (novo) | Monta a entrada (título, tipo, títulos das seções e o início do texto até 4 mil tokens estimados, PU3). Saída estruturada `{areas}`, limitada às áreas de PU1 e "Geral". Sem repetição, e "Geral" sai quando vem junto com outra área (U2). Lista vazia, erro da IA ou resposta ilegível dão falha | U1 a U4 |
| `backend/src/fluxo/classificarDocumentos.ts` (novo) | `classificarDocumentosPendentes({ banco, api, modelo, organizacaoId? })`: classifica os documentos sem `areas_classificadas_em`, um por vez. Na falha, grava `{Geral}` sem a marca. O registro de requisições vai ao log, sem conteúdo, porque não há tarefa | U1, U3, U6 |
| `backend/src/http/servidor.ts` e `cli/servidor.ts` | Fila de classificação: depois de cada envio pela tela, roda em segundo plano para a organização do envio; ao iniciar, para todas (U6). A resposta do envio não espera. A API vem das opções das tarefas; sem elas, nada é classificado. A rota da Base devolve `areas` (`null` enquanto pendente). Para os testes, um gancho `aoTerminarClassificacao` | U1, U3, U6, U17 |
| `backend/src/config/config.ts` | `TENDRA_MODELO_CLASSIFICACAO_DOCUMENTO` (padrão `claude-haiku-5-5`), `TENDRA_SELECAO_POR_AREA` (padrão ligada; `false` ou `0` desliga) e `TENDRA_SELECAO_MINIMO_TOKENS` (padrão 50000), validadas como as outras | PU11, PU12 |
| `backend/src/recuperacao/buscarFontes.ts` | `DocumentoDoContexto` com `areas` | U9 |
| `backend/src/recuperacao/selecionarContexto.ts` (novo) | Regra pura da seleção (PU7, PU9, PU11, PU12). Recebe a base inteira, a área de cada pergunta e a configuração, e devolve os grupos: área, contexto (em subconjunto da base, na ordem dela) e perguntas. Desligada ou abaixo do limiar: um grupo só, com a base inteira e as perguntas na ordem de hoje | U9, U10, U12, U13 |
| `backend/src/fluxo/processarTarefa.ts` | Depois da classificação das perguntas, a etapa nova `selecao` monta os grupos; a geração roda grupo a grupo, cada um com o seu cache. As perguntas já gravadas antes de um reinício saem dos lotes (U14). Depois vem a segunda tentativa: os itens do contexto "área" que ficaram sem rascunho voltam num lote com a base inteira (PU8). A checagem usa sempre a base inteira (é um superconjunto de cada grupo). O resultado traz o contexto de cada item | U8 a U14 |
| `backend/src/fluxo/executarTarefa.ts`, `persistencia/tarefas.ts`, `observabilidade/metricas.ts` | `itens.contexto` gravado. Métricas novas: `selecao` (ligada ou não, motivo), perguntas por contexto e tokens de entrada da geração por contexto, somados do registro. Etapa `selecao` na duração. Comportamento da tarefa com a configuração da seleção | PU10, U8 |
| `backend/src/ia/apiSimulada.ts` | Classificação dos documentos por palavras-chave, como a das perguntas | testes |
| `backend/src/cli/avaliarAreasDosDocumentos.ts` (novo) | `npm run avaliar-areas-documentos -- <pasta-da-base> <areas-esperadas.json>`: classifica os arquivos com a API real, sem banco, e grava o relatório de concordância geral e por área (concordante = inclui todas as áreas rotuladas, sem nenhuma a mais) | U7 |
| `backend/src/avaliacao/` e `cli/avaliar.ts` | Comparação de duas execuções da mesma RFP (seleção ligada e desligada): tokens, tempo da geração, relevância, fidelidade, perguntas por contexto e cobertura da seleção | U16 |
| `src/api.js`, `src/workspace/useWorkspace.js`, `viewModel.js`, `data.js` | Áreas do documento na tela. Enquanto houver documento em "Classificando…", a lista é recarregada a cada 3 s. Áreas nos documentos de exemplo | U17 |
| `src/workspace/screens/Base.jsx` | Coluna "Áreas" com etiquetas neutras, sem rolagem lateral a 1.024 px com o menu aberto. No celular, as áreas aparecem no cartão e nos detalhes do documento | U17 |
| `backend/test/`, `src/**/*.test.js`, `e2e/` | Testes dos cenários no PGlite e no Postgres. Os testes do servidor esperam a fila de classificação antes de fechar o banco (o mesmo cuidado que faltou no "deadlock" visto no PR #113) | U1 a U17 |

## Desvio em relação à spec

- **Lugar de `buscarFontes` (PU6):** continua antes da classificação das perguntas. Ela só lê o banco e conta os tokens (a contagem não é geração nem é cobrada), e é ela que decide a base vazia (cenário 10, nenhuma chamada à IA) e o teto (cenário 11). A seleção, que é o que depende da área, vem depois da classificação, e nenhuma geração acontece antes. O cenário U8 continua valendo.

## Etapas

### U-a1. Banco e classificação dos documentos
- Migração 014, persistência com as áreas, instrução nova, `classificarDocumento.ts`, a fila no servidor e a classificação ao iniciar.
- **Verificação:** testes com a API simulada:
  - envio sem esperar a IA e com as áreas gravadas depois (U1);
  - várias áreas, e "Geral" junto com outra área (U2);
  - falha da IA, resposta ilegível e lista vazia, e nova tentativa na subida seguinte (U3);
  - documento com instrução embutida, que vai como dado (U4);
  - "Sem mudança" sem chamada e reenvio com conteúdo novo, com a classificação antiga descartada pelo hash (U5);
  - RFP passada sem chamada (U5b);
  - migração com dados de antes da fase e a classificação dos existentes (U6).

### U-a2. Coluna "Áreas" na tela da Base
- Front e recarga enquanto houver documento pendente.
- **Verificação:** testes de unidade do formato e jornada de ponta a ponta. Conferir no navegador a 1.024 px com o menu aberto e no celular, sem rolagem lateral (U17).

### U-a3. Avaliação da classificação dos documentos
- Comando novo e uma execução com a API real na base da Vereda (86 documentos novos com áreas rotuladas).
- **Verificação:** relatório com a concordância (meta ≥ 85%) (U7). A avaliação mede, mas não bloqueia a publicação (PU12).

### U-b1. Seleção e geração por grupo
- Configuração, `selecionarContexto.ts`, a etapa `selecao`, a geração por grupo, a segunda tentativa e o contexto por item.
- **Verificação:** testes com a API simulada:
  - contexto do grupo só com a área e os "Geral", conferido nos documentos de cada requisição registrada (U9);
  - pergunta "Geral" e área sem documento na base inteira (U10);
  - segunda tentativa que acha a resposta e que não acha (U11);
  - quatro áreas misturadas, com a ordem dos itens e da planilha preenchida igual à original (U12);
  - base abaixo do limiar e seleção desligada, com as mesmas requisições de antes da fase (U13);
  - retomada sem gerar de novo as perguntas gravadas (U14);
  - duas organizações (U15);
  - etapa `selecao` nas métricas (U8).

### U-b2. Avaliação da seleção
- Comparação no `avaliar`; execução com a API real na RFP da Vereda, com a seleção ligada e desligada.
- **Verificação:** relatório com tokens, tempo, relevância, fidelidade, cobertura e perguntas por contexto (U16). Uma reprovação leva a ajustar a classificação ou o limiar, ou a desligar a seleção, sem bloquear a publicação (PU12).

### U-c. Publicação
- Merge pela conta dona do time na Vercel. Deploy no Render com a migração 014.
- Conferir no Supabase: as áreas dos documentos das duas organizações depois da classificação ao iniciar (U6). Conferir também a primeira tarefa processada na Vereda (tokens da base e contexto dos itens).
- Atualizar os documentos que a spec lista em "Documentos a atualizar".

## Situação (12/11/2026): publicada; seleção desligada depois da primeira tarefa real

- **U-a1, U-a2 e U-b1:** implementadas.
  - Backend: 432 testes no PGlite (o CI roda também no Postgres). Os novos cobrem U1 a U6 (`areasDosDocumentos.test.ts`), U8 a U15 e o rastreio de PU10 (`selecaoPorArea.test.ts`) e a regra da seleção (`selecionarContexto.test.ts`).
  - Front: testes de unidade do formato das áreas e a coluna "Áreas" no teste de ponta a ponta da Base (O1 a O3 mais U17), a 1.024 px com o menu aberto e no celular, sem rolagem lateral. Suíte de ponta a ponta completa verde (114 testes).
- **U-a3 e U-b2 (avaliações com a API real):** comandos prontos (`avaliar-areas-documentos` e `avaliar-selecao`), com testes da conta. As execuções esperam:
  - a chave da API, que não está neste ambiente;
  - a carga dos 86 documentos novos na base publicada da Vereda, que o grupo faz pela tela.
- **U-c (publicação):** feita e conferida.
  - **Deploy:** merge do PR #114 às 18:29 UTC; deploy no Render às 18:30, sem erro nos logs. Migração 014 aplicada às 18:30:39.
  - **Classificação dos documentos:** os 16 da Pulse e os 16 existentes da Vereda foram classificados ao iniciar (18:31). Depois, o grupo subiu pela tela os 86 documentos novos da Vereda e, junto, os 16 de `base/existentes/`, que substituíram os originais com o mesmo conteúdo e foram classificados de novo. Ao todo, 130 classificações, nenhuma com falha. As 4 RFPs passadas ficaram "Geral" sem chamar a IA.
- **Primeira tarefa real com a seleção ligada (18:40 UTC):** `RFP-V1-Banco-Pampa-Homologacao.xlsx` na Vereda, 54 perguntas, pronta em 76 s.
  - **Base:** 105.492 tokens pela contagem da API, mais que o dobro da estimativa da carga (cerca de 48 mil). A seleção ligou, com 5 grupos de área de 29 a 50 dos 102 documentos.
  - **O que funcionou:**
    - 51 sugeridas e 3 "Sem rascunho": as duas sem resposta na base (4.11 e 6.02) e o compromisso não sustentado (5.07). Nenhuma pergunta com resposta em "Sem rascunho".
    - Segunda tentativa em 5 perguntas. A 3.03 (fonte em outra área) achou a resposta na tabela de preços, como em U11.
    - Relevância de 90% (46 de 51 citam um documento esperado), acima do limite de 80%.
    - Conflito de RPO e RTO (3.06) apontado.
  - **O que não funcionou:**
    - **Custo:** US$ 1,03 na tarefa, com 336 mil tokens gravados no cache, porque cada grupo grava o seu contexto. Estimativa com a base inteira (sem execução para comparar): cerca de 105 mil gravados e US$ 0,55. A seleção encareceu a tarefa.
    - **Tokens de entrada da geração:** 535 mil, contra cerca de 630 mil estimados com a base inteira (−15%, meta −40%). Os grupos ficam grandes porque muitos documentos têm várias áreas e os "Geral" entram em todos.
    - **Perguntas prejudicadas pela seleção:** 2.11 e 3.12 caíram numa área em que o documento esperado não estava. Na 5.03 (conflito de prazo de disponibilização), a pergunta foi para Produto, o contrato não tem essa área, e o conflito não foi apontado.
    - **Classificação das perguntas:** 47 de 54 na área esperada do gabarito.
  - **Classificação dos documentos (U7, medida no banco publicado contra `areas-esperadas-documentos.json`):** 58% de concordância exata (50 de 86), abaixo da meta de 85%. Em 83% (71 de 86), as áreas atribuídas incluem todas as rotuladas. A maioria dos erros é área a mais (34 casos), que só reduz a economia. Os que prejudicam são os de área a menos (16 casos), porque o documento sai do contexto daquela área.
- **Decisão (12/11/2026): seleção desligada no Render** (`TENDRA_SELECAO_POR_AREA=false`), a pedido do grupo, às 18:50 UTC. A troca da variável reinicia o serviço, sem mudança de código. A classificação dos documentos continua: a variável só muda o processamento da RFP.
- **Próximos passos:**
  - processar a mesma RFP com a seleção desligada, para a comparação U16 com números reais (`avaliar-selecao`);
  - antes de religar, rever a regra: um limiar maior que 105 mil tokens nesta base, menos áreas por documento (só a principal e as fortes) ou um teto de documentos por grupo;
  - rever a instrução `classificacao-documento-v1`, que atribui áreas demais.

### Revisão da classificação dos documentos (12/11/2026, aprovada pelo grupo)

Motivo: na base da Vereda, a v1 deu 58% de concordância exata (meta 85%), com 34 áreas a mais e 16 a menos. A instrução pedia "todas as áreas de que o documento trata de forma substancial", e o modelo contava qualquer seção que tocava num assunto.

- **Instrução `classificacao-documento-v2`:**
  - o teste de cada área passa a ser "uma pergunta de RFP desta área seria respondida citando este documento?";
  - definições das áreas pelo que respondem (o que a plataforma faz, como funciona por dentro, como os dados são protegidos, o que se paga, o que se compromete em contrato);
  - "Geral" só para documentos institucionais; integridade, anticorrupção e conduta passam a ser Jurídico;
  - uma lista de erros a evitar, com exemplos genéricos (menção a acesso não é Segurança, menção a sistema não é Tecnologia, preço de passagem não é Comercial).
- **Saída nova:** uma área `principal` obrigatória e até duas `secundarias`, cada uma com o título da seção que a justifica. O código descarta a secundária cuja seção não existe no documento, repetida ou além de duas; principal "Geral" vale sozinha; principal fora da lista é falha.
- **Migração 015 (`documentos.areas_versao`):** guarda a versão da instrução. Ao iniciar, o backend reclassifica os documentos de outra versão (os 98 documentos classificados com a v1), mantendo as áreas atuais até a nova classificação; uma falha nessa reclassificação mantém as áreas da v1. RFPs passadas continuam sem ir à IA.
- **Rótulos revistos em `areas-esperadas-documentos.json`,** com o mesmo critério (a área de uma pergunta do gabarito que cita o documento):
  - `arquitetura-ia-extracao.md`: de Tecnologia e Produto para Tecnologia e Segurança e privacidade (o gabarito o usa numa pergunta de segurança sobre o uso dos dados pela IA);
  - `suporte-tecnico-niveis.md`: de Tecnologia e Comercial para Tecnologia (suporte técnico é Tecnologia);
  - `direitos-titulares-procedimento.md`: de Segurança e privacidade e Jurídico para Segurança e privacidade (LGPD);
  - `politica-reajuste.md`: de Comercial e Jurídico para Comercial;
  - `modulo-extracao-campos.md`: de Produto e Tecnologia para Produto.
- **Cuidado na avaliação:** os erros a evitar da v2 foram escritos a partir dos erros vistos na base da Vereda. A concordância medida nela tende a ser otimista; a confirmação vem da próxima base real.
- **Pendente:** medir a v2 com a API real (`avaliar-areas-documentos`) antes de publicar, e comparar com a v1, que com os rótulos revistos fica em 64% de concordância exata (55 de 86) e 88% incluindo todas as rotuladas (76 de 86).

### Medição da v2 em produção (12/11/2026)

O ambiente da sessão não aceita a chave da Anthropic, então a v2 foi medida em produção, com a seleção desligada (as áreas só aparecem na tela da Base). Merge do PR #116 às 19:58 UTC; deploy às 19:59; migração 015 aplicada; os 114 documentos classificados com a v2 até 20:02, sem falha.

| Medida (86 documentos novos da Vereda, rótulos revistos) | v1 | v2 publicada |
|---|---|---|
| Concordância exata | 64% (55) | 63% (54) |
| Áreas atribuídas incluem todas as rotuladas | 88% (76) | 63% (54) |
| Área principal entre as rotuladas | 93% (80) | 97% (83) |
| Áreas a mais | 33 | 3 |
| Áreas a menos | 11 | 33 |

- **A área principal melhorou:** só 3 documentos ficaram com uma área fora das rotuladas (`matriz-cobertura-uf.md` em "Geral", `modelos-checklist-detalhados.md` em Jurídico e `anexo-layout-exportacao.md` em Produto). As áreas a mais caíram de 33 para 3.
- **Bug: nenhuma área secundária foi gravada.** A entrada lista as seções com o caminho ("Título > 2. Seção"), o Haiku copia esse caminho, e o código comparava só o título solto. Toda secundária era descartada. Os 30 documentos rotulados com mais de uma área perderam as demais (as 33 a menos). Os logs confirmam que a IA mandou secundárias: respostas de 65 a 70 tokens, contra 23 sem secundária. Os testes não pegaram porque a API simulada devolvia o título solto.
- **Correção (PR seguinte):**
  - a conferência usa o último trecho do caminho;
  - o título do topo do documento não vale como seção quando há seções abaixo dele;
  - a API simulada dos testes passa a responder com o caminho, como o Haiku;
  - a migração 016 marca os documentos da v2 publicada para reclassificação ao iniciar, mantendo a área principal até lá.
- **Próximo passo:** medir de novo depois da correção, da mesma forma.

### Como rodar as avaliações

```bash
cd backend
npm run avaliar-areas-documentos -- ../base-sintetica/vereda-documental/base ../base-sintetica/vereda-documental/areas-esperadas-documentos.json
```

Para a U16, com a base da Vereda carregada no banco local e classificada (uma subida do servidor classifica os documentos pendentes):

```bash
TENDRA_SELECAO_POR_AREA=true npm run responder -- ../base-sintetica/vereda-documental/rfps/RFP-V1-Banco-Pampa-Homologacao.xlsx --organizacao <id>
TENDRA_SELECAO_POR_AREA=false npm run responder -- ../base-sintetica/vereda-documental/rfps/RFP-V1-Banco-Pampa-Homologacao.xlsx --organizacao <id>
npm run avaliar-selecao -- ../dados/resultados/<ligada> ../dados/resultados/<desligada> --gabarito ../base-sintetica/vereda-documental/rfps/gabarito-rfp-vereda.json
```

## Riscos do plano

- **Corrida entre a classificação e um reenvio:** resolvida pela gravação condicionada ao hash.
- **Classificação e tarefas disputando a API:** filas separadas, uma chamada pequena por documento. Num envio de 100 arquivos, são 100 chamadas ao Haiku em sequência, em alguns minutos. A tela mostra "Classificando…" até terminar.
- **Base da Vereda perto do limiar:** pela estimativa da carga, cerca de 48 mil tokens. Se a contagem da API ficar abaixo de 50 mil, a seleção não liga nela. A avaliação U16 roda com `TENDRA_SELECAO_MINIMO_TOKENS` mais baixo, se for preciso, e o número real fica registrado no plano.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| U1, U17 | Subir um documento na tela e ver "Classificando…" virar as áreas, no computador e no celular |
| U3 | Com a IA simulada falhando, subir um documento e ver "Geral"; reiniciar e ver a nova tentativa |
| U5, U5b | Reenviar sem mudança (nenhuma chamada no log); subir uma RFP passada e ver "Geral" na hora |
| U6 | Depois do deploy, conferir no banco as áreas e a marca dos documentos das duas organizações |
| U7 | Rodar `avaliar-areas-documentos` na base da Vereda e conferir a concordância |
| U8 a U12 | Processar a RFP da Vereda e conferir a etapa `selecao`, os documentos de cada requisição no registro e o contexto dos itens no banco |
| U13 | Processar uma RFP da Pulse (base pequena) e ver um único contexto, com a base inteira |
| U14 | Reiniciar o backend no meio de uma tarefa e ver a retomada sem gerar de novo o que estava gravado |
| U16 | Rodar a comparação com a seleção ligada e desligada e conferir o relatório |
