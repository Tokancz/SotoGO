# Herní design

ŠotoGO mění spotting veřejné dopravy ve sběratelskou hru. Hlavní smyčka:

```
spatříš vozidlo  →  vyfotíš ho  →  rozpoznání čte evid. číslo  →  ověření v DB
      ↓                                                            ↓
 navštěvuj zastávky  ←  získej XP / level up  ←  přidání do parku  ←  nový objev?
      ↓
 plň denní výzvy, bojuj o gymy, šplhej v žebříčku, drž si sérii
```

Herní cíle pro hráče: **objevovat nová vozidla**, **kompletovat vozové série**, **navštěvovat zastávky**, **plnit denní výzvy**, **ovládat gymy**, **šplhat v žebříčku** a **získávat XP a odznaky**.

---

## 1. Sbírání vozidel

Stěžejní mechanika. Hráč vyfotí vozidlo a systém:

1. z fotografie přečte **evidenční číslo** a rozpozná **model** — fotka jde na server, kde ji zpracuje **Claude vision** (forced tool call s `shortName` jako enumem živého katalogu, takže nelze vrátit neexistující model). Když rozpoznávání není nakonfigurované, hráč vybere model ručně. Detail viz [ARCHITECTURE.md](ARCHITECTURE.md).
2. ověří existenci modelu v katalogu,
3. přiřadí vozidlo k hráčovu účtu jako **fyzický kus** (jeden záznam na evidenční číslo — hráč může vlastnit víc kusů stejného modelu), vylosuje jeho **vzácnost** a **bojové statistiky**.

Pokud daný kus **ještě není** ve sbírce hráče:

```
Nový objev!   (+100 XP)
```

Chytí-li hráč evidenční číslo, které už vlastní, vylosuje se nový kandidát a hráč rozhodne, který kus si nechá (server-autoritativní, viz `pending_catches` v [DATA-MODEL.md](DATA-MODEL.md)).

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

## 5. Gymy

Vybrané významné stanice (metro + velké přestupy, příznak `is_gym`) jsou **gymy** — soutěží se o ně systémem **king-of-the-hill**:

- Hráč na gym **nasadí** jeden ze svých kusů jako obránce (jeho HP/Attack vychází z vzácnosti, viz [`combat.ts`](../backend/src/lib/combat.ts)).
- Útočník vede **časovaný tap battle**; server stampuje začátek, takže počet zásahů je odvozen autoritativně, ne věřen klientovi.
- **Výdrž obránce klesá v čase** (jako motivace v Pokémon GO): z plné výdrže k 0 za ~4 dny (`GYM_DECAY_DAYS`), pak je obránce automaticky vyhozen a gym se otevře. Útoky výdrž ubírají navíc, takže o sporný gym se přijde rychleji. Poražené/vyhozené vozidlo se vrací domů uzdravené.
- Porazí-li útočník obránce, gym přebírá; **poraženému majiteli přijde push notifikace**, že o gym přišel.
- Držení gymu se počítá do statistik (`battles_won`, `gym_seconds`) a žebříčku.

## 6. Žebříček

Hráči soupeří v **žebříčku** podle XP a gym metrik (počet ovládnutých gymů a celkový čas držení). Obrazovka `Žebříček` (`ZebricekView`).

## 7. Achievementy

Dlouhodobé cíle, odstupňované bronz / stříbro / zlato, se stavem zamčeno/odemčeno a progressem. Příklady: **Sběratel** (ulov 10 vozidel), **Metro expert** (celé metro), **Neúnavný šotouš** (hraj 30 dní v řadě).

Achievementy jsou **server-autoritativní**: progress se počítá živě z herních dat (chycené kusy, navštívené zastávky, série, dokončení katalogu), odemčení se persistuje natrvalo (`user_achievements`) a každé poprvé udělí **jednorázovou XP odměnu** podle tieru. Definice viz [`achievements.ts`](../backend/src/lib/achievements.ts).

## 8. XP, levely a série

- Sebrání vozidla dá XP (**+100** za nový objev).
- Návštěva zastávky dá XP při první návštěvě.
- Splnění denních výzev dá XP po vyzvednutí.
- **Level se odvozuje z kumulativního XP** (HUD ukazuje např. `LEVEL 12 / 2480 / 3000 XP`); výpočet je server-autoritativní ([`leveling.ts`](../backend/src/lib/leveling.ts)).
- **Denní série (streak):** check-in zvyšuje `streak_count`, dokud hráč nevynechá den.

---

Viz [DATA-MODEL.md](DATA-MODEL.md) pro mapování mechanik na databázi a [FRONTEND.md](FRONTEND.md) pro obrazovky, které je zobrazují.
