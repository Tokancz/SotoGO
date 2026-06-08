XP bars, daily-quest meters, and achievement progress. Fill animates on value change.

```jsx
<ProgressBar value={2480} max={3000} color="var(--xp)" label="Level 12" showValue valueText="2 480 / 3 000 XP" />
<ProgressBar value={3} max={5} color="var(--cat-tram)" height={8} />
```

Props: `value`, `max`, `color` (use `var(--xp)` for XP), `height`, `label`, `valueText`, `showValue`.
