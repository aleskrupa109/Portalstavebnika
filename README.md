# Portál stavebníka — maketa

Klikací prototyp Portálu stavebníka (Portál stavební správy) pro návrh a testování obrazovek a procesů — přihlášení, volba postavení, REZA (plné moci a pověření) a podání žádosti. Neběží proti žádnému reálnému systému; veškerá data jsou simulována a ukládána pouze v prohlížeči (localStorage).

## Struktura projektu

```
Portalstavebnika/
├── index.html                  # Přihlašovací stránka (klon Portálu stavební správy)
├── images/
│   ├── landing-bg.jpg          # Pozadí úvodní stránky
│   ├── logo-lev.png            # Státní znak (barevný)
│   └── logo-lev-white.png      # Státní znak (bílý, do hlavičky)
├── js/
│   ├── app-state.js            # Centrální stav (uživatel, identity, plné moci, záměry) — localStorage
│   ├── header-helper.js        # Kontrola přihlášení, naplnění hlavičky, user menu, odhlášení
│   └── demo-helper.js          # Nápověda k prototypu (FAB, anotace, panel „O prototypu", reset dat)
└── pages/
    ├── reza_implicitni.html    # Výběr postavení po přihlášení (FO / OSVČ / firmy)
    ├── prehled_zameru.html     # Přehled záměrů
    ├── reza_setup.html         # Rozcestník REZA (plné moci a zastoupení)
    ├── reza_new.html           # Vytvoření plné moci / pověření (zmocnitel)
    ├── reza_request.html       # Žádost o plnou moc (zmocněnec)
    ├── reza_issued.html        # Vydané plné moci
    ├── reza_received.html      # Přijaté plné moci a odeslané návrhy
    ├── form_new.html           # Nová žádost — vstup
    ├── form_select.html        # Výběr typu žádosti
    └── form_1–form_4, form_11  # Kroky formuláře žádosti o povolení stavby
```

## Architektura

- **Sdílený stav** — modul `PortalStavebnika` (`js/app-state.js`) drží přihlášeného uživatele, jeho identity, plné moci, záměry a žádosti v localStorage (klíče s prefixem `ps_`). Data přežívají mezi stránkami i po zavření prohlížeče.
- **Hlavička** — je zkopírována přímo do každé stránky (kvůli fungování bez serveru); dynamická data (jméno, postavení) doplňuje `HeaderHelper.init()` z `js/header-helper.js`. Pořadí skriptů: `app-state.js` → `header-helper.js` → `demo-helper.js`.
- **Nápověda** — každá stránka definuje `window.DEMO_CONFIG` (panel „O prototypu" + anotace prvků) a připojuje `js/demo-helper.js`, který vykreslí plovoucí tlačítko Nápověda a značky „i".

## Lokální spuštění

Maketa nevyžaduje server — stačí otevřít `index.html` v prohlížeči. Pro čistší chování (relativní cesty, localStorage per-origin) lze použít lokální server:

```bash
python -m http.server 8000
# poté http://localhost:8000
```

## Publikování na GitHub Pages

1. Nahrajte obsah do repozitáře na GitHubu (root = tato složka).
2. Settings → Pages → Source: branch **main**, folder **/ (root)** → Save.
3. Maketa bude do 1–2 minut na `https://UZIVATEL.github.io/NAZEV-REPOZITARE/`.

## Testovací data a reset

Po přihlášení (stačí zadat libovolné jméno) se vygenerují fiktivní identity (FO, OSVČ, dvě firmy) a výchozí demo sada plných mocí a záměrů. Reset do výchozího stavu: tlačítko **i** vpravo dole → „Obnovit demo data" (smaže localStorage a vrátí na přihlášení).

## Přidání nové stránky

1. Zkopírujte strukturu existující stránky z `pages/` (včetně hlavičky a bloku skriptů na konci).
2. Upravte `window.DEMO_CONFIG` (text „O prototypu" a anotace pro danou obrazovku).
3. Cesty: obrázky `../images/...`, skripty `../js/...`, návrat na přihlášení `../index.html`.
