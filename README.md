# Tendra.ai — front-end (MVP)

Implementação em React do protótipo `project/Tendra.ai App.dc.html` (Claude Design). O site institucional e o Workspace ficam numa única página e alternam sem recarregar.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run e2e      # jornada de ponta a ponta no navegador (sobe backend e front sozinho)
```

### Workspace ligado ao backend

O Workspace lê e grava no backend local: base de conhecimento, tarefas, itens e as ações da revisão. Em outro terminal, suba o servidor da base (detalhes em [`backend/README.md`](backend/README.md)):

```bash
cd backend
npm install
npm run servidor # http://127.0.0.1:3000, só nesta máquina; exige ANTHROPIC_API_KEY
# sem a chave (até a A1): TENDRA_API_SIMULADA=1 npm run servidor, com respostas simuladas
```

Com o servidor no ar, "Subir documentos" abre o seletor de arquivos do computador: escolha um ou mais `.md` no formato de [`docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`](docs/mvp-resposta-rfp/FORMATO_BASE_MD.md) (por exemplo, os de `base-sintetica/pulse-beneficios/base/`). A tela mostra o resultado de cada arquivo, inclusive o motivo das recusas. O `npm run dev` repassa `/api` para o servidor (`vite.config.js`). Sem o servidor, a tela avisa e mostra a lista de exemplo.

Com a base carregada, **Nova RFP/RFI** envia a planilha `.xlsx` escolhida no computador (por exemplo, `base-sintetica/rfps/RFP-01-Rede-Varejo-Alfa.xlsx`). A tarefa processa em segundo plano e a tela mostra o progresso. Ao terminar, os itens entram na **Revisão** e a planilha preenchida pode ser baixada. Editar, restaurar, aprovar e avaliar ficam gravados no banco em nome da pessoa escolhida em "Trocar usuário": Aprovador é Marcelo Vieira, Revisor é Kadu Mendes (`backend/config/pessoas.json`). Reconhecer alerta, escolher fonte e marcar como revisado ficam só na tela. Sem o servidor, tarefas e itens são os exemplos fictícios de `src/workspace/data.js`.

### Teste de ponta a ponta

`npm run e2e` roda `e2e/jornada.spec.js` com o Playwright e é o portão da fase C (`docs/mvp-resposta-rfp/PLAN.md`). O comando sobe sozinho dois servidores:
- o backend na porta 3100, com a API simulada e um banco novo numa pasta temporária, sem ler `backend/.env`;
- o front na porta 5174.

O teste percorre toda a jornada:
1. envia a base sintética pela tela;
2. cria a tarefa com a RFP-01;
3. acompanha o progresso e baixa a planilha preenchida;
4. edita, aprova e avalia um item;
5. recarrega a página e confere que as ações continuam lá;
6. compara com o relatório de aceitação.

Para refazer a jornada com a API real, rode `TENDRA_E2E_API_REAL=1 npm run e2e`: o backend lê a chave de `backend/.env` e não usa a API simulada. Tem custo (cerca de US$ 0,25 por execução) e não roda no CI.

Na primeira vez, rode `npm ci` também em `backend/` e `npx playwright install chromium`. No CI, o job "Build e jornada de ponta a ponta" (`.github/workflows/front.yml`) roda o mesmo teste em todo PR. **Depois da A1, refazer a jornada com a API real.**

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/ds/` | Design system Tendra.ai: tokens, `styles.css` e componentes (Button, Badge, SidebarNav…). Fonte: `project/_ds` e `project/uploads/…/components`. |
| `src/ds/components/core/AnimatedLogo.jsx` | Logo animado (cronômetro, 6 s) em Tinta, Papel e Limão. Também disponível como custom element `<tendra-logo>` (`tendra-logo-element.js`). Demo: `/logo-animation.html` no `npm run dev`. |
| `src/site/` | Site institucional (Home e Preços). "Produto · Workspace" abre o Dashboard. |
| `src/api.js` | Camada única de chamadas ao backend: base de conhecimento, tarefas e revisão. |
| `src/workspace/data.js` | Dados de exemplo (tarefas, itens e documentos), usados quando o servidor está desligado. Fictícios. |
| `e2e/` | Teste de ponta a ponta da jornada (Playwright) e o script que sobe o backend para ele. |
| `src/workspace/useWorkspace.js` | Estado do Workspace e as ações (aprovar, revisar, reconhecer alerta, exportar…). |
| `src/workspace/viewModel.js` | Deriva o que cada tela mostra a partir do estado. |
| `src/workspace/screens/` | Telas: Dashboard, Tarefas, Detalhe, Nova RFP/RFI, Revisão (T6), Exportação, Histórico, Base, Primeiros passos. |
| `src/workspace/overlays.jsx` | Visualizador de fonte (T7), confirmação de edição e toast. |

## Demo

- **Papéis:** "Trocar usuário", no menu do nome, alterna entre Revisor e Aprovador. Só o Aprovador aprova e exporta.
- **Aprovar todos os itens** (painel de demo, só sem o servidor) libera a exportação da tarefa aberta na revisão.
- **Atalhos na Revisão:** `J` próximo item, `K` anterior, `Esc` fecha a fonte.

`HANDOFF.md`, `chats/` e `project/` são o pacote de design original, mantidos como referência.
