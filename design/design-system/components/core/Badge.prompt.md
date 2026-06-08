Status / label pill. Token tones for generic states; pass `color` for vehicle-category, rarity, or metro-line tints.

```jsx
<Badge tone="gold" mono>+100 XP</Badge>
<Badge color="var(--cat-tram)" icon={<i data-lucide="tram-front" />}>Tramvaj</Badge>
<Badge color="var(--rarity-legendary)" variant="solid">Legendární</Badge>
<Badge tone="success" dot>Online</Badge>
```

Variants `soft` / `solid` / `outline`; sizes `sm` / `md`. `mono` switches to tabular JetBrains Mono for codes and XP. `dot` adds a status dot; `icon` for a leading glyph.
