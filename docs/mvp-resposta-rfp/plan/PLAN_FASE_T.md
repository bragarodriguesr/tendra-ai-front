---
feature: evolucao-alteracao-papeis
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_T.md (status approved em 09/11/2026)
constitution: 1.0.0
---

# Plano: evolução da alteração de papéis e do cadastro de usuários (fase T)

*Plano de 09/11/2026. Parte do "Painel de Usuários" já ligado ao banco (fase Q, PR #102, no `main`).*

## Objetivo

Duas etapas, cada uma com o seu PR:

- **Etapa T1:** mudar de Revisor para Aprovador abre uma confirmação com as áreas e exige pelo menos uma. Na lista do lápis, o Aprovador não fica sem área: desmarcar a única área avisa e não grava.
- **Etapa T2:** o formulário "Adicionar usuário" ganha Papel (Revisor por padrão), Áreas (lista suspensa, só para o Aprovador) e Situação (Ativo por padrão). A pessoa já entra com esses valores.

Front e backend mudam. Sem migração de banco.

## Fora deste plano

- A confirmação de Aprovador para Revisor e a de desativar o acesso (Q5 e Q7).
- Os Aprovadores que já estão sem área e o comando `cadastrar-perfil`.
- A regra de aprovação por área (fase N).
- Criar a conta, a senha ou o convite; editar nome ou e-mail de quem já está na lista.
- O registro das mudanças no Histórico.

## Pendências de confirmação

Nenhuma bloqueia o código nem os testes locais. Valem para a publicação de cada etapa:

| # | Pendência | Onde |
|---|---|---|
| PT1 | O merge publica o backend no Render (deploy automático). Conferir que o front publicado na Vercel é da mesma versão: um front antigo com o backend novo continua funcionando (os campos novos da rota de adicionar são opcionais), mas a promoção sem área, que o front antigo ainda envia, passa a ser recusada com 400 | Render e Vercel |
| PT2 | O deploy do front na Vercel é bloqueado quando o merge é feito por quem não tem acesso ao projeto (PQ5 da fase Q) | Vercel |

## O que existe hoje no código

| Onde | Hoje | Muda para |
|---|---|---|
| `src/workspace/useWorkspace.js`, `mudarPapelDoUsuario` | Revisor para Aprovador grava direto `{ papel }` | Abre `painelConfirmacao` do tipo `aprovador`; a confirmação grava `{ papel, areas }` (T1.1 a T1.5) |
| `useWorkspace.js`, `marcarAreaDoUsuario` | Grava qualquer resultado de `areasAoMarcar` | Recusa, com aviso, quando o Aprovador com área ficaria sem nenhuma (T1.6) |
| `src/workspace/overlays.jsx`, `ConfirmUserChangeDialog` | Tipos `revisor` e `desativar` | Novo tipo `aprovador`, com as áreas em `Checkbox` e o erro (T1.1 a T1.3) |
| `src/workspace/screens/Users.jsx`, `Areas` | Nota "Sem área, aprova só as perguntas Geral." | Nota "O Aprovador precisa de pelo menos uma área." (T1.6) |
| `Users.jsx`, `Adicionar` | Nome e E-mail | Mais Papel, Áreas e Situação (T2.1 a T2.6) |
| `src/workspace/usuarios.js` | `novoUsuario(nome, email)` e `recusaDoNovoUsuario` | Aceitam papel, áreas e situação; nova recusa de Aprovador sem área (T2.3, T2.4) |
| `src/api.js`, `adicionarUsuarioNaGestao` | Envia `{ nome, email }` | Envia também `papel`, `areas` e `ativo` (T2.4) |
| `backend/src/autenticacao/gestaoDeUsuarios.ts`, `alterarUsuario` | Aceita Aprovador com áreas vazias | Recusa a promoção sem área e a lista vazia para o Aprovador (T1.8) |
| `gestaoDeUsuarios.ts`, `adicionarUsuario` | Grava sempre Revisor, sem área, ativo | Aceita `papel`, `areas` e `ativo`, com as validações (T2.7) |
| `backend/src/http/rotasDeGestaoDeUsuarios.ts`, `POST` | Corpo com `nome` e `email` | Mais `papel`, `areas` e `ativo`, opcionais (T2.7) |

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde fica a regra do mínimo | No backend, em `gestaoDeUsuarios.ts`: a recusa vale quando o pedido **muda o papel para Aprovador** ou **envia `areas`** para quem é ou passa a ser Aprovador. `validarAreasDoPerfil` (`regras/areas.ts`) não muda | Regra no backend (constitution II). `validarAreasDoPerfil` também serve ao `cadastrar-perfil`, que fica fora de escopo, e um pedido só com `ativo` precisa continuar aceito para o Aprovador que já está sem área (T1.7) |
| Mensagens | Constantes em `gestaoDeUsuarios.ts`: "Selecione pelo menos uma área." (promoção e cadastro) e "O Aprovador precisa de pelo menos uma área." (lista vazia para quem já é Aprovador). O front usa os mesmos textos | T1.2, T1.6, T1.8, T2.3 e T2.7 |
| Antecipação no front | A confirmação, o lápis e o formulário recusam antes de chamar a rota, com as mesmas mensagens; quem decide é a rota | Mesmo padrão da fase Q (DF6) |
| Estado da confirmação | `painelConfirmacao: { tipo: "aprovador", id, areas: [], erro: null }`; marcar usa `areasAoMarcar` e limpa o erro; confirmar sem área grava o erro no estado e não fecha | Reaproveita o diálogo, o Esc e o foco que já existem; cancelar descarta as áreas (T1.5) |
| Seletor de Papel ao cancelar | O `Select` é controlado por `u.papel`: como nada é gravado ao abrir a confirmação, ele continua em "Revisor" | T1.5, sem estado extra |
| Lista do lápis | `marcarAreaDoUsuario` calcula `areasAoMarcar`; se quem tem área ficaria com zero, mostra o aviso "Área não removida" e não grava | T1.6; C-Level por outra área nunca passa por zero |
| Campo Áreas do formulário | Componente local em `Users.jsx` (`CampoDeAreas`): botão com a aparência do `Select` (`sm`), `aria-haspopup="listbox"` e `aria-expanded`; lista com `Checkbox` no estilo da lista do lápis; fecha com clique fora ou Esc e devolve o foco | T2.2 e T2.8. O `Select` do design system é de escolha única; sem componente novo no DS |
| Estado do formulário | Local ao componente `Adicionar` (`papel`, `areas`, `ativo`), como já são nome e e-mail | O formulário fecha e é recriado a cada abertura |
| Rota de adicionar | `papel` (enum), `areas` (array) e `ativo` (boolean) opcionais no esquema; padrões Revisor, `[]` e `true`. `adicionarUsuario` valida com `validarAreasDoPerfil` e exige área para o Aprovador, antes de procurar a conta | T2.7; pedido só com nome e e-mail continua igual (front antigo, PT1) |
| Pessoa adicionada como inativa | Grava `ativo = false`; não há sessão para apagar | T2.5; `sessaoValida` já recusa perfil inativo |
| Modo local | As mesmas ações sobre os dados de exemplo (`gravarMudancaDeUsuario` e `novoUsuario`) | T1.9 e T2.8 |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### T0. Spec
- `SPEC_FASE_T.md` aprovado em 09/11/2026.
- **Verificação:** status `approved` no spec.

### Etapa T1: confirmação ao mudar para Aprovador e mínimo de uma área

#### T1-A. Backend
- `alterarUsuario`: recusa 400 a promoção sem área e a lista de áreas vazia para o Aprovador, com as duas mensagens.
- Testes em `backend/test/integracao/gestaoDeUsuarios.test.ts`:
  - promoção sem `areas` e com `areas: []`;
  - promoção com áreas grava papel e áreas juntos;
  - `areas: []` para quem é Aprovador;
  - Aprovador já sem área: `ativo` e rebaixar continuam aceitos, e marcar a primeira área funciona;
  - C-Level combinado e área inválida continuam recusados.
- Ajustar os testes atuais que promovem sem área.
- **Verificação:** `npm test` e `npm run typecheck` do backend passam.

#### T1-B. Front: confirmação
- `mudarPapelDoUsuario` abre a confirmação do tipo `aprovador`; ações para marcar área na confirmação e confirmar.
- `ConfirmUserChangeDialog` com as áreas, a nota do C-Level e o erro com `role="alert"`.
- Aviso "Papel alterado": "{nome} agora é Aprovador de {áreas}."
- **Verificação:** no modo local, promover um Revisor abre a confirmação; sem área aparece o erro; com área a linha muda; cancelar mantém "Revisor".

#### T1-C. Front: lista do lápis
- `marcarAreaDoUsuario` com a recusa e o aviso "Área não removida".
- Nota nova na lista do lápis.
- **Verificação:** no modo local, desmarcar a única área mantém a caixa marcada e mostra o aviso; com duas áreas, desmarcar uma funciona.

#### T1-D. Testes do front
- `test/usuarios.test.js`: função pura que diz se a mudança de áreas é aceita.
- `e2e/painelDeUsuarios.spec.js`: cenários T1.1 a T1.7 no modo local e, com a API simulada, a gravação num só pedido (`{ papel, areas }`) e a recusa 400 mostrada no aviso; T1.9 no celular e pelo teclado.
- Ajustar os testes atuais da fase Q que promovem direto.
- **Verificação:** `npm test` e `npm run e2e` passam, inclusive os testes que já existiam.

#### T1-E. Publicação e conferência
- PR da etapa T1, merge, deploy (PT1 e PT2).
- **Verificação:** checklist da etapa T1 conferido no publicado, com contas de teste.

### Etapa T2: Papel, Áreas e Situação no cadastro

#### T2-A. Backend
- Esquema da rota `POST` e `adicionarUsuario` com `papel`, `areas` e `ativo`.
- Testes em `gestaoDeUsuarios.test.ts`:
  - só nome e e-mail: Revisor, sem área, ativo, como hoje;
  - Aprovador com áreas; Aprovador sem área (400); Revisor com área (400); área inválida; C-Level combinado; papel inválido;
  - `ativo: false` grava inativo, e a pessoa não entra;
  - as recusas 404, 409 e 503 continuam, e nada é gravado quando a validação falha.
- `organizacoes.test.ts`: o teste de isolamento da rota continua passando.
- **Verificação:** `npm test` e `npm run typecheck` do backend passam.

#### T2-B. Front: formulário
- `usuarios.js`: `novoUsuario` e `recusaDoNovoUsuario` com papel, áreas e situação.
- `api.js` e `adicionarUsuario` do `useWorkspace` enviando os novos campos; aviso "Usuário adicionado" com as três variações.
- `Adicionar` em `Users.jsx`: Papel (`Select`), `CampoDeAreas`, Situação (`Switch`), erro no campo Áreas, aviso do formulário reduzido.
- Layout no computador e no celular.
- **Verificação:** no modo local, adicionar um Revisor (padrão), um Aprovador com áreas e uma pessoa inativa; Aprovador sem área mostra o erro; o formulário mantém o preenchido em caso de recusa.

#### T2-C. Testes do front
- `test/usuarios.test.js`: novo usuário com os valores escolhidos e a recusa de Aprovador sem área.
- `e2e/painelDeUsuarios.spec.js`: cenários T2.1 a T2.6 no modo local; com a API simulada, o corpo do pedido (`nome`, `email`, `papel`, `areas`, `ativo`) e as recusas da rota; T2.8 no celular e pelo teclado.
- **Verificação:** `npm test` e `npm run e2e` passam.

#### T2-D. Publicação e conferência
- PR da etapa T2, merge, deploy (PT1 e PT2).
- **Verificação:** checklist da etapa T2 conferido no publicado, com contas de teste.

## Checklist de aceite

### Etapa T1

| Cenário | Como conferir |
|---|---|
| T1.1 | Escolher "Aprovador" no seletor de um Revisor abre "Mudar {nome} para Aprovador?", com as seis áreas desmarcadas |
| T1.2 | Confirmar sem área mostra "Selecione pelo menos uma área." e nada muda |
| T1.3 | Marcar C-Level desmarca as demais, e o contrário |
| T1.4 | Confirmar com área: a linha vira Aprovador com as etiquetas, e o aviso cita as áreas |
| T1.5 | Cancelar ou Esc: o seletor continua em "Revisor" |
| T1.6 | Desmarcar a única área no lápis: a caixa continua marcada e aparece "O Aprovador precisa de pelo menos uma área." |
| T1.7 | Um Aprovador já sem área continua com "Geral" e o lápis; desativar e rebaixar funcionam |
| T1.8 | Pedido direto à rota sem área responde 400 |
| T1.9 | O mesmo no modo local, no celular e só com o teclado |

### Etapa T2

| Cenário | Como conferir |
|---|---|
| T2.1 | O formulário abre com Papel "Revisor", Áreas "Geral" desabilitado e Situação "Ativo" |
| T2.2 | Com "Aprovador", o campo Áreas abre a lista; o campo mostra as escolhidas; voltar a "Revisor" limpa |
| T2.3 | Aprovador sem área: erro no campo, nada gravado |
| T2.4 | A pessoa aparece na lista com o papel, as áreas e a situação escolhidos, e o aviso corresponde |
| T2.5 | Adicionada como Inativo: a conta não entra na Tendra.ai até ser reativada |
| T2.6 | E-mail sem conta, já na lista ou de outra organização: mesmas mensagens, com o formulário preenchido |
| T2.7 | Pedido direto só com nome e e-mail grava Revisor ativo; Aprovador sem área responde 400 |
| T2.8 | O mesmo no modo local, no celular e só com o teclado |

## Situação (16/11/2026): T1 e T2 implementadas e no `main` (PR #108)

- T1-A a T1-D e T2-A a T2-C implementadas e testadas (detalhes em `PLAN.md`, fase T).
- Versão integrada com a `main` de 16/11/2026: backend 439 testes, front 45 de unidade e 122 de ponta a ponta, todos verdes.
- Pendente: T1-E e T2-D, a conferência no ambiente publicado, depois do deploy no Render e na Vercel.

## Riscos

| Risco | Mitigação |
|---|---|
| Front antigo com backend novo recusando a promoção direta | Publicar front e backend juntos (PT1); a recusa aparece no aviso, sem gravar nada |
| A regra do mínimo bloquear quem já é Aprovador sem área | A recusa só vale quando o pedido muda o papel para Aprovador ou envia `areas`; teste próprio para `ativo` e rebaixar (T1.7) |
| Testes da fase Q presos à promoção direta | Ajustados nas etapas T1-A e T1-D |
| Lista de áreas do formulário cortada ou fora da tela no celular | Largura limitada à tela e conferência no navegador (T2-B) |
| Rota de adicionar aceitar combinação inválida | Mesma `validarAreasDoPerfil` da rota de alterar, com testes por combinação (T2-A) |
| Mensagens diferentes entre front e backend | Textos fixados neste plano e conferidos nos testes de ponta a ponta com a API simulada |
