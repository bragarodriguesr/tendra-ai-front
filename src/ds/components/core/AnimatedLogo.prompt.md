Logo animado da marca (conceito "Horas, não semanas"): um cronômetro percorre o contorno da caixa enquanto o losango gira; ao completar a volta o ponto central trava, um pulso se expande e o wordmark "Tendra.ai" entra. Ciclo de 6 s.

```jsx
<AnimatedLogo variant="ink" />                 // palco 16:9 em Tinta, loop
<AnimatedLogo variant="paper" once />          // toca uma vez e para no logo completo
<AnimatedLogo variant="lime" bare style={{ width: 320 }} />  // só o logo, sem fundo
```

Use em aberturas, telas de carregamento e vídeos — para o logo estático continue usando `Logo`. `ink` é a variação principal (cronômetro e ".ai" em limão); `paper` usa caixa sálvia e cronômetro tinta; `lime` é tudo em tinta, com ".ai" em `--state-ink`. Respeita `prefers-reduced-motion` (mostra o logo completo, parado) e pausa fora da tela. O ref expõe `play()`, `pause()`, `replay()` e `currentTime`.

Fora do React, importe `tendra-logo-element.js` e use `<tendra-logo variant="ink">` direto no HTML.
