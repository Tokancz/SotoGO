Selectable filter chip — the category row in Vozový park / Výzvy. Tints to its category color when selected.

```jsx
<Tag selected color="var(--cat-tram)" icon={<i data-lucide="tram-front" />} count={48}>
  Tramvaje
</Tag>
<Tag color="var(--cat-bus)" count={31}>Autobusy</Tag>
```

Props: `selected`, `color` (selected fill), `icon`, `count`. Renders a `<button>` with `aria-pressed`.
