---
feature: alterar-exibicao-area-na-revisao
status: approved
constitution: 1.0.0
---

# Exibição da área e das etiquetas do item na Revisão

## Contexto

- **Fluxo/local afetado:** cabeçalho do item na tela de Revisão (`src/workspace/screens/Review.jsx`). Ali aparecem a área da pergunta (fase N, cenário N10) e as etiquetas "Editado" e "Resposta manual".
- **Comportamento atual:**
  - **Área da pergunta:**
    - O Revisor, e o Aprovador que não pode trocar a área, veem o ícone de prédio com o nome da área (por exemplo, "Jurídico").
    - O Aprovador que pode trocar a área vê só a lista suspensa "Área da pergunta", sempre aberta para edição. Ele não vê a área como os demais.
  - **Etiquetas do item:**
    - O item com a resposta alterada em relação à sugestão mostra a etiqueta "Editado" com o ícone de lápis.
    - O item com resposta escrita à mão mostra a etiqueta "Resposta manual", também com o lápis.
    - Abaixo da resposta, a linha "Resposta manual, sem fonte na base · escrita por …" usa o lápis.
- **Comportamento esperado:**
  - **Área da pergunta:**
    - Todos veem a área da mesma forma que o Revisor.
    - Quem pode trocar a área ganha, ao lado dela, o botão "Alterar área" com o ícone de lápis. O clique no botão abre a lista com as áreas.
    - A lista segue o padrão do "Painel de Usuários" (fase Q, cenário Q6): aberta por cima da etiqueta.
  - **Etiquetas do item:**
    - O lápis passa a indicar só uma ação: trocar a área.
    - Por isso, "Editado" passa a usar o ícone `history`, e a resposta manual passa a usar `file-text`.
    - Assim, o cabeçalho não mostra lápis com sentidos diferentes.
- **Regras que esta fase mantém** (fase N, `SPEC_FASE_N.md`):
  - **PN4:** cada pergunta tem uma área: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico ou Geral. C-Level não é área de pergunta.
  - **PN7:** quem pode trocar a área de uma pergunta:
    - o Aprovador daquela área;
    - o Aprovador C-Level;
    - qualquer Aprovador, quando a pergunta é "Geral".
    - Em todos os casos, só enquanto o item não está aprovado e a tarefa não está só para leitura.
  - **N10:** a troca registra o evento `area` no Histórico. A API recusa com 403 quem não pode trocar e com 409 o item já aprovado.
- **Padrão do design system:**
  - botão "Alterar área" com o ícone de lápis (`Button variant="secondary"`, `size="sm"`), com o contorno cinza dos botões secundários da tela, como "Editar resposta". Com o mouse por cima, o fundo fica preto (`--action-primary-bg`) e o texto claro (`--action-primary-fg`), um ajuste só deste botão. Escolhido em 08/11/2026 (proposta A), no lugar do lápis sozinho; o texto dispensa a dica;
  - lista no padrão do menu do `FilterMenu` (`--surface-card`, `--border-default`, `--radius-lg` e `--shadow-popover`), como no "Painel de Usuários";
  - ícones `history` e `file-text`, que já existem no design system.
  - Sem cores, fontes, ícones nem componentes novos.
- **Como reproduzir o comportamento atual:**
  1. Entre como um Aprovador da área de uma pergunta ainda não aprovada. No modo local, escolha-o em "Trocar usuário".
  2. Abra a tarefa na Revisão e selecione essa pergunta. No cabeçalho do item aparece só a lista suspensa, sem o nome da área no formato do Revisor.
  3. Edite a resposta de um item. A etiqueta "Editado" aparece com o lápis.
  4. Selecione um item com resposta manual (no modo local, o item do seguro cibernético). A etiqueta "Resposta manual" aparece com o lápis.

## Dependências de infraestrutura

Verificação feita em 08/11/2026, no código.

- **Nenhuma.** A troca de área continua pela rota que já existe, `PUT /api/tarefas/:id/itens/:numero/area` (fase N). No modo local, continua no navegador.
- A mudança é só na tela. As regras, a API e o banco ficam como estão.

## Acceptance Criteria

### Cenário S1: mesma exibição da área para todos
- **Given** uma pergunta aberta na Revisão
- **When** o Revisor ou qualquer Aprovador vê o cabeçalho do item
- **Then** a área aparece da mesma forma para todos: o ícone de prédio e o nome da área, como hoje para o Revisor
- **And** a lista suspensa "Área da pergunta" sempre visível deixa de existir

### Cenário S2: botão "Alterar área" só para quem pode trocar a área
- **Given** uma pergunta aberta na Revisão
- **When** a pessoa pode trocar a área dela (PN7)
- **Then** o botão "Alterar área", com o ícone de lápis e o contorno cinza, aparece ao lado do nome da área
- **And** com o mouse por cima, o botão fica com o fundo preto
- **And** não há o botão para:
  - o Revisor;
  - o Aprovador de outra área;
  - o item já aprovado;
  - a tarefa só para leitura.

