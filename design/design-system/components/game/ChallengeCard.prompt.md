A daily-challenge row for the Výzvy screen and map HUD — colored icon, imperative quest title, gold XP-reward pill, and an inline progress bar that flips to a green "Splněno" state when complete.

```jsx
<ChallengeCard
  title="Navštiv 5 nových zastávek"
  icon={<i data-lucide="map-pin"></i>}
  color="var(--brand)" value={3} max={5} reward={150}
/>
```

States: passing `done` or `value >= max` shows the completed style. Pass `as="button"` with `onClick` to make the row tappable. Color it with the relevant category token (e.g. `var(--cat-tram)` for a "find a tram" quest). Requires `lucide.createIcons()` after render.
