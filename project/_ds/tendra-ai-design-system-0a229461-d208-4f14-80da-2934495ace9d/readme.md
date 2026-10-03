# Tendra.ai — Design System

Sistema de design da **Tendra.ai**, plataforma B2B SaaS de automação de RFPs e licitações. O produto lê editais, cruza com a base de conhecimento aprovada do cliente e gera respostas completas — com a fonte de cada afirmação rastreável até o documento de origem e revisão humana obrigatória antes do envio.

Público: times de RevOps, pré-vendas, segurança da informação e jurídico em empresas Enterprise brasileiras. Contexto de compra: questionário de fornecedor, due diligence, pregão.

## Fontes deste sistema

Este projeto foi importado da pasta local `tendra-design-system/` (codebase anexada, somente leitura) mais os uploads de logo, ícones e tokens CSS (idênticos aos da pasta). Não há Figma. A pasta, por sua vez, foi derivada destes materiais de marca (não presentes aqui):

| Fonte | Arquivo |
| --- | --- |
| Guia de marca (paleta, tipografia, construção do símbolo, uso correto) | `Tendra.ai Brand Guide.dc.html` |
| Deck de marca, 13 slides | `Tendra.ai Brand Deck.dc.html` |
| Explorações de logotipo | `Tendra.ai Logo Options.dc.html` |
| Explorações de cor (a paleta vigente é a opção **2d**) | `Tendra.ai Color Options.dc.html` |
| Pacote de logo em vetor e PNG | `Tendra.ai Logo SVG Pack.dc.html`, `svg-2d/`, `png-2d/` |

> **Substituições declaradas.** (1) As três fontes são open source e carregadas do Google Fonts — não há binário proprietário; para produção offline, baixe os `.woff2` e troque o `src` em `tokens/fonts.css`. (2) A marca não tinha conjunto de ícones próprio: usamos **Lucide** (ISC, traço 2px, geometria alinhada ao símbolo), copiado para `assets/icons/`.

---

## CONTENT FUNDAMENTALS

**Voz.** Especialista que já viu o problema, não vendedor. A frase afirma e para — sem hedge, sem superlativo. O produto nunca se descreve como "revolucionário" ou "poderoso"; ele diz o que faz e em quanto tempo.

**Pessoa.** "Você" para o cliente, "a Tendra.ai" ou "a plataforma" para o produto. Nunca "nós achamos". Nunca a IA em primeira pessoa.

**Números no lugar de adjetivos.** "Responda em horas, não semanas" em vez de "muito mais rápido". "83% de reaproveitamento" em vez de "alta eficiência". Todo número no material tem origem verificável.

**Estrutura da frase de marca.** Promessa + contraste: *"Responda a um RFP em horas, não semanas."* · *"Preço por revisor, não por resposta."* · *"Três passos, nenhuma resposta sem fonte."* O contraste carrega a objeção do comprador.

**Rastreabilidade é assunto de copy, não só de UI.** Onde houver afirmação gerada, o texto ao lado diz de onde ela veio. "Fonte: Security_Whitepaper_v4.pdf · p.12" é copy da marca tanto quanto o título.

**Caixa.** Sentence case em títulos e botões ("Aprovar resposta", não "Aprovar Resposta"). Caixa alta **somente** em mono: eyebrow de seção, selo de estado, rótulo técnico. O nome é sempre **Tendra.ai** — nunca "TENDRA AI", "Tendra IA" ou o nome em caixa alta.

**Botões.** Verbo + objeto: "Aprovar resposta", "Importar edital", "Baixar whitepaper". Nunca "Clique aqui", "Saiba mais" ou "Enviar" sozinho.

**Erro e estado vazio.** Diga o que aconteceu e o que fazer, sem culpa e sem desculpa: *"2 requisitos sem fonte — revisão manual obrigatória."* · *"Nenhum edital importado. Suba o PDF ou conecte o portal do cliente."*

**Português do Brasil**, com o vocabulário real do setor: edital, requisito, pregão, dispensa, revisor, trilha de auditoria, sub-processador. Termos técnicos consagrados ficam em inglês (SSO, SCIM, HSM, perfect forward secrecy) — traduzir soaria amador para o comprador de segurança.

