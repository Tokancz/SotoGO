Pressable game-style button — the primary action control across ŠotoGO; use `reward` (gold) for XP/claim moments only.

```jsx
<Button variant="primary" leadingIcon={<i data-lucide="camera" />}>
  Vyfotit vozidlo
</Button>

<Button variant="reward" size="lg">Vyzvednout +100 XP</Button>
<Button variant="secondary">Zrušit</Button>
<Button variant="ghost" size="sm">Více</Button>
```

Variants: `primary` (green, 3D), `reward` (gold, 3D — earned actions only, never a generic CTA), `secondary` (white + border), `ghost` (transparent), `danger`. Sizes `sm` / `md` / `lg`. Props: `fullWidth`, `leadingIcon`, `trailingIcon`, `as="a"`. After rendering Lucide `<i>` icons, call `lucide.createIcons()`.
