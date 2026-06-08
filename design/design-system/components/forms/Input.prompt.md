Text field with label, icons, and hint/error states. Use `mono` for the vehicle-search / registration-number input.

```jsx
<Input label="Hledat zastávku" placeholder="Florenc" leadingIcon={<i data-lucide="search" />} />
<Input label="Evidenční číslo" mono placeholder="15T #9325" leadingIcon={<i data-lucide="scan-line" />} />
<Input label="E-mail" error="Neplatný e-mail" />
```

Props: `label`, `hint`, `error`, `leadingIcon`, `trailingIcon`, `mono`, plus native input attrs.
