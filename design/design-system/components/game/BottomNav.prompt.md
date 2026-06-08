The app's primary navigation — a fixed bottom bar with four tabs (Mapa · Park · Výzvy · Profil) and a raised green camera FAB in the center, like Pokémon GO. Mount it `position: fixed; bottom: 0` inside the mobile column.

```jsx
<BottomNav
  value={tab} onChange={setTab}
  items={[
    { id: 'mapa',  label: 'Mapa',  icon: <i data-lucide="map"></i> },
    { id: 'park',  label: 'Park',  icon: <i data-lucide="layout-grid"></i> },
    { id: 'kamera', label: 'Kamera', icon: <i data-lucide="camera"></i>, fab: true },
    { id: 'vyzvy', label: 'Výzvy', icon: <i data-lucide="target"></i>, badge: 3 },
    { id: 'profil', label: 'Profil', icon: <i data-lucide="user"></i> },
  ]}
/>
```

The `fab: true` item becomes the elevated center button — keep it the camera/quick-add action. `badge` adds a red count bubble. Requires `lucide.createIcons()` after render.
