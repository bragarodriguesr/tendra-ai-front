# Mapa de pendências de arquitetura do backend do MVP

*Levantamento de 10/10/2026. Complementa `docs/mvp-proposta-1/SPEC.md` (status `draft`) e o handoff da sessão de análise do backend (documento local, fora do repositório). Nenhuma das decisões abaixo está tomada; as colunas "Recomendação" são propostas para discussão.*

**Enquadramento:** servidor, banco, autenticação, armazenamento e chaves **não são decisões independentes**. Quase todas derivam de uma única decisão (seção 0). Por isso o mapa começa por ela.

---

## 0. A decisão-mãe: quem usa o backend e de onde

| Modo de uso | Consequência em cascata |
|---|---|
| **Local**: uma pessoa roda e conduz as sessões | Não precisa de hospedagem, autenticação real nem armazenamento em nuvem. A chave da API fica na máquina de quem roda. |
| **Compartilhado**: cada pessoa acessa no seu tempo | Precisa de hospedagem, banco gerenciado, armazenamento de arquivos, autenticação real e cofre de segredos. A chave passa a ser usada por todos, e o custo se concentra numa única conta da API. |

As seções 1 a 4 abaixo ficam **bloqueadas** por essa escolha. As seções 5 a 10 valem para os dois modos.

> **Decisão (11/10/2026): modo compartilhado.** As recomendações das seções 1 a 4 passam a seguir a coluna "compartilhado".

### Decisões registradas

| Data | Decisão | Consequência |
|---|---|---|
| 11/10/2026 | Modo **compartilhado** | Login real com contas pré-cadastradas (nomes e papéis sintéticos); os cenários 1 a 4 do SPEC voltam para a versão 1. Dois ambientes: desenvolvimento local e "demo" compartilhado. |
| 11/10/2026 | **Supabase** (Postgres e object storage) + **Render** (backend) | Railway saiu porque não tem plano gratuito permanente. |
| 11/10/2026 | **Planos gratuitos** inicialmente | Ver "Limites do plano gratuito" abaixo. |
| 11/10/2026 | Front: **Vercel em avaliação**, ainda não definido | Ver "Front na Vercel" abaixo. |

**Limites do plano gratuito** (de memória; confirmar ao criar as contas):

- **Supabase:** o projeto pausa após cerca de 7 dias sem uso e precisa ser reativado no painel. Espaço limitado de banco e de arquivos, suficiente para dados sintéticos.
- **Render:** o serviço "dorme" após cerca de 15 minutos sem acesso, e o primeiro acesso seguinte demora para responder. Se a pessoa fechar o navegador no meio de uma geração, o serviço pode dormir e interromper o job; por isso JOB-4 (retomar de onde parou) passa a ser obrigatório. O disco é apagado a cada deploy, então arquivos ficam só no Supabase.
- **Rotina antes de cada sessão de uso:** abrir o painel do Supabase (se pausado) e acessar o backend uma vez para "acordá-lo".

**Front na Vercel**, se confirmado:

- Front (`*.vercel.app`) e backend (`*.onrender.com`) ficam em domínios diferentes, e os navegadores bloqueiam cada vez mais cookies entre domínios. Solução proposta: **regra de rewrite da Vercel** encaminhando `/api/*` para o backend. Para o navegador, tudo fica no mesmo endereço, sem CORS e com cookie de primeira parte.
- Verificar no spike se o rewrite aceita upload de arquivos de até 10 MB. Se não aceitar, o upload vai direto para o Supabase Storage por URL assinada, gerada pelo backend.
- O plano gratuito da Vercel (Hobby) é para uso não comercial. Confirmar se o MVP se enquadra.

**Riscos novos do modo compartilhado** (viram cenários no SPEC):

1. Gasto da API por qualquer pessoa logada. **Decisão (11/10/2026): sem cota por usuário.** A conta da Anthropic usa créditos pré-pagos sem recarga automática, então o gasto máximo é o saldo.
2. Força bruta no login: limite de tentativas por IP e por conta.
3. Envio de dados reais: aviso fixo na interface e regra de uso do ambiente.
4. URL pública: HTTPS, cookie seguro e CORS restrito obrigatórios.

