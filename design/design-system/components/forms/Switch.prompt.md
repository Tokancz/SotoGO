Settings toggle. Controlled or uncontrolled; brand-green when on.

```jsx
<Switch label="Push notifikace" defaultChecked />
<Switch label="Sdílet polohu" checked={share} onChange={e => setShare(e.target.checked)} />
```

Props: `label`, plus native checkbox attrs (`checked`, `defaultChecked`, `onChange`, `disabled`).
