Lockup oficial da marca — use sempre este componente em vez de colar o SVG.

```jsx
<Logo variant="paper" size={32} />
<Logo variant="ink" lockup="symbol" size={44} />
<Logo lockup="appicon" size={48} />
```

`variant="paper"` (moldura sálvia, losango tinta) é o padrão sobre papel e branco; `ink` sobre Tinta Profunda, com o losango em limão; `mono-ink`/`mono-paper` para uma cor só. `lockup="appicon"` é o campo chapado com raio 12u — abaixo de 24px prefira o PNG `favicon-16`, que suprime o losango.
