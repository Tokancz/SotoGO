The collectible tile for a caught vehicle in the Vozový park grid — photo, category-colored frame + chip, and the mono evidenční číslo treated like a Pokémon's name. Use it anywhere the player browses their fleet.

```jsx
<VehicleCard
  type="15T" number="9325" operator="DPP"
  category="Tramvaj" categoryColor="var(--cat-tram)"
  categoryIcon={<i data-lucide="tram-front"></i>}
  rarity="rare" found="14. 5. 2026" isNew
  image="vehicle.jpg" onClick={openDetail}
/>
```

States: `isNew` adds the gold "Nový objev!" flag; `locked` renders the desaturated "Zatím neobjeveno" slot; `rarity` adds a colored star. Requires `lucide.createIcons()` to be called after render so the icons resolve.
