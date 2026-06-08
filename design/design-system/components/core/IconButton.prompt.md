Icon-only button for toolbars and the floating map HUD; the `night` variant is the blurred glass control used over Leaflet tiles.

```jsx
<IconButton variant="surface" round icon={<i data-lucide="navigation" />} aria-label="Centrovat" />
<IconButton variant="night" icon={<i data-lucide="layers" />} aria-label="Vrstvy" />
<IconButton variant="soft" size="sm" icon={<i data-lucide="x" />} />
```

Variants: `solid` (green glow), `soft` (green tint), `ghost`, `surface` (white card w/ shadow), `night` (glass over map). Sizes `sm`/`md`/`lg`, `round` for circular. Always pass `aria-label`.
