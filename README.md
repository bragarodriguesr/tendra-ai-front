# Tendra.ai — front-end (MVP)

Implementação em React do protótipo `project/Tendra.ai App.dc.html` (Claude Design). O site institucional e o Workspace ficam numa única página e alternam sem recarregar.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/ds/` | Design system Tendra.ai: tokens, `styles.css` e componentes (Button, Badge, SidebarNav…). Fonte: `project/_ds` e `project/uploads/…/components`. |
| `src/ds/components/core/AnimatedLogo.jsx` | Logo animado (cronômetro, 6 s) em Tinta, Papel e Limão. Também disponível como custom element `<tendra-logo>` (`tendra-logo-element.js`). Demo: `/logo-animation.html` no `npm run dev`. |
| `src/site/` | Site institucional (Home e Preços). "Produto · Workspace" abre o Dashboard. |
| `src/workspace/data.js` | Dados de exemplo (tarefas, itens, documentos). Fictícios. |
| `src/workspace/useWorkspace.js` | Estado do Workspace e as ações (aprovar, revisar, reconhecer alerta, exportar…). |
| `src/workspace/viewModel.js` | Deriva o que cada tela mostra a partir do estado. |
| `src/workspace/screens/` | Telas: Dashboard, Tarefas, Detalhe, Nova RFP/RFI, Revisão (T6), Exportação, Histórico, Base, Primeiros passos. |
| `src/workspace/overlays.jsx` | Visualizador de fonte (T7), confirmação de edição e toast. |

## Demo

- **Papéis:** o "Painel de demo" no rodapé do menu troca entre Revisor e Aprovador. Só o Aprovador aprova e exporta.
- **Aprovar todos os itens** libera a exportação da tarefa aberta na revisão.
- **Atalhos na Revisão:** `J` próximo item, `K` anterior, `Esc` fecha a fonte.

`HANDOFF.md`, `chats/` e `project/` são o pacote de design original, mantidos como referência.
