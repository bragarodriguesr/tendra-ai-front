Navegação lateral do workspace. Grupos rotulados em mono; ativo = fundo afundado + filete de 2px à esquerda.

```jsx
<SidebarNav value="editais" header={<Logo size={28} />} groups={[
  { label: "Trabalho", items: [{ value: "editais", label: "Editais", icon: "file-text", count: 12 }] },
  { label: "Conhecimento", items: [{ value: "base", label: "Base", icon: "database" }] }
]} />
```

A implementação compõe as primitivas do Sidebar Base UI adaptadas em `Sidebar.jsx`, com aparência em `Sidebar.css`. `SidebarNav` continua utilizável isolado, preserva groups/value/tone/header/footer/width/collapsed/style e atributos HTML. `width` aceita número ou string. No modo recolhido, nomes acessíveis incluem as contagens e as dicas aparecem em portal por hover/foco.
