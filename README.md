# Tendra.ai — front-end (MVP)

Implementação em React do protótipo `project/Tendra.ai App.dc.html` (Claude Design). O site institucional e o Workspace ficam numa única página e alternam sem recarregar.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

### Base de conhecimento ligada ao backend

A tela **Base de conhecimento** lê e grava a base no backend local. Em outro terminal, suba o servidor da base (detalhes em [`backend/README.md`](backend/README.md)):

```bash
cd backend
npm install
npm run servidor # http://127.0.0.1:3000, só nesta máquina
```

Com o servidor no ar, "Subir documentos" abre o seletor de arquivos do computador: escolha um ou mais `.md` no formato de [`docs/mvp-resposta-rfp/FORMATO_BASE_MD.md`](docs/mvp-resposta-rfp/FORMATO_BASE_MD.md) (por exemplo, os de `base-sintetica/pulse-beneficios/base/`). A tela mostra o resultado de cada arquivo, inclusive o motivo das recusas. O `npm run dev` repassa `/api` para o servidor (`vite.config.js`). Sem o servidor, a tela avisa e mostra a lista de exemplo.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/ds/` | Design system Tendra.ai: tokens, `styles.css` e componentes (Button, Badge, SidebarNav…). Fonte: `project/_ds` e `project/uploads/…/components`. |
| `src/ds/components/core/AnimatedLogo.jsx` | Logo animado (cronômetro, 6 s) em Tinta, Papel e Limão. Também disponível como custom element `<tendra-logo>` (`tendra-logo-element.js`). Demo: `/logo-animation.html` no `npm run dev`. |
| `src/site/` | Site institucional (Home e Preços). "Produto · Workspace" abre o Dashboard. |
| `src/api.js` | Camada única de chamadas ao backend (hoje, as rotas da base de conhecimento). |
| `src/workspace/data.js` | Dados de exemplo (tarefas, itens e a lista de documentos usada quando o servidor da base está desligado). Fictícios. |
| `src/workspace/useWorkspace.js` | Estado do Workspace e as ações (aprovar, revisar, reconhecer alerta, exportar…). |
| `src/workspace/viewModel.js` | Deriva o que cada tela mostra a partir do estado. |
| `src/workspace/screens/` | Telas: Dashboard, Tarefas, Detalhe, Nova RFP/RFI, Revisão (T6), Exportação, Histórico, Base, Primeiros passos. |
| `src/workspace/overlays.jsx` | Visualizador de fonte (T7), confirmação de edição e toast. |

## Demo

- **Papéis:** o "Painel de demo" no rodapé do menu troca entre Revisor e Aprovador. Só o Aprovador aprova e exporta.
- **Aprovar todos os itens** libera a exportação da tarefa aberta na revisão.
- **Atalhos na Revisão:** `J` próximo item, `K` anterior, `Esc` fecha a fonte.

`HANDOFF.md`, `chats/` e `project/` são o pacote de design original, mantidos como referência.
