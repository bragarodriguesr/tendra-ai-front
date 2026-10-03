Modal. Scrim de tinta a 52%, card com `--shadow-overlay` e entrada de 6px para cima.

```jsx
<Dialog title="Aprovar 12 respostas?" description="A trilha de auditoria registra você como revisor."
  onClose={close} footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button>Aprovar</Button></>} />
```

O elemento se posiciona em `absolute` dentro do ancestral posicionado mais próximo — em telas de UI kit, dê `position: relative` ao contêiner da tela.
