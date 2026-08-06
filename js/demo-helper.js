/**
 * PORTÁL STAVEBNÍKA - Nápověda k prototypu (demo-helper)
 * ======================================================
 * Sdílený "drop-in" modul pro třetí osoby, které procházejí mockup.
 *
 * Poskytuje dvě vrstvy nápovědy:
 *   1) CO SE SIMULUJE  – kde prototyp předstírá reálnou funkci
 *                        (rejstříky, REZA, e-maily, backend => localStorage).
 *   2) CO TO ZNAMENÁ   – věcné/doménové vysvětlení pojmů a kroků.
 *
 * Použití na stránce:
 *   1. definovat konfiguraci:
 *        <script>
 *          window.DEMO_CONFIG = {
 *            about: { title: '...', html: '...' },
 *            annotations: [
 *              { selector: '.neco', label: '...', simulace: '...', vyznam: '...' }
 *            ]
 *          };
 *        </script>
 *   2. připojit tento skript:
 *        <script src="../js/demo-helper.js"></script>   (na index.html bez "../")
 *
 * Modul si sám vkládá CSS i ovládací prvky, nepotřebuje zásah do rozvržení
 * stránky a je nezávislý na tom, jak je stránka jinak "zadrátovaná".
 */

(function () {
    'use strict';

    var STATE_KEY = 'ps_demo_help';      // zapnutý režim nápovědy (napříč stránkami)
    var HINT_KEY = 'ps_demo_hint_seen';  // jednorázový úvodní tip

    var config = window.DEMO_CONFIG || {};
    var annotations = config.annotations || [];

    var helpOn = false;
    var els = {};           // reference na vytvořené prvky
    var openPopoverAnn = null;

    // ---------- perzistence stavu ----------
    function readState() {
        try { return localStorage.getItem(STATE_KEY) === '1'; }
        catch (e) { return false; }
    }
    function writeState(on) {
        try { localStorage.setItem(STATE_KEY, on ? '1' : '0'); }
        catch (e) {}
    }

    // ---------- vkládání CSS ----------
    function injectStyles() {
        if (document.getElementById('ds-styles')) return;
        var css = [
            ':root{--ds-accent:var(--gov-primary,#2c5a8c);--ds-sim:#b45309;--ds-mean:#1d4ed8;}',
            // plovoucí ovládání
            '.ds-fab{position:fixed;right:20px;bottom:20px;z-index:20000;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:"Roboto",-apple-system,sans-serif;}',
            '.ds-fab-main{display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;padding:11px 16px;border-radius:24px;background:var(--ds-accent);color:#fff;font-size:14px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.22);transition:transform .12s,box-shadow .12s;}',
            '.ds-fab-main:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.28);}',
            '.ds-fab-main.ds-active{background:#0f7b3f;}',
            '.ds-fab-main .ds-ico{width:20px;height:20px;display:inline-flex;}',
            '.ds-fab-mini{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.5);cursor:pointer;background:#fff;color:var(--ds-accent);font-weight:700;font-size:15px;box-shadow:0 3px 10px rgba(0,0,0,.2);display:inline-flex;align-items:center;justify-content:center;}',
            '.ds-fab-mini:hover{background:var(--ds-accent);color:#fff;}',
            // úvodní tip
            '.ds-hint{position:fixed;right:20px;bottom:78px;z-index:20001;max-width:250px;background:#111827;color:#fff;padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.5;box-shadow:0 8px 24px rgba(0,0,0,.35);font-family:"Roboto",sans-serif;}',
            '.ds-hint:after{content:"";position:absolute;right:26px;bottom:-7px;border:7px solid transparent;border-top-color:#111827;border-bottom:0;}',
            '.ds-hint button{margin-top:8px;background:#fff;color:#111827;border:none;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;}',
            // anotované prvky + značky
            '.ds-help-on .ds-annotated{outline:2px dashed var(--ds-accent);outline-offset:3px;border-radius:4px;}',
            '.ds-marker{position:absolute;top:-10px;right:-10px;width:24px;height:24px;border-radius:50%;background:var(--ds-accent);color:#fff;font-size:14px;font-weight:700;line-height:24px;text-align:center;cursor:pointer;z-index:15000;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;user-select:none;}',
            '.ds-marker:hover{transform:scale(1.12);}',
            'body:not(.ds-help-on) .ds-marker{display:none;}',
            // popover
            '.ds-pop{position:fixed;z-index:21000;width:320px;max-width:calc(100vw - 24px);background:#fff;border:1px solid var(--gov-neutral-200,#e0e0e0);border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.22);font-family:"Roboto",sans-serif;color:#1f2937;overflow:hidden;display:none;}',
            '.ds-pop.ds-show{display:block;}',
            '.ds-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:var(--ds-accent);color:#fff;}',
            '.ds-pop-head strong{font-size:14px;font-weight:600;}',
            '.ds-pop-close{background:transparent;border:none;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:0 2px;}',
            '.ds-pop-body{padding:12px 14px;font-size:13px;line-height:1.55;}',
            '.ds-block{margin-bottom:12px;}',
            '.ds-block:last-child{margin-bottom:0;}',
            '.ds-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:2px 7px;border-radius:4px;margin-bottom:5px;}',
            '.ds-tag-sim{background:#fef3c7;color:var(--ds-sim);}',
            '.ds-tag-mean{background:#dbeafe;color:var(--ds-mean);}',
            // panel "O prototypu"
            '.ds-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:21500;display:none;}',
            '.ds-overlay.ds-show{display:block;}',
            '.ds-panel{position:fixed;top:0;right:0;height:100%;width:400px;max-width:90vw;background:#fff;z-index:22000;box-shadow:-8px 0 30px rgba(0,0,0,.25);transform:translateX(100%);transition:transform .22s ease;display:flex;flex-direction:column;font-family:"Roboto",sans-serif;color:#1f2937;}',
            '.ds-panel.ds-show{transform:translateX(0);}',
            '.ds-panel-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:var(--ds-accent);color:#fff;}',
            '.ds-panel-head h2{font-size:16px;font-weight:600;margin:0;}',
            '.ds-panel-head button{background:transparent;border:none;color:#fff;font-size:24px;line-height:1;cursor:pointer;}',
            '.ds-panel-body{padding:18px;overflow-y:auto;font-size:14px;line-height:1.6;}',
            '.ds-panel-body h3{font-size:14px;margin:16px 0 6px;color:var(--ds-accent);}',
            '.ds-panel-body ul{margin:6px 0 6px 18px;}',
            '.ds-panel-body li{margin-bottom:4px;}',
            '.ds-reset{margin-top:18px;padding-top:14px;border-top:1px solid var(--gov-neutral-200,#e0e0e0);}',
            '.ds-reset button{background:#fff;color:#b91c1c;border:1px solid #b91c1c;border-radius:6px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;}',
            '.ds-reset button:hover{background:#b91c1c;color:#fff;}',
            '.ds-pr-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(20,30,50,.5);z-index:22500;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;font-family:"Roboto",sans-serif;}',
            '.ds-pr-overlay.ds-show{display:flex;}',
            '.ds-pr-modal{background:#fff;border-radius:10px;width:100%;max-width:640px;box-shadow:0 20px 50px rgba(0,0,0,.3);overflow:hidden;}',
            '.ds-pr-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:var(--gov-primary,#2c5a8c);color:#fff;}',
            '.ds-pr-head h2{font-size:18px;font-weight:600;margin:0;}',
            '.ds-pr-close{background:transparent;border:none;color:#fff;font-size:26px;line-height:1;cursor:pointer;}',
            '.ds-pr-body{padding:20px 24px;color:#1f2937;}',
            '.ds-pr-intro{font-size:14px;color:var(--gov-neutral-600,#555);margin:0 0 18px;line-height:1.5;}',
            '.ds-pr-item{display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--gov-neutral-100,#f0f0f0);}',
            '.ds-pr-item:first-of-type{border-top:none;padding-top:0;}',
            '.ds-pr-num{flex-shrink:0;width:28px;height:28px;border-radius:8px;background:var(--gov-primary,#2c5a8c);color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;}',
            '.ds-pr-title{font-size:15px;font-weight:600;color:var(--gov-neutral-900,#1a1a1a);margin-bottom:3px;}',
            '.ds-pr-desc{font-size:13.5px;color:var(--gov-neutral-600,#555);line-height:1.5;}',
            '.ds-pr-foot{padding:14px 24px;border-top:1px solid var(--gov-neutral-100,#f0f0f0);text-align:right;}',
            '.ds-pr-foot button{background:var(--gov-primary,#2c5a8c);color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}',
            '.gov-nav-priority-btn{background:transparent;border:none;cursor:pointer;color:#fff;padding:14px 16px;display:flex;align-items:center;opacity:.8;transition:opacity .2s,background .2s;position:relative;}',
            '.gov-nav-priority-btn:hover{opacity:1;background:rgba(255,255,255,.1);}',
            '.gov-nav-priority-btn svg{width:20px;height:20px;}',
            '.gov-nav-priority-btn[data-tooltip]:hover::after{content:attr(data-tooltip);position:absolute;top:100%;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:400;white-space:nowrap;z-index:1000;margin-top:6px;}',
            '@media print{.ds-fab,.ds-hint,.ds-marker,.ds-pop,.ds-overlay,.ds-panel,.ds-pr-overlay{display:none!important;}}'
        ].join('\n');
        var style = document.createElement('style');
        style.id = 'ds-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------- plovoucí ovládání (FAB) ----------
    function buildFab() {
        var fab = document.createElement('div');
        fab.className = 'ds-fab';

        var about = document.createElement('button');
        about.className = 'ds-fab-mini';
        about.type = 'button';
        about.title = 'O tomto prototypu';
        about.textContent = 'i';
        about.addEventListener('click', openAbout);

        var main = document.createElement('button');
        main.className = 'ds-fab-main';
        main.type = 'button';
        main.innerHTML =
            '<span class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 11v5"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/>' +
            '</svg></span><span class="ds-fab-label">Nápověda</span>';
        main.addEventListener('click', function () { toggleHelp(); });

        fab.appendChild(about);
        fab.appendChild(main);
        document.body.appendChild(fab);
        els.fabMain = main;
        els.fabLabel = main.querySelector('.ds-fab-label');
    }

    function maybeShowHint() {
        var seen;
        try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (e) { seen = false; }
        if (seen || helpOn) return;
        var hint = document.createElement('div');
        hint.className = 'ds-hint';
        hint.innerHTML = 'Toto je klikací prototyp. Tlačítkem <strong>Nápověda</strong> zapnete vysvětlivky, co se simuluje a co jednotlivé kroky znamenají.<br><button type="button">Rozumím</button>';
        hint.querySelector('button').addEventListener('click', function () {
            try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
            if (hint.parentNode) hint.parentNode.removeChild(hint);
        });
        document.body.appendChild(hint);
    }

    // ---------- popover ----------
    function buildPopover() {
        var pop = document.createElement('div');
        pop.className = 'ds-pop';
        pop.innerHTML =
            '<div class="ds-pop-head"><strong class="ds-pop-title"></strong>' +
            '<button type="button" class="ds-pop-close" aria-label="Zavřít">&times;</button></div>' +
            '<div class="ds-pop-body"></div>';
        document.body.appendChild(pop);
        pop.querySelector('.ds-pop-close').addEventListener('click', closePopover);
        els.pop = pop;
        els.popTitle = pop.querySelector('.ds-pop-title');
        els.popBody = pop.querySelector('.ds-pop-body');
    }

    function openPopover(marker, ann) {
        var body = '';
        if (ann.simulace) {
            body += '<div class="ds-block"><span class="ds-tag ds-tag-sim">Co se simuluje</span><div>' + ann.simulace + '</div></div>';
        }
        if (ann.vyznam) {
            body += '<div class="ds-block"><span class="ds-tag ds-tag-mean">Co to znamená</span><div>' + ann.vyznam + '</div></div>';
        }
        els.popTitle.textContent = ann.label || 'Vysvětlivka';
        els.popBody.innerHTML = body;
        els.pop.classList.add('ds-show');
        openPopoverAnn = marker;
        positionPopover(marker);
    }

    function positionPopover(marker) {
        var r = marker.getBoundingClientRect();
        var pop = els.pop;
        var pw = pop.offsetWidth || 320;
        var ph = pop.offsetHeight || 160;
        var left = r.left + r.width / 2 - pw / 2;
        var top = r.bottom + 10;
        // svislé přeteče => nad značku
        if (top + ph > window.innerHeight - 8) {
            top = r.top - ph - 10;
        }
        if (top < 8) top = 8;
        // vodorovné ukotvení do viewportu
        if (left < 8) left = 8;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
    }

    function closePopover() {
        els.pop.classList.remove('ds-show');
        openPopoverAnn = null;
    }

    // ---------- ukotvení anotací ----------
    function ensurePositioned(el) {
        var pos = window.getComputedStyle(el).position;
        if (pos === 'static') {
            el.style.position = 'relative';
            el.setAttribute('data-ds-pos', '1');
        }
    }

    function attachMarker(el, ann, idx) {
        if (el.getAttribute('data-ds-marked') === String(idx)) return;
        el.setAttribute('data-ds-marked', String(idx));
        el.classList.add('ds-annotated');
        ensurePositioned(el);
        var m = document.createElement('span');
        m.className = 'ds-marker';
        m.textContent = 'i';
        m.title = ann.label || 'Vysvětlivka';
        m.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (openPopoverAnn === m && els.pop.classList.contains('ds-show')) {
                closePopover();
            } else {
                openPopover(m, ann);
            }
        });
        el.appendChild(m);
    }

    function scanAndAttach() {
        annotations.forEach(function (ann, idx) {
            var el = document.querySelector(ann.selector);
            if (el) attachMarker(el, ann, idx);
        });
    }

    function removeMarkers() {
        var marks = document.querySelectorAll('.ds-marker');
        Array.prototype.forEach.call(marks, function (m) {
            if (m.parentNode) m.parentNode.removeChild(m);
        });
        var ann = document.querySelectorAll('.ds-annotated[data-ds-marked]');
        Array.prototype.forEach.call(ann, function (el) {
            el.classList.remove('ds-annotated');
            el.removeAttribute('data-ds-marked');
            if (el.getAttribute('data-ds-pos') === '1') {
                el.style.position = '';
                el.removeAttribute('data-ds-pos');
            }
        });
    }

    // ---------- zapnutí / vypnutí režimu ----------
    function toggleHelp() { setHelp(!helpOn); }

    function setHelp(on) {
        helpOn = on;
        writeState(on);
        if (on) {
            document.body.classList.add('ds-help-on');
            els.fabMain.classList.add('ds-active');
            if (els.fabLabel) els.fabLabel.textContent = 'Nápověda: zapnuto';
            scanAndAttach();
        } else {
            document.body.classList.remove('ds-help-on');
            els.fabMain.classList.remove('ds-active');
            if (els.fabLabel) els.fabLabel.textContent = 'Nápověda';
            closePopover();
            removeMarkers();
        }
    }

    // ---------- panel "O prototypu" ----------
    function buildAbout() {
        var overlay = document.createElement('div');
        overlay.className = 'ds-overlay';
        overlay.addEventListener('click', closeAbout);

        var panel = document.createElement('div');
        panel.className = 'ds-panel';

        var about = config.about || {};
        var defaultHtml =
            '<p>Toto je <strong>klikací prototyp</strong> Portálu stavebníka. Neběží proti žádnému reálnému systému a neodesílá nikam žádná data.</p>' +
            '<h3>Co je simulované</h3><ul>' +
            '<li>Přihlášení (Identita občana) — stačí zadat jméno.</li>' +
            '<li>Načtení postavení z rejstříků (ROB, ROS) i firem a IČO.</li>' +
            '<li>REZA — ověření plných mocí a pověření.</li>' +
            '<li>Odesílání e-mailů (např. návrh plné moci ke schválení).</li>' +
            '</ul>' +
            '<h3>Kde se drží data</h3>' +
            '<p>Všechna data existují pouze ve vašem prohlížeči (localStorage). Zůstanou i po zavření okna; jiného uživatele ani jiný počítač neovlivní.</p>';

        panel.innerHTML =
            '<div class="ds-panel-head"><h2>' + (about.title || 'O tomto prototypu') + '</h2>' +
            '<button type="button" aria-label="Zavřít">&times;</button></div>' +
            '<div class="ds-panel-body">' + (about.html || defaultHtml) +
            '<div class="ds-reset"><p style="font-size:13px;margin-bottom:8px;">Chcete začít nanovo s výchozími testovacími daty?</p>' +
            '<button type="button" class="ds-reset-btn">Obnovit demo data</button></div>' +
            '</div>';

        panel.querySelector('.ds-panel-head button').addEventListener('click', closeAbout);
        var resetBtn = panel.querySelector('.ds-reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetDemo);

        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        els.overlay = overlay;
        els.panel = panel;
    }

    function openAbout() {
        els.overlay.classList.add('ds-show');
        els.panel.classList.add('ds-show');
    }
    function closeAbout() {
        els.overlay.classList.remove('ds-show');
        els.panel.classList.remove('ds-show');
    }

    function resetDemo() {
        if (!confirm('Opravdu obnovit demo data? Smažou se rozpracované záměry, žádosti a plné moci vytvořené v tomto prohlížeči a obnoví se výchozí testovací stav.')) return;
        try {
            if (window.PortalStavebnika && PortalStavebnika.resetAll) {
                PortalStavebnika.resetAll();
            }
        } catch (e) {}
        // po resetu zpět na přihlášení
        var toIndex = window.location.pathname.indexOf('/pages/') > -1 ? '../index.html' : 'index.html';
        window.location.href = toIndex;
    }

    // ---------- globální handlery ----------
    function onDocClick(e) {
        if (!els.pop.classList.contains('ds-show')) return;
        if (els.pop.contains(e.target)) return;
        if (e.target.classList && e.target.classList.contains('ds-marker')) return;
        closePopover();
    }
    function onKey(e) {
        if (e.key === 'Escape') { closePopover(); closeAbout(); closePriorities(); }
    }
    function onReflow() {
        if (openPopoverAnn) positionPopover(openPopoverAnn);
    }

    // ---------- init ----------
    // ---------- modal Priority vývoje ----------
    function buildPriorities() {
        var items = [
            ['REZA', 'Kompletní simulace administrace a použití implicitní a explicitní REZA.'],
            ['Validátor dokumentace', 'Simulace ověření dokumentace před nahráváním i v jeho průběhu.'],
            ['Struktura dokumentace', 'Simulace nového flexibilního členění dokumentace.'],
            ['Ostatní', 'Simulace určování adresáta žádosti (po 1. 1. 2028) a výběru žádostí (průvodce / seznam).']
        ];
        var itemsHtml = items.map(function (it, i) {
            return '<div class="ds-pr-item"><div class="ds-pr-num">' + (i + 1) + '</div><div><div class="ds-pr-title">' + it[0] + '</div><div class="ds-pr-desc">' + it[1] + '</div></div></div>';
        }).join('');
        var overlay = document.createElement('div');
        overlay.className = 'ds-pr-overlay';
        overlay.innerHTML =
            '<div class="ds-pr-modal">' +
            '<div class="ds-pr-head"><h2>Priority vývoje Portálu stavebníka</h2><button type="button" class="ds-pr-close" aria-label="Zavřít">&times;</button></div>' +
            '<div class="ds-pr-body"><p class="ds-pr-intro">Tato maketa slouží jako podklad pro prioritizaci vývoje. Klíčové oblasti simulace:</p>' + itemsHtml + '</div>' +
            '<div class="ds-pr-foot"><button type="button">Zavřít</button></div>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closePriorities(); });
        overlay.querySelector('.ds-pr-close').addEventListener('click', closePriorities);
        overlay.querySelector('.ds-pr-foot button').addEventListener('click', closePriorities);
        els.prOverlay = overlay;
    }
    function openPriorities() { if (els.prOverlay) els.prOverlay.classList.add('ds-show'); }
    function closePriorities() { if (els.prOverlay) els.prOverlay.classList.remove('ds-show'); }

    // vytvoří tlačítko s vlaječkou
    function makePriorityBtn() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gov-nav-priority-btn';
        btn.setAttribute('data-tooltip', 'Priority vývoje');
        btn.setAttribute('aria-label', 'Priority vývoje Portálu stavebníka');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
        btn.addEventListener('click', openPriorities);
        return btn;
    }

    // vloží ikonku do horizontálního menu; na homepage bez menu do horní lišty
    function injectNavIcon() {
        var menu = document.querySelector('.gov-nav-menu');
        if (menu) {
            if (menu.querySelector('.gov-nav-priority-btn')) return;
            var li = document.createElement('li');
            li.className = 'gov-nav-item';
            li.appendChild(makePriorityBtn());
            menu.appendChild(li);
            return;
        }
        var bar = document.querySelector('.ps-topbar-inner');
        if (bar && !bar.querySelector('.gov-nav-priority-btn')) {
            bar.style.width = '100%';
            var b = makePriorityBtn();
            b.style.marginLeft = 'auto';
            bar.appendChild(b);
        }
    }

    function init() {
        injectStyles();
        buildFab();
        buildPopover();
        buildAbout();
        buildPriorities();
        injectNavIcon();

        document.addEventListener('click', onDocClick, true);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onReflow, true);
        window.addEventListener('resize', onReflow);

        // sledování dynamicky vykreslených prvků (např. karty identit)
        if (window.MutationObserver && annotations.length) {
            var pending = false;
            var mo = new MutationObserver(function () {
                if (!helpOn || pending) return;
                pending = true;
                setTimeout(function () { pending = false; scanAndAttach(); }, 120);
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }

        helpOn = readState();
        if (helpOn) {
            setHelp(true);
        } else {
            maybeShowHint();
        }

        window.DemoHelper = {
            toggle: toggleHelp,
            setHelp: setHelp,
            openAbout: openAbout,
            openPriorities: openPriorities,
            rescan: scanAndAttach
        };
        window.openPriorities = openPriorities;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
