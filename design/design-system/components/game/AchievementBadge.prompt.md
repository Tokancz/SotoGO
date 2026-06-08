A circular achievement medal for the Achievementy grid — rarity-tinted frame, a Lucide glyph when earned, and a padlock + progress count when still locked.

```jsx
<AchievementBadge
  title="Lovec tramvají" description="Najdi 50 tramvají"
  icon={<i data-lucide="tram-front"></i>}
  tier="epic" unlocked
/>
<AchievementBadge title="Šotouš roku" description="Navštiv 500 zastávek"
  tier="legendary" value={342} max={500} />
```

States: `unlocked` swaps the padlock for the icon and adds a green check; when locked, passing `value`/`max` shows a progress bubble. `tier` picks the color from the rarity scale. Requires `lucide.createIcons()` after render.