**Emoji: nunca.** Em nenhuma superfície, incluindo social e e-mail.

---

## VISUAL FOUNDATIONS

### Cor
Quatro cores, papel (`#F5F6F1`) e sálvia (`#6E7268`) como base, tinta (`#12140F`) e limão (`#C8F73D`) como acento e destaque. Proporção **60 papel · 30 sálvia · 10 limão**, com tinta entrando por cima como tipografia e ação.

A **regra do limão** é a regra mais importante do sistema: limão é *preenchimento*, nunca *texto*. Marcador atrás de uma palavra, fundo de selo, barra de progresso, check de checkbox. Em fundo claro ele tem 1.3:1 — texto limão é ilegível e está proibido. A única superfície onde o limão pode ser cor de texto é campo tinta (`approved-inverse`, `--text-accent-on-inverse`).

Estado em texto usa **Sálvia Estado** (`#4B5046`), não limão. Erro usa `--danger` (`#A8402E`), reservado a destrutivo e à coluna "Não faça".

Neutros são verde-oliva dessaturados, nunca cinza puro — o papel puxa para o verde e um cinza neutro ao lado dele parece sujo.

### Tipografia
Três famílias com papéis que não se sobrepõem:
- **Space Grotesk** (500/600/700) — títulos e números. Tracking fecha conforme o corpo cresce: −3.5% em 56px, −2% em 24px. Nunca em corpo de texto.
- **IBM Plex Sans** (400/500/600) — corpo, UI e documentos longos. Body 17/1.65, medida máxima 66ch.
- **IBM Plex Mono** (400/500) — a voz "sistema": eyebrow de seção em caixa alta com +10% de tracking, ID de requisito, trilha de fonte, contador. Se o texto é um dado do sistema e não uma frase humana, ele é mono.

### Layout e espaçamento
Grid de 8px (4px só para ajuste óptico dentro de chips). Largura de página 1160px, padding 40px, 72px entre seções, 20px entre cards, 24px dentro de um card. Swiss grid, alinhamento à esquerda, sem centralização — exceto o hero de preços, onde a simetria é a mensagem.

### Superfícies, bordas e sombra
**A marca é construída com borda, não com sombra.** Card = branco + 1px `#E3E6DC` + raio 14–16px, plano. Sombra existe apenas para o que flutua de fato: dialog, dropdown, tooltip, toast (`--shadow-overlay`, `--shadow-popover`). Não há gradiente em nenhuma superfície da marca. Não há card com borda colorida só à esquerda; a faixa de acento, quando existe, é de 3px **no topo** (cards Faça / Não faça).

### Fundos e imagem
Sem fotografia na identidade atual e **sem ilustração** — a marca não tem uma, e não se deve inventar. O papel do "visual" é feito por: campo tinta chapado, o símbolo em escala grande, cards de produto reais e o ícone em moldura de 56px nos estados vazios. Quando imagem real entrar, a direção é: luz fria, baixa saturação, grão leve, sem pessoas posando.

### Raios
6 chip · 8 input · 9 botão · 12 painel e app icon (12u de 48u) · 14 card de conteúdo · 16 card de produto · 18 aplicação e banner · 99 pill (tag e trilha de progresso).

### Movimento
Curto e decidido, **sem bounce e sem escala em hover**. 140ms para hover e foco; 220ms para entrada de camada (`tdr-rise`: 6px para cima + fade); 420ms para transição de tela; 1600ms para a barra de cobertura preencher. Easing padrão `cubic-bezier(.2,.8,.2,1)`.

### Estados
- **Hover**: troca de cor de fundo ou de borda — primário escurece para `--ink-700`, secundário escurece a borda, ghost ganha fundo afundado. Nunca opacidade, nunca escala.
- **Press**: nenhum efeito próprio; a resposta é imediata na ação.
- **Foco**: borda sálvia + halo sálvia de 3px (`rgba(110,114,104,.18)`). Nunca o azul do navegador.
- **Ativo em navegação**: sublinhado de 2px (abas) ou filete de 2px à esquerda + fundo afundado (lateral) — nunca pílula preenchida.
- **Desabilitado**: 42% de opacidade + `not-allowed`.