**Contexto:** no SPEC atual, "servidor" significa o próprio backend, um processo Node.js rodando na máquina de quem o inicia, com dados no disco local. Se cada pessoa rodar o backend no próprio computador, cada uma terá um banco separado, e a taxa de aceitação sai fragmentada por máquina.

---

## 1. Execução: onde o backend roda

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| INF-1 | Onde o processo roda | Máquina local · uma máquina na rede do grupo · PaaS (Render, Railway, Fly.io) · Azure ou AWS (como prevê a D8) | **Local** no modo local. **PaaS** no modo compartilhado. Azure ou AWS só fazem sentido no produto; para o MVP são caros em tempo de configuração. |
| INF-2 | Região | EUA (padrão dos PaaS) · Brasil | Com dados sintéticos, a região não importa. Registrar no spec que o produto vai exigir região Brasil (S16). |
| INF-3 | Portabilidade | Código preso ao ambiente · configuração toda por variáveis de ambiente | **Configuração por variáveis de ambiente desde o início**, para começar local e subir para PaaS sem reescrever. |
| INF-4 | Front ↔ backend | Proxy do Vite em desenvolvimento · CORS com origem fixa · front servido pelo backend | **Proxy do Vite** em desenvolvimento. Num deploy, **CORS restrito** à origem do front. |

## 2. Banco de dados

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| DAD-1 | Motor | SQLite (arquivo local) · Postgres em Docker · Postgres gerenciado (Neon, Supabase, Render) · **PGlite** (Postgres embutido, roda a partir de um arquivo, sem instalar nada) | **Postgres como dialeto desde o início.** No modo local, PGlite ou Postgres em Docker. No compartilhado, Postgres gerenciado. Assim o caminho para pgvector e um banco por cliente (D8) não exige migrar de SQLite. O PGlite evita Docker no Windows, mas é mais novo e aceita uma conexão por vez, o que basta para o MVP. |
| DAD-2 | Acesso ao banco | SQL puro · query builder (Kysely, Drizzle) · ORM (Prisma) | **Drizzle ou Kysely**: tipados, leves e com migrações. |
| DAD-3 | Migrações e seed | Manual · ferramenta de migração + script de seed | **Migrações versionadas** mais um **seed** com pessoas sintéticas, documentos e RFPs sintéticos. Também um comando de reset para demonstrações. |
| DAD-4 | Modelo de dados | Espelhar `data.js` · normalizar | **Normalizar**: documento, tarefa, item, parágrafo, fonte, alerta, avaliação, evento. A API devolve o formato de `data.js` (D3). Alertas e fontes em tabela própria facilitam o relatório de aceitação. |
| DAD-5 | Auditoria e histórico | Tabela de eventos só de inclusão · tabelas por tipo | **Uma tabela de eventos só de inclusão**, mesmo que a auditoria fique para depois da versão 1. A taxa de aceitação e o histórico saem dela. |
| DAD-6 | Backup | Nenhum · cópia do arquivo · backup do provedor | Local: nenhum (dados sintéticos e reprodutíveis pelo seed). Compartilhado: o backup do provedor gerenciado. |

## 3. Armazenamento de arquivos

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| ARQ-1 | Onde ficam os arquivos originais | Disco local · object storage (S3, Cloudflare R2, Supabase Storage) · dentro do banco | Local: **disco**, numa pasta coberta pelo `.gitignore` (cenário 49). Compartilhado: **object storage**, porque disco de PaaS costuma ser apagado a cada deploy. |
| ARQ-2 | Files API da Anthropic | Mandar o arquivo inteiro a cada chamada · subir uma vez e referenciar pelo `file_id` | Usar a Files API economiza envio, mas **mantém cópias na Anthropic**. Depende do estudo de retenção (S4). Para o MVP sintético, pode. |
| ARQ-3 | Texto extraído | Recalcular a cada geração · guardar a versão convertida (blocos por seção ou linha) | **Guardar** a versão convertida e os metadados (páginas, tokens). É o que permite contar tokens e traduzir a citação para `"linha N"`. |

