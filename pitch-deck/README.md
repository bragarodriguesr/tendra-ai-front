# Tendra.ai — Pitch Deck

Site separado do site principal, com o pitch deck do Tendra.ai (17 slides, 1920×1080). Tudo o que pertence a ele fica nesta pasta; nada aqui importa de fora dela.

## Rodar

```bash
npm install
npm run dev
```

`npm run build` gera o site estático em `dist/`.

## Navegação

- Setas, espaço, PageUp/PageDown, Home/End; no celular, deslize para os lados.
- `F` alterna tela cheia; `N` mostra as notas do apresentador.
- O número do slide fica no endereço (`/#3`), para compartilhar um slide específico.
- Imprimir (Ctrl/Cmd+P) gera um PDF com um slide por página.

## Estrutura

- `src/slides.jsx`: conteúdo dos slides e a lista `SLIDES` (ordem, campo e notas).
- `src/Deck.jsx`: palco, que escala o slide para a janela e cuida da navegação.
- `src/deck.css`: escala tipográfica do slide, animações e impressão.
- `src/ds/`: cópia do subconjunto do design system Tendra.ai usado pelo deck (tokens, `Logo`, `MonoLabel`, `Card`, `Badge`, `Icon`, `IconButton`). A origem é `src/ds` do site principal; ao mudar o design system lá, replique aqui.

## Publicação (Vercel)

Projeto `tendra-ai-pitchdeck`, com **Root Directory** = `pitch-deck`. O `vercel.json` desta pasta define o build (Vite, saída em `dist`).
