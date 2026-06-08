Circular ring that shows a player's level in the center with XP progress sweeping around it — use in the profile header, level-up moments, and stat HUDs.

```jsx
<LevelRing level={12} value={2480} max={3000} size={104} label="Level" subText="2480/3000" />
```

Variants: `color` defaults to gold (`--xp`) — pass `var(--brand)` for non-reward rings. Scale everything with `size`; `stroke` controls thickness. Pair with a `+XP` Badge for level-up screens.