### Cenário S3: abrir a lista
- **Given** o botão "Alterar área" ao lado da área
- **When** a pessoa clica nele
- **Then** a lista abre por cima da área, como no "Painel de Usuários"
- **And** a lista mostra as seis áreas de pergunta (PN4), na ordem de hoje, com a área atual marcada
- **And** a lista fecha com um clique fora dela ou com Esc, sem trocar a área, e o foco volta ao botão

### Cenário S4: trocar a área
- **Given** a lista aberta
- **When** a pessoa escolhe outra área
- **Then** a lista fecha e a pergunta passa para a área escolhida
- **And** aparece o aviso "Área alterada" ("A pergunta passou para X."), e o Histórico registra o evento `area`, como hoje (N10)
- **And** se a pessoa deixa de poder aprovar a pergunta na nova área, o botão some e a aprovação fica bloqueada, como hoje
- **And** escolher a área atual só fecha a lista
- **And** enquanto a troca é gravada, a lista não aceita outra escolha
- **And** se a gravação falha, a área anterior continua e o aviso mostra o motivo (por exemplo, a recusa 403 ou 409)

### Cenário S5: teclado e leitores de tela
- **Given** a pergunta aberta na Revisão
- **When** a pessoa usa só o teclado
- **Then** ela chega ao botão "Alterar área" com Tab e abre a lista com Enter ou Espaço
- **And** ela percorre as áreas com as setas e escolhe com Enter
- **And** o botão informa se a lista está aberta (`aria-expanded`)
- **And** a lista tem o nome "Área da pergunta"

### Cenário S6: celular
- **Given** a Revisão aberta numa tela de celular
- **When** a pessoa abre a lista de áreas
- **Then** a lista cabe na tela, sem rolagem lateral da página

### Cenário S7: ícone da etiqueta "Editado"
- **Given** um item cuja resposta foi alterada em relação à sugestão
- **When** a pessoa vê o cabeçalho do item na Revisão
- **Then** a etiqueta "Editado" usa o ícone `history` no lugar do lápis, com o mesmo texto e o mesmo tom (neutro)

### Cenário S8: ícone da resposta manual
- **Given** um item com resposta manual aberto na Revisão
- **When** a pessoa vê o item
- **Then** a etiqueta "Resposta manual" do cabeçalho usa o ícone `file-text` no lugar do lápis, com o mesmo texto e o mesmo tom
- **And** a linha "Resposta manual, sem fonte na base · escrita por …", abaixo da resposta, usa o mesmo ícone
- **And** a definição do alerta "Resposta manual sem fonte" (`src/workspace/data.js`) também passa a usar `file-text`, para que o ícone seja o mesmo em toda a tela

### Cenário S9: lápis com um só sentido
- **Given** um item aberto na Revisão, editado, com resposta manual, ou ambos
- **When** a pessoa vê o cabeçalho do item
- **Then** o lápis aparece só no botão "Alterar área" (S2), e nunca como ícone de etiqueta

## Fora de escopo

- A área na lista de perguntas da Revisão e na coluna de detalhes. Ficam como estão.
- As regras de quem pode trocar a área (PN7), a rota da API e o backend.
- Mais de uma área por pergunta.
- O texto, o tom e as regras das etiquetas "Editado" e "Resposta manual". A resposta manual continua sem bloquear a revisão e a aprovação.
- A exportação: o arquivo continua com "Resposta manual, sem fonte na base".
- Os botões "Editar resposta" e "Nenhuma, vou escrever". Eles são ações, ficam fora do cabeçalho do item e continuam com o lápis.
- O "Painel de Usuários" (fase Q).
- Componentes, cores, fontes ou ícones novos no design system.

## Apêndice: lápis das áreas no Painel de Usuários (08/11/2026)

Pedido depois da validação manual da Revisão: o mesmo realce do botão "Alterar área" no lápis que abre a lista de áreas do "Painel de Usuários" (fase Q, cenário Q6), sem texto. Só front; não muda as regras, a lista nem as rotas da fase Q.

### Cenário SA1: lápis das áreas com contorno e realce
- **Given** o "Painel de Usuários" aberto por um Aprovador
- **When** uma linha mostra o lápis "Editar áreas" (Aprovador ativo, Q6)
- **Then** o lápis tem o contorno cinza dos botões secundários da tela, sem texto, e mantém a dica "Editar áreas"
- **And** com o mouse por cima, o fundo fica preto e o ícone claro, como o botão "Alterar área" da Revisão
- **And** ao tirar o mouse, volta ao contorno cinza
- **And** o clique continua abrindo a lista de áreas, como hoje (Q6)
