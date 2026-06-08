# Roadmapa

## MVP — v1.0

První verze přináší celou hlavní herní smyčku od začátku do konce:

- ✅ Registrace
- ✅ Přihlášení
- ✅ Mapa
- ✅ GPS lokalizace
- ✅ Databáze vozidel
- ✅ Databáze zastávek
- ✅ Nahrávání fotografií
- ✅ OCR evidenčních čísel
- ✅ Vozový park (sbírka)
- ✅ Achievementy
- ✅ Denní výzvy

> Jde o **plánovaný** obsah v1.0. Aktuální stav implementace: frontend je výchozí Vue scaffold, backend zatím neexistuje. Viz [FRONTEND.md](FRONTEND.md) a [BACKEND.md](BACKEND.md).

## Budoucí verze

- **OCR:** nahradit Tesseract.js **vlastním ML modelem** trénovaným na reálných evidenčních číslech vozidel pro lepší přesnost.
- Další herní prvky: odměny za dokončení vozových sérií, bohatší úrovně achievementů, sociální/žebříčkové funkce (kandidáti — nezávazné).

## Navržené pořadí vývoje

Pragmatická posloupnost k dosažení smyčky v1.0:

1. **Základy** — úklid repozitáře ([FOLDER-STRUCTURE.md](FOLDER-STRUCTURE.md)), instalace frontend závislostí (Router, Pinia, SCSS, Axios, Leaflet), scaffold backendu.
2. **Autentizace** — tabulka `users`, registrace/přihlášení, JWT, napojení Login obrazovky na reálnou autentizaci.
3. **Mapa + zastávky** — katalog zastávek + seed, Leaflet mapa, geolokace, návštěvy zastávek udělující XP.
4. **Zachycení + OCR** — proces kamery, upload fotky, OCR endpoint, porovnání s katalogem vozidel, objev + XP.
5. **Vozový park** — mřížka sbírky, kategorie, vzácnost, procento dokončení, zamčené sloty.
6. **Výzvy a achievementy** — denní generování, progress pro jednotlivé hráče, vyhodnocování achievementů.
7. **Profil a doladění** — statistiky, kruh levelu, série, sjednocení s design systémem.
