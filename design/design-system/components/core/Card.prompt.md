Generic surface container. `raised` (shadow) by default; `night` for dark HUD panels over the Leaflet map; `accentColor` draws a category/rarity frame.

```jsx
<Card padding="lg" interactive>…</Card>
<Card variant="night" padding="md">Denní výzva</Card>
<Card accentColor="var(--rarity-epic)" padding="sm">…</Card>
```

Props: `padding` none/sm/md/lg, `variant` raised/bordered/flat/night, `interactive`, `accentColor`, `as`.
