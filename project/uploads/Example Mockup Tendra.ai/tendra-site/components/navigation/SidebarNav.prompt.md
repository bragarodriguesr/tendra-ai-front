Navegação lateral do workspace. Grupos rotulados em mono; ativo = fundo afundado + filete de 2px à esquerda.

```jsx
<SidebarNav value="editais" header={<Logo size={28} />} groups={[
  { label: "Trabalho", items: [{ value: "editais", label: "Editais", icon: "file-text", count: 12 }] },
  { label: "Conhecimento", items: [{ value: "base", label: "Base", icon: "database" }] }
]} />
```