### Transparência e blur
Praticamente ausente. Só dois usos: `--lime-wash` (limão a 16%) como fundo de selo aprovado e `--paper-wash` (branco a 8%) como fundo de chip em campo tinta. **Sem backdrop-blur** em nenhuma superfície — a marca é opaca.

### Acessibilidade
Corpo em N-700 sobre papel = 9.1:1. Meta em N-400 = 4.9:1 (é o tom mais claro permitido em texto). Alvo de toque mínimo 44px (`--hit-min`). Contraste mínimo 4.5:1 em texto; nenhum texto vive sobre limão exceto tinta sólida.

---

## ICONOGRAPHY

A marca **não tinha** conjunto de ícones próprio. Adotamos **Lucide** (licença ISC): traço 2px, cantos arredondados, geometria de 24px — a escolha mais próxima do símbolo, que também é feito de traço uniforme. 51 glifos foram copiados para `assets/icons/` e embutidos em `components/core/icon-paths.js`; o componente `Icon` os renderiza inline herdando `currentColor`.

Regras:
- Tamanhos: 14 (dentro de badge), 16 (padrão em botões e listas), 20 (nav e cabeçalhos), 24 (estado vazio).
- Traço **sempre 2px**. Para dar destaque, aumente o tamanho — nunca a espessura.
- **Nunca desenhe um ícone à mão.** Se o glifo não existe, adicione o SVG do Lucide em `assets/icons/` e regenere `icon-paths.js`.
- **Nunca use emoji como ícone**, nem caracteres unicode (✓, ✕, →) em UI — a exceção é o material impresso de marca, onde ✓/✕ aparecem nas listas Faça / Não faça do guia.
- O símbolo da marca não é um ícone de UI: ele só aparece via `Logo`.

O logo existe em vetor (`assets/logo/`, quatro lockups + quatro app icons) e em PNG de alta resolução (`assets/logo/png/`). Favicons em `assets/favicon/` — o de 16px suprime o losango interno, que não sobrevive ao pixel.

---

## Índice

| Caminho | O que é |
| --- | --- |
| `styles.css` | Entrada de CSS global — só `@import`. Consumidores linkam **este** arquivo. |
| `tokens/` | `fonts` · `colors` · `typography` · `spacing` · `radii` · `elevation` · `motion` |
| `components/core/` | Button, IconButton, Badge, Tag, Card, Divider, ProgressBar, Logo, Icon, MonoLabel |
| `components/forms/` | Field, Input, Textarea, Select, Checkbox, Radio, Switch |
| `components/navigation/` | Tabs, Breadcrumb, SidebarNav, TopBar |
| `components/feedback/` | Dialog, Toast, Tooltip, EmptyState, SourceTrail |
| `guidelines/` | 20 cards de especímen (Colors, Type, Spacing, Brand) |
| `ui_kits/workspace/` | Produto: lista de editais, revisão de requisito, base de respostas, ajustes |
| `ui_kits/website/` | Site institucional: home, segurança, preços |
| `slides/` | Seis tipos de slide a 1280×720 |
| `assets/logo/`, `assets/favicon/`, `assets/icons/` | Marca e iconografia |
| `SKILL.md` | Manifesto para uso como Agent Skill |

### Adições intencionais ao conjunto padrão
- **`SourceTrail`** (feedback) — a rastreabilidade até o documento de origem é a promessa central do produto e aparece em toda resposta gerada; deixá-la como composição solta garantiria inconsistência.
- **`MonoLabel`** (core) — a "voz sistema" em mono tem regras próprias de tracking e caixa em dois tamanhos; sem componente, cada tela reinventaria os valores.
- **`Icon`** (core) — invólucro do conjunto Lucide adotado, para que ninguém cole SVG solto.

### Como consumir

```html
<link rel="stylesheet" href="styles.css" />
```

Depois use os tokens diretamente (`var(--brand-ink)`, `var(--space-6)`) e monte a interface com os componentes. Nenhum componente depende de npm: só React e as custom properties.