## 4. Identidade, sessão e segredos

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| SEG-1 | Autenticação | Pessoas sintéticas sem senha · e-mail e senha próprios · provedor (Supabase Auth, Clerk) | Local: **pessoas sintéticas**, com o backend aceitando só conexões da própria máquina. Compartilhado: **e-mail e senha com hash** ou o provedor do banco escolhido. |
| SEG-2 | Sessão | Token no navegador · cookie `httpOnly` | **Cookie `httpOnly`**, que não fica acessível a scripts da página. |
| SEG-3 | Chave da API | Variável de ambiente local · cofre de segredos do PaaS | Local: variável de usuário do Windows (S3). Compartilhado: cofre do PaaS. |
| SEG-4 | Conta da chave e teto de gasto | Chave de uma conta pessoal · workspace dedicado na Anthropic | Criar um **workspace "Tendra MVP"** no console da Anthropic, com **limite de gasto mensal**. Assim, uma chave vazada ou um laço com erro não gera custo sem limite. |

---

## 5. Stack e estrutura do backend

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| STK-1 | Linguagem | JavaScript · TypeScript · Python | **TypeScript com Node 24**: mesmo ecossistema do front, SDK oficial da Anthropic e tipos que protegem o contrato de dados. |
| STK-2 | Framework HTTP | Express · Fastify · Hono | **Fastify**: validação de entrada por schema e upload de arquivos maduro. |
| STK-3 | Organização do repositório | `backend/` com `package.json` próprio · workspaces do npm | **`backend/` independente**, sem mexer no `package.json` do front (D4). |
| STK-4 | Camadas | Tudo nas rotas · rotas → serviços → repositório, mais `buscarFontes` separado | **Camadas**, com `buscarFontes` como interface própria (D2), para trocar o motor de busca depois sem tocar no resto. |

## 6. Processamento assíncrono

Gerar 60 rascunhos leva minutos, e uma requisição HTTP não pode ficar esperando esse tempo.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| JOB-1 | Fila | Fila em memória · **tabela de jobs no banco** com um worker no mesmo processo · BullMQ com Redis · Batch API da Anthropic | **Tabela de jobs no banco.** Sobrevive a reinício (cenário 41) sem acrescentar Redis. A Batch API custa 50% menos, mas pode levar até 24 h: serve depois, para reprocessamentos. |
| JOB-2 | Progresso para o front | Front consulta a cada poucos segundos (polling) · servidor envia eventos (SSE) | **Polling** no MVP: é simples e o front já tem estados de "processando". O cenário 3 cita uma rota de "eventos"; definir se ela é esse polling. |
| JOB-3 | Concorrência e limite de requisições | Sem limite · número máximo de chamadas simultâneas, com nova tentativa espaçada | **Limite configurável**, para respeitar o limite de requisições da conta de teste. |
| JOB-4 | Reinício no meio do job | Perder o progresso · retomar de onde parou | **Retomar**: cada pergunta é um passo gravado. |

## 7. Pipeline de IA

Esta é a seção de maior risco técnico. Várias decisões aqui pedem um **teste prático rápido (spike)** antes de fechar.

**Limites da API do Claude verificados em 10/10/2026:**

