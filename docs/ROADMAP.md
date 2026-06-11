# Roadmapa

## Hotovo — hlavní herní smyčka

Celá hlavní smyčka běží end-to-end, frontend i backend jsou nasazené (Pages + Fly.io):

- ✅ Registrace + přihlášení (e-mail/heslo **i Google sign-in**)
- ✅ Mapa + GPS lokalizace (Leaflet, zastávky z PID GTFS)
- ✅ Databáze vozidel (katalog modelů) a zastávek
- ✅ Nahrávání fotografií (S3 / lokální disk)
- ✅ Rozpoznávání vozidel z fotky — **Claude vision** čte evid. číslo a vybírá model z katalogu
- ✅ Vozový park (sbírka per fyzický kus, vzácnost, bojové statistiky)
- ✅ Denní výzvy (deterministické, server-autoritativní)
- ✅ **Gymy** — king-of-the-hill battles na významných stanicích
- ✅ **Žebříček** hráčů
- ✅ **Denní check-in + série (streak)**
- ✅ Instalovatelná **PWA** (zvuky, haptika, hudba, level-up animace)
- ✅ In-app hlášení chyb (→ GitHub Issues)

## Rozpracované / chybí

- ⏳ **Serverové achievementy** — definice + progress běží zatím jen klientsky (seed, počítáno lokálně). Dotáhnout do DB (`achievements` + `user_achievements`) a API, obdobně jako výzvy. Viz [DATA-MODEL.md](DATA-MODEL.md), [BACKEND.md](BACKEND.md).
- ⏳ **Odměny za dokončení vozových sérií** — designem zamýšlené, zatím neimplementované.
- ⏳ **Robustnost** — chybí automatizované testy (vhodné hlavně pro `combat`/`leveling`/`quests`), rate-limiting na `/api/recognize` (placené Claude volání) a anti-spoof validace u GPS návštěv/check-inů.

## Budoucí verze (kandidáti)

- **Rozpoznávání:** doladění promptu/modelu, případně vlastní ML model trénovaný na reálných evidenčních číslech pro vyšší přesnost a nižší náklady.
- **Sociální vrstva:** přátelé, týmy/frakce (gymy by získaly týmový rozměr à la Pokémon GO), prohlížení cizích profilů.
- **Retence:** web push notifikace (gym přebrán, obnova výzev, připomínka série), onboarding tutoriál.
- **Provoz:** monitoring chyb (Sentry), offline cache mapy přes service worker.
- **Rozsah:** další města nad rámec Prahy (rozšíření katalogu a GTFS importu).
