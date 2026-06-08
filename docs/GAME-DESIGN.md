# Herní design

ŠotoGO mění spotting veřejné dopravy ve sběratelskou hru. Hlavní smyčka:

```
spatříš vozidlo  →  vyfotíš ho  →  OCR přečte evid. číslo  →  ověření v DB
      ↓                                                          ↓
 navštěvuj zastávky  ←  získej XP / level up  ←  přidání do parku  ←  nový objev?
      ↓
 plň denní výzvy a achievementy
```

Herní cíle pro hráče: **objevovat nová vozidla**, **kompletovat vozové série**, **navštěvovat zastávky**, **plnit denní výzvy** a **získávat XP a odznaky**.

---

## 1. Sbírání vozidel

Stěžejní mechanika. Hráč vyfotí vozidlo a systém:

1. z fotografie přečte **evidenční číslo** pomocí OCR,
2. ověří existenci vozidla v databázi,
3. přiřadí vozidlo k hráčovu účtu.

Pokud vozidlo **ještě není** ve sbírce hráče:

```
Nový objev!   (+100 XP)
```

Proces zachycení má tři fáze (viz design `CaptureSheet`): **Zaměření** (hledáček + rámeček) → **Skenování** (animovaná čára, „Čtu evidenční číslo…") → **Odměna** („Nový objev!", ikona kategorie, typ/číslo, např. `15T #9325`, dopravce, `+100 XP`, „Přidat do parku").

---

## 2. Vozový park (sbírka vozidel)

Každý hráč vlastní digitální sbírku nalezených vozidel — herní „Pokédex".

**Kategorie:**

- Tramvaje
- Autobusy
- Metro
- Trolejbusy
- Vlaky

**Každé sebrané vozidlo obsahuje:**

- Typ vozidla
- Evidenční číslo
- Dopravce
- Datum nalezení
- Fotografii (hráčova fotka)

Design dále modeluje **vzácnost** (`common` / `rare` / `epic` / `legendary`), **procento dokončení** sbírky pro každou kategorii („Dokončení sbírky") a **zamčené** siluetové sloty pro dosud nechycená vozidla.

---

## 3. Zastávky

Každá zastávka PID je herní bod. Po návštěvě hráč získá:

- XP
- denní bonus
- progress do achievementů

Zastávky se na mapě zobrazují jako kapkovité piny obarvené podle linky (A zelená · B oranžová · C červená). Vybraná zastávka zobrazuje své linky, název, vzdálenost a buď odznak „Navštíveno", nebo „+XP" odměnu.

---

## 4. Denní výzvy

Systém každý den generuje úkoly. Příklady:

- Navštiv zastávku Florenc
- Najdi tramvaj 15T
- Najdi autobus SOR
- Navštiv 5 nových zastávek

Každá výzva má název, progress (hodnota / max) a odměnu v XP. Denní banner ukazuje odpočet do obnovení a celkové dostupné XP.

---

## 5. Achievementy

Dlouhodobé cíle, odstupňované bronz / stříbro / zlato, se stavem zamčeno/odemčeno a progressem. Příklady:

- **Lovec tramvají** — Najdi 50 tramvají
- **Metro expert** — Najdi všechny typy souprav metra
- **Šotouš roku** — Navštiv 500 zastávek

---

## 6. XP a levely

- Sebrání vozidla dá XP (**+100** v prototypu).
- Návštěva zastávky dá XP při první návštěvě.
- Splnění denních výzev a achievementů dá XP.
- **Level se odvozuje z kumulativního XP** (např. HUD ukazuje `LEVEL 12 / 2480 / 3000 XP`).

---

Viz [DATA-MODEL.md](DATA-MODEL.md) pro mapování mechanik na databázi a [FRONTEND.md](FRONTEND.md) pro obrazovky, které je zobrazují.