| Limite | Valor | Efeito no spec |
|---|---|---|
| Tamanho da requisição | 32 MB no total. O base64 aumenta cada arquivo em cerca de 33%. | Limita a soma dos documentos ativos, não só cada arquivo. |
| Páginas por PDF | 600 | Folgado para dados sintéticos. |
| Janela de contexto | 1M tokens em Opus 5.5, Sonnet 5.5 e Haiku 5.5 | O limite prático passa a ser custo e os 32 MB. |
| Citação em PDF | Página exata (`page_location`) | Atende o `"p. N"` do cenário 19. |
| DOCX e XLSX | Não são lidos diretamente. O backend precisa converter para texto antes. | Ver IA-6. |
| Preço por milhão de tokens (entrada/saída) | Opus 5.5 US$ 4/20 · Sonnet 5.5 US$ 2/10 · Haiku 5.5 US$ 0,10/0,50. Com cache, a leitura repetida custa US$ 0,20 no Opus 5.5 e no Sonnet 5.5. | Ver IA-1 a IA-3. |

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| IA-1 | Modelo | Opus 5.5 · Sonnet 5.5 · Haiku 5.5, ou um modelo por etapa | Decidir com dados. Medir os três num conjunto de perguntas-gabarito sintéticas (IA-10). Haiku para extrair perguntas é um bom candidato. |
| IA-2 | Granularidade | 1 pergunta por chamada · lote de N perguntas por chamada | **Lote**, com a base em cache. É o maior fator de custo: 60 chamadas × 400 mil tokens contra cerca de 6 chamadas. |
| IA-3 | Cache de prompt | Sem cache · base de documentos em cache | **Base em cache**: a releitura cai para cerca de 5% do preço. |
| IA-4 | Citações versus formato estruturado | A API **não permite** citações e saída em formato estruturado na mesma chamada | Decidir como obter as citações (obrigatórias) e os sinais de alerta (conflito, cobertura parcial). Opções: duas chamadas, ou citações com marcadores no texto. **Precisa de spike.** |
| IA-5 | Extração das perguntas da RFP | Leitor determinístico (`.xlsx`) · LLM (`.pdf` e `.docx`) | **Determinístico para `.xlsx`; LLM para documentos.** Cuidar para que CNPJ e contatos não entrem nessa chamada (cenário 28). |
| IA-6 | Conversão de DOCX e XLSX | Texto corrido · blocos por seção ou linha | **Blocos**, para a citação voltar como `"linha N"` ou nome da seção (cenário 19). A API devolve o índice do bloco citado, e o backend traduz para a localização. |
| IA-7 | Detectar PDF sem texto | Biblioteca de extração (por exemplo pdfjs) antes de enviar | Testar a camada de texto **antes** de gastar com a API (cenário 8). |
| IA-8 | Conflito e baixa confiança | Julgamento do modelo · regras no backend · os dois | Regras objetivas no backend, mais um sinal do modelo. Depende de IA-4. |
| IA-9 | Prompt injection | Instruções no prompt · separar conteúdo de instrução, mais um teste com documento malicioso | **Os dois.** Os documentos entram como conteúdo e nunca no prompt de sistema (cenário 27). |
| IA-10 | Avaliação de qualidade | Nenhuma · conjunto-gabarito sintético com nota automática | **Gabarito sintético**: cerca de 30 perguntas com resposta e fonte esperadas. Serve para escolher o modelo, ajustar prompts e detectar regressões. |
| IA-11 | Limite e custo por tarefa | Sem teto · contagem de tokens antes de gerar, com teto por tarefa | **Contar tokens antes de gerar** (cenário 29) e gravar o custo de cada tarefa. |

## 8. Contrato com o front

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| API-1 | Estilo e rotas | REST com as rotas da seção 9.3 da análise | **REST**, com o contrato escrito num arquivo OpenAPI gerado a partir dos schemas do Fastify. |
| API-2 | Campos de apresentação | O backend devolve `dueText`, `dueColor` e `age` prontos · o backend devolve dados brutos e o front calcula | **Dados brutos** (datas ISO, números). Hoje `data.js` mistura dado e apresentação. Isso afeta o spec do front. |
| API-3 | Datas e fuso | Strings "dd/mm/aaaa" · ISO 8601 em UTC, exibidas em America/Sao_Paulo | **ISO em UTC.** O front perde as datas fixas em 29/09/2026. |
| API-4 | Formato de erro | Livre · padrão único (código, mensagem, campos) | **Padrão único**, que os cenários 14 e 15 já pedem ("lista cada campo inválido"). |
| API-5 | Quem adapta o front | Mesmo PR · spec e PR próprios | **Spec próprio** (já previsto), mas o contrato precisa ser fechado **antes** dos dois lados começarem. |

## 9. Operação e qualidade

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| OPS-1 | Logs | Console · logs estruturados (pino) | **Estruturados, sem conteúdo de documentos.** O cenário 28 pede o registro do que vai para a IA: guardar só metadados e a lista de campos enviados, ou o conteúdo apenas em desenvolvimento. É um conflito a decidir. |
| OPS-2 | Testes | Manuais · Vitest com a API da Anthropic simulada, mais alguns testes reais marcados | **Simulada por padrão.** Testes que chamam a API de verdade gastam dinheiro e devem ser rodados conscientemente. |
| OPS-3 | CI | Nenhuma · GitHub Actions com lint, testes e varredura de segredos (gitleaks) | **Actions com gitleaks.** O repositório é público, então os minutos são gratuitos e a varredura protege os cenários 48 e 49. |
| OPS-4 | Fluxo de revisão de código | Já registrado como S12 no handoff | Pendente. |
| OPS-5 | Deploy | Manual · automático a partir da `main` | Só existe no modo compartilhado. |

