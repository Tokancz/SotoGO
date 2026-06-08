Pill segmented control for in-page sub-tabs (Výzvy: Denní / Achievementy / Statistiky).

```jsx
const [tab, setTab] = React.useState('daily');
<SegmentedControl
  fullWidth
  value={tab}
  onChange={setTab}
  options={[
    { value: 'daily', label: 'Denní', icon: <i data-lucide="list-checks" /> },
    { value: 'ach', label: 'Achievementy' },
    { value: 'stats', label: 'Statistiky' },
  ]}
/>
```

Props: `options` ({value,label,icon}[]), `value`, `onChange(value)`, `fullWidth`.
