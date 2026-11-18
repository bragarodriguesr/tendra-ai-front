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
- `src/ds/`: cópia do subconjunto do design system Tendra.ai usado pelo deck (tokens, `Logo`, `AnimatedLogo`, `MonoLabel`, `Card`, `Badge`, `Icon`, `IconButton` e os gradientes do Brand Aurora). A origem é `src/ds` do site principal; ao mudar o design system lá, replique aqui.
- `src/demo/`: cópia das demonstrações animadas do site ("O produto em ação", passos 00 a 04), usadas nos slides 05 e 06. Só o cursor foi ajustado à escala do deck.
- `src/stack-icons.js`: marcas da stack do slide 08 (Simple Icons, CC0), desenhadas em tinta.

## Animações por slide

- **01:** o logo animado da capa toca uma vez a cada entrada no slide, no mesmo tamanho do logo estático.
- **02:** cada fonte (e-mail, PDF, proposta, chat, planilha, pessoas) surge e cresce, uma após a outra, ligada à anterior por um conector limão fino com o gradiente em movimento da barra de progresso do site. As fontes flutuam de leve, afastando-se e aproximando-se do centro, e os conectores acompanham. A sequência recomeça a cada 10 s enquanto o slide está na tela.
- **07:** o chip de IA de cada card usa o mesmo gradiente limão em movimento.
- **04 e 09:** "A solução" e "O negócio" são escritos letra a letra e dão lugar ao logo animado, sobre o campo Brand Aurora (limão no 04, tinta no 09).
- **05:** a janela do produto toca o passo 00 (documentos entrando na base).
- **06:** carrossel com os passos 01 a 04; as setas laterais do slide trazem o passo seguinte da direita para a esquerda.
- **15:** a linha do roadmap cresce e cada ponto aparece em seguida, uma vez a cada entrada no slide.
- **16:** fundo Brand Aurora (limão), em movimento lento.
- Com movimento reduzido, tudo aparece parado no estado final. No PDF, os slides 04 e 09 mostram o título.

## Publicação (Vercel)

Projeto `tendra-ai-pitchdeck`, com **Root Directory** = `pitch-deck`. O `vercel.json` desta pasta define o build (Vite, saída em `dist`).
