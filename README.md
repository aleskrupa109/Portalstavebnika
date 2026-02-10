# ISSŘ Maketa

Maketa Informačního systému stavebního řízení pro testování a prezentace.

## Struktura projektu

```
issr-maketa/
├── index.html              # Přihlašovací stránka
├── dokumenty.html          # Seznam dokumentů/řízení
├── css/
│   └── styles.css          # Hlavní styly
├── js/
│   └── app.js              # JavaScript (načítání komponent)
├── components/
│   └── header.html         # Sdílená hlavička
├── images/
│   └── ...                 # Obrázky a loga
└── pages/
    ├── detail-rizeni.html      # Detail řízení s kontrolním panelem
    └── kontrola-prislusnost.html  # Kontrola příslušnosti
```

## Publikování na GitHub Pages

### Krok 1: Vytvořte GitHub repozitář

1. Jděte na [github.com](https://github.com) a přihlaste se
2. Klikněte na **"New repository"** (zelené tlačítko)
3. Pojmenujte repozitář např. `issr-maketa`
4. Nechte **Public** (pro GitHub Pages zdarma)
5. Klikněte **"Create repository"**

### Krok 2: Nahrajte soubory

**Varianta A - Přes webové rozhraní (jednodušší):**
1. V novém repozitáři klikněte na **"uploading an existing file"**
2. Přetáhněte všechny soubory a složky z `issr-maketa/`
3. Klikněte **"Commit changes"**

**Varianta B - Přes Git (pro pokročilé):**
```bash
cd issr-maketa
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VASE-JMENO/issr-maketa.git
git push -u origin main
```

### Krok 3: Zapněte GitHub Pages

1. V repozitáři jděte do **Settings** (ozubené kolečko)
2. V levém menu klikněte na **Pages**
3. V sekci "Source" vyberte:
   - Branch: **main**
   - Folder: **/ (root)**
4. Klikněte **Save**

### Krok 4: Počkejte na publikování

- GitHub Pages potřebuje 1-2 minuty na první publikování
- Vaše maketa bude dostupná na:
  ```
  https://VASE-JMENO.github.io/issr-maketa/
  ```

## Aktualizace makety

Po každé změně souborů:

**Přes webové rozhraní:**
1. Nahrajte změněné soubory přes "Add file" → "Upload files"
2. Změny se automaticky publikují během 1-2 minut

**Přes Git:**
```bash
git add .
git commit -m "Popis změny"
git push
```

## Lokální testování

Pro testování na vlastním počítači potřebujete lokální server (kvůli načítání komponent).

**S Pythonem:**
```bash
cd issr-maketa
python -m http.server 8000
```
Pak otevřete http://localhost:8000

**S Node.js:**
```bash
npx serve issr-maketa
```

**Nebo jednoduše:** Otevřete soubory přímo v prohlížeči - hlavička se v tomto případě nenačte dynamicky, ale zbytek stránky bude fungovat.

## Přidání nových stránek

1. Vytvořte nový HTML soubor ve složce `pages/`
2. Zkopírujte strukturu z existující stránky
3. Upravte cestu k CSS: `../css/styles.css`
4. Upravte cestu k obrázkům: `../images/...`

## Úprava hlavičky

Hlavička je definována v `components/header.html`. Změna se projeví na všech stránkách, které ji načítají dynamicky.

Pro stránky v `pages/` složce je hlavička zkopírována přímo do HTML (kvůli relativním cestám k obrázkům).

## Barvy a styly

Hlavní barvy jsou definované jako CSS proměnné v `css/styles.css`:

```css
--issr-primary: #004289;     /* Hlavní modrá */
--issr-accent: #0066cc;      /* Akcentová modrá */
--issr-success: #28a745;     /* Zelená pro úspěch */
--issr-warning: #ffc107;     /* Žlutá pro upozornění */
--issr-danger: #dc3545;      /* Červená pro chyby */
```

## Kontakt

Pro dotazy a připomínky kontaktujte správce projektu.