## 10. Riscos que não são decisões, mas precisam de tratamento

- **Custo concentrado numa única conta:** se o modo for compartilhado, todos os usuários consomem a mesma chave. Resolver com SEG-4.
- **Repositório público (S1):** independe da arquitetura, mas o CI com gitleaks reduz o risco enquanto não há decisão.
- **Dependência do front:** sem `api.js` no front, o backend não é demonstrável na interface, só por testes ou chamadas manuais à API. Com o faseamento, cada fase entrega também a sua parte do front.

---

## Ordem de decisão sugerida

1. **Modo de uso** (seção 0). Desbloqueia as seções 1 a 4.
2. **Teste da chave** (D6 do handoff) junto com o **workspace com teto de gasto** (SEG-4). É barato e já está previsto como a primeira etapa.
3. **Stack e banco** (STK-1, STK-2 e DAD-1). Proposta: TypeScript, Fastify e Postgres como dialeto.
4. **Spike de IA** (IA-4, IA-2 e IA-6), com 2 ou 3 documentos sintéticos. Transforma as maiores incertezas em fatos antes do `PLAN.md`.
5. **Contrato de API** (seção 8), fechado antes de backend e front começarem.
6. O restante entra no `PLAN.md`.

**O que vai para o SPEC e o que vai para o PLAN:** o spec deve registrar como pré-requisitos só a seção 0, a seção 4 e o contrato de API (seção 8), porque mudam o comportamento observável. As demais são decisões de `PLAN.md`.

---

## Decisões por fase de entrega

*Adicionado em 12/10/2026.* A entrega da versão 1 foi dividida em fases (ver "Faseamento da entrega" em `docs/mvp-proposta-1/SPEC.md`). Cada decisão deste mapa é resolvida no `PLAN.md` da primeira fase que precisa dela, e não antes. Os itens 3 a 6 da ordem acima passam a seguir esta tabela; o item 4 (spike de IA) corresponde à fase 0.

| Fase | Decisões resolvidas no `PLAN.md` da fase |
|---|---|
| **0. Prova da IA** (opcional) | IA-1 (modelo), IA-2 (granularidade), IA-3 (cache), IA-4 (citações e alertas na mesma geração), IA-6 (citação de planilha e DOCX, validada em teste), IA-10 (gabarito sintético). Também o teste da chave (D6) e o teto de gasto (SEG-4). |
| **1. Estrutura e login** | INF-1 a INF-4, DAD-1 a DAD-3, DAD-6, SEG-1 a SEG-4, STK-1 a STK-4, OPS-1 a OPS-5, API-1, API-3 e API-4. A hospedagem do front (Vercel em avaliação) precisa estar definida aqui, porque o cookie de sessão depende de front e backend no mesmo endereço. OPS-4 (fluxo de revisão, S12) precisa estar decidido antes do primeiro commit. |
| **2. Base de conhecimento** | ARQ-1 a ARQ-3, IA-6 (conversão de DOCX e XLSX em blocos, guardada no upload), IA-7 (PDF sem texto) e a parte de IA-11 que conta tokens para o teto da base. |
| **3. Criação de RFP/RFI** | IA-5 (extração das perguntas) e API-2 (campos de apresentação, como `dueText` e `dueColor` das tarefas). |
| **4a. Geração básica** | JOB-1 a JOB-4, IA-9 (prompt injection) e IA-11 (custo por tarefa). **Se a fase 0 não for feita**, também IA-1, IA-2, IA-3, IA-4 e IA-10, o que aumenta o tamanho e o risco desta fase. |
| **4b. Alertas** | IA-8 (conflito e baixa confiança). |
| **5. Revisão mínima e métrica** | DAD-5 (tabela de eventos, base do relatório de aceitação). |

**Decisões contínuas:** DAD-4 (modelo de dados) evolui a cada fase, e cada fase cria só as tabelas de que precisa. API-5 deixa de ser um spec de front separado: cada fase descreve a sua parte do front no próprio spec.
