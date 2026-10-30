# Quickstart: validação do sidebar

Guia para a fase de implementação. Os comandos abaixo não foram executados como teste da feature nesta fase documental.

## Pré-requisitos

Node >=24 (necessário ao backend da jornada), npm, dependências frontend/backend e Chromium Playwright. Executar comandos na raiz do repositório.

```bash
npm ci
npm --prefix backend ci
npx playwright install chromium
```

A dependência Base UI e o lockfile devem estar incorporados pela implementação antes de npm ci validar a feature. Não é necessário usar uma chave real de IA para os testes.

## Execução local

```bash
npm run dev -- --host 127.0.0.1
```

Abrir http://127.0.0.1:5173, entrar pelo botão Entrar e depois Entrar no Tendra.ai. Sem backend, conferir os exemplos e painel demo. Com backend disponível, respeitar modo e permissões existentes.

## Verificações automatizadas

Após criar a suíte de sidebar prevista pelo plano:

```bash
npm run build
npm run e2e -- e2e/sidebar.spec.js
npm run e2e -- e2e/jornada.spec.js
```

Playwright usa 5174 e backend 3100 com banco temporário e API simulada. Não definir TENDRA_E2E_API_REAL. Testes de demo devem interceptar API de forma controlada; cenários compartilhados/servidor precisam fixtures representativas de suas condições reais. A suíte dedicada deverá preparar essas condições sem alterar regras da aplicação.

## Cenários e resultados esperados

1. Em 1440×900 e 1280×720, abrir cada um dos sete destinos nos modos expandido/recolhido: seleção correta, contadores iguais aos dados e nenhuma ação perdida (SC-001/006).
2. Recolher/expandir pelo controle e por atalho; confirmar que não troca a tela. Focar e passar mouse nos ícones; dicas legíveis fora da área rolável, sem tooltip duplicado (SC-005).
3. Em 360×640 e 768×1024, abrir pelo trigger, percorrer por Tab/Shift+Tab, fechar por Escape, clique externo e controle; foco retorna ao trigger. Ao selecionar destino, painel fecha e foco vai para main visível (SC-003/005).
4. Cruzar 899/900px com painel aberto: nenhuma camada invisível, scroll lock ou foco oculto remanescente. Desktop conserva a preferência anterior (SC-003/004).
5. Conferir demo expandido e recolhido: Aprovar todos os itens tem efeito atual. Em servidor, ausente. Em compartilhado, aviso sintético aparece expandido. Não confundir modos na evidência (SC-006).
6. Testar contagens zero e com vários dígitos, base vazia e altura reduzida: rótulos legíveis, ícones alinhados, links roláveis, rodapé acessível e sem scroll horizontal (SC-004).
7. Com fontes carregadas, comparar cada estado e rodapé à tabela de tokens em [contrato](contracts/sidebar-ui.md). Ativo mantém filete/fundo; destaque inicial não usa gradiente; controles >=44px (SC-002).
8. Emular prefers-reduced-motion: reduce e repetir toggles; estado muda sem animação e continua identificável. Em campo editável, o atalho não interfere na edição.
9. Percorrer a jornada existente de base, tarefa, revisão e exportação; alertas, usuário, logo e saída continuam funcionais (FR-002/013).

## Evidência de conclusão

Registrar resultados dos comandos, capturas dos três modos, viewports e estados testados e qualquer limitação. Build aprovado não substitui revisão visual nem comprova acessibilidade. Modelo de estado em [data-model.md](data-model.md); requisitos em [spec.md](spec.md).
