/**
 * PORTÁL STAVEBNÍKA - Centrální správa stavu
 * ==========================================
 * Tento modul spravuje:
 * - Přihlášeného uživatele a jeho identity
 * - Aktuálně zvolené postavení
 * - Plné moci (vydané i přijaté)
 * - Záměry
 * 
 * Data jsou persistentně ukládána v localStorage
 */

var PortalStavebnika = (function() {
    'use strict';

    // ===== KONSTANTY =====
    var STORAGE_KEYS = {
        USER: 'ps_user',
        IDENTITIES: 'ps_identities',
        CURRENT_IDENTITY: 'ps_current_identity',
        ISSUED_PM: 'ps_issued_pm',
        RECEIVED_PM: 'ps_received_pm',
        ZAMERY: 'ps_zamery',
        ZADOSTI: 'ps_zadosti'
    };

    // ===== MOCK DATA - Simulace rejstříků =====
    
    // Simulované firmy pro libovolného uživatele (jako by byly načtené z OR)
    function generateMockCompanies(userName) {
        var firstName = userName.split(' ')[0] || 'Jan';
        return [
            {
                id: 'po_1',
                type: 'PO',
                name: 'Testovací projekční s.r.o.',
                ico: '12345678',
                role: 'jednatel',
                address: 'Projektová 123, 110 00 Praha 1'
            },
            {
                id: 'po_2',
                type: 'PO',
                name: firstName + ' & Partners s.r.o.',
                ico: '87654321',
                role: 'společník s oprávněním jednat',
                address: 'Partnerská 456, 120 00 Praha 2'
            }
        ];
    }

    // Simulované OSVČ
    function generateMockOSVC(userName) {
        return {
            id: 'osvc_1',
            type: 'OSVC',
            name: userName,
            ico: '11223344',
            obor: 'Projektová činnost ve výstavbě',
            address: 'Živnostenská 789, 130 00 Praha 3'
        };
    }

    // Výchozí plné moci pro demo
    function getDefaultIssuedPM() {
        return [
            {
                id: 'pm_issued_1',
                type: 'plna_moc',
                status: 'active',
                zmocnenec: {
                    name: 'Ing. Karel Novotný',
                    ico: null,
                    birthDate: '15.03.1975',
                    address: 'Projektantská 45, Praha 5'
                },
                rozsah: 'Zástupce stavebníka ve správním řízení',
                zamery: null,
                platnostOd: '1. 1. 2025',
                platnostDo: 'Časově neomezená',
                postoupeni: true,
                vytvoreno: '2025-01-01'
            }
        ];
    }

    function getDefaultReceivedPM() {
        return [
            {
                id: 'pm_received_1',
                type: 'plna_moc',
                status: 'active',
                zmocnitel: {
                    name: 'ACME Development s.r.o.',
                    ico: '12345678',
                    address: 'Národní 15, Praha 1'
                },
                rozsah: 'Zástupce stavebníka ve správním řízení',
                zamery: null,
                platnostOd: '1. 1. 2025',
                platnostDo: '31. 12. 2025',
                postoupeni: true,
                vytvoreno: '2025-01-01'
            },
            {
                id: 'pm_received_2',
                type: 'povereni',
                status: 'pending',
                zmocnitel: {
                    name: 'METROPROJEKT Praha a.s.',
                    ico: '45271895',
                    address: 'Argentinská 1621/36, 170 00 Praha 7'
                },
                rozsah: 'Pověřená osoba pro úkony na Portálu stavebníka',
                zamery: null,
                platnostOd: '8. 1. 2026',
                platnostDo: 'Časově neomezená',
                postoupeni: false,
                vytvoreno: '2026-01-08'
            }
        ];
    }

    function getDefaultZamery() {
        return [
            {
                id: 'zamer_1',
                nazev: 'Rodinný dům Vinohrady',
                cislo: 'Z-2024-001234',
                typ: 'Novostavba rodinného domu',
                lokalita: 'Praha 2 - Vinohrady, p.č. 1234/5',
                status: 'rozpracovano',
                stavebnik: null, // Bude doplněno podle aktuálního uživatele
                vytvoreno: '2024-06-15',
                posledniZmena: '2024-12-01'
            }
        ];
    }

    // ===== POMOCNÉ FUNKCE =====

    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Chyba při ukládání do localStorage:', e);
            return false;
        }
    }

    function loadFromStorage(key, defaultValue) {
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Chyba při načítání z localStorage:', e);
            return defaultValue;
        }
    }

    function generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(date) {
        if (!date) date = new Date();
        if (typeof date === 'string') date = new Date(date);
        return date.getDate() + '. ' + (date.getMonth() + 1) + '. ' + date.getFullYear();
    }

    // ===== VEŘEJNÉ API =====

    return {
        // ----- UŽIVATEL A PŘIHLÁŠENÍ -----

        /**
         * Přihlásí uživatele a načte jeho identity z "rejstříků"
         * @param {string} fullName - Celé jméno uživatele
         * @param {string} birthDate - Datum narození (volitelné)
         * @returns {object} - Objekt s uživatelem a jeho identitami
         */
        login: function(fullName, birthDate) {
            var user = {
                id: generateId('user'),
                name: fullName.toUpperCase(),
                birthDate: birthDate || '1. 1. 1980',
                loginTime: new Date().toISOString()
            };

            // Generování identit
            var identities = {
                FO: {
                    id: 'fo_' + user.id,
                    type: 'FO',
                    name: user.name,
                    birthDate: user.birthDate,
                    label: 'Fyzická osoba',
                    detail: 'FO · Nar.: ' + user.birthDate
                },
                OSVC: generateMockOSVC(user.name),
                companies: generateMockCompanies(user.name)
            };

            // Přidání OSVČ do seznamu
            identities.OSVC.label = 'OSVČ';
            identities.OSVC.detail = 'OSVČ · IČO: ' + identities.OSVC.ico;

            // Přidání firem
            identities.companies.forEach(function(company) {
                company.label = company.name;
                company.detail = 'Statutár · IČO: ' + company.ico;
            });

            // Uložení
            saveToStorage(STORAGE_KEYS.USER, user);
            saveToStorage(STORAGE_KEYS.IDENTITIES, identities);
            saveToStorage(STORAGE_KEYS.CURRENT_IDENTITY, 'FO');

            // Inicializace výchozích dat pokud ještě neexistují
            if (!loadFromStorage(STORAGE_KEYS.ISSUED_PM, null)) {
                saveToStorage(STORAGE_KEYS.ISSUED_PM, getDefaultIssuedPM());
            }
            if (!loadFromStorage(STORAGE_KEYS.RECEIVED_PM, null)) {
                saveToStorage(STORAGE_KEYS.RECEIVED_PM, getDefaultReceivedPM());
            }
            if (!loadFromStorage(STORAGE_KEYS.ZAMERY, null)) {
                var zamery = getDefaultZamery();
                zamery[0].stavebnik = user.name;
                saveToStorage(STORAGE_KEYS.ZAMERY, zamery);
            }

            return { user: user, identities: identities };
        },

        /**
         * Odhlásí uživatele (vymaže session, ale zachová data)
         */
        logout: function() {
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY);
        },

        /**
         * Kompletní reset - vymaže všechna data
         */
        resetAll: function() {
            Object.values(STORAGE_KEYS).forEach(function(key) {
                localStorage.removeItem(key);
            });
        },

        /**
         * Zjistí, zda je uživatel přihlášen
         */
        isLoggedIn: function() {
            return !!loadFromStorage(STORAGE_KEYS.USER, null);
        },

        /**
         * Vrátí aktuálního uživatele
         */
        getUser: function() {
            return loadFromStorage(STORAGE_KEYS.USER, null);
        },

        /**
         * Vrátí všechny identity uživatele
         */
        getIdentities: function() {
            return loadFromStorage(STORAGE_KEYS.IDENTITIES, null);
        },

        // ----- POSTAVENÍ / IDENTITA -----

        /**
         * Nastaví aktuální postavení
         * @param {string} identityKey - Klíč identity ('FO', 'OSVC', 'po_1', 'po_2', ...)
         */
        setCurrentIdentity: function(identityKey) {
            saveToStorage(STORAGE_KEYS.CURRENT_IDENTITY, identityKey);
        },

        /**
         * Vrátí klíč aktuálního postavení
         */
        getCurrentIdentityKey: function() {
            return loadFromStorage(STORAGE_KEYS.CURRENT_IDENTITY, 'FO');
        },

        /**
         * Vrátí objekt aktuálního postavení
         */
        getCurrentIdentity: function() {
            var key = this.getCurrentIdentityKey();
            var identities = this.getIdentities();
            if (!identities) return null;

            if (key === 'FO') return identities.FO;
            if (key === 'OSVC') return identities.OSVC;
            
            // Hledání v companies
            var company = identities.companies.find(function(c) { return c.id === key; });
            return company || identities.FO;
        },

        /**
         * Vrátí data pro zobrazení v headeru
         */
        getHeaderData: function() {
            var user = this.getUser();
            var identity = this.getCurrentIdentity();
            
            if (!user || !identity) {
                return { name: 'Nepřihlášen', detail: '' };
            }

            return {
                name: identity.type === 'FO' ? user.name : identity.name,
                detail: identity.detail || ''
            };
        },

        // ----- PLNÉ MOCI -----

        /**
         * Vrátí vydané plné moci
         */
        getIssuedPM: function() {
            return loadFromStorage(STORAGE_KEYS.ISSUED_PM, []);
        },

        /**
         * Vrátí přijaté plné moci
         */
        getReceivedPM: function() {
            return loadFromStorage(STORAGE_KEYS.RECEIVED_PM, []);
        },

        /**
         * Přidá novou vydanou plnou moc
         */
        addIssuedPM: function(pmData) {
            var pms = this.getIssuedPM();
            var newPM = Object.assign({
                id: generateId('pm_issued'),
                status: 'pending',
                vytvoreno: new Date().toISOString(),
                platnostOd: formatDate(new Date())
            }, pmData);
            
            pms.push(newPM);
            saveToStorage(STORAGE_KEYS.ISSUED_PM, pms);
            return newPM;
        },

        /**
         * Přidá novou přijatou plnou moc
         */
        addReceivedPM: function(pmData) {
            var pms = this.getReceivedPM();
            var newPM = Object.assign({
                id: generateId('pm_received'),
                status: 'pending',
                vytvoreno: new Date().toISOString()
            }, pmData);
            
            pms.push(newPM);
            saveToStorage(STORAGE_KEYS.RECEIVED_PM, pms);
            return newPM;
        },

        /**
         * Aktualizuje stav plné moci
         */
        updatePMStatus: function(pmId, newStatus, isIssued) {
            var key = isIssued ? STORAGE_KEYS.ISSUED_PM : STORAGE_KEYS.RECEIVED_PM;
            var pms = loadFromStorage(key, []);
            
            var pm = pms.find(function(p) { return p.id === pmId; });
            if (pm) {
                pm.status = newStatus;
                saveToStorage(key, pms);
            }
            return pm;
        },

        /**
         * Smaže plnou moc
         */
        deletePM: function(pmId, isIssued) {
            var key = isIssued ? STORAGE_KEYS.ISSUED_PM : STORAGE_KEYS.RECEIVED_PM;
            var pms = loadFromStorage(key, []);
            
            pms = pms.filter(function(p) { return p.id !== pmId; });
            saveToStorage(key, pms);
        },

        // ----- ZÁMĚRY -----

        /**
         * Vrátí všechny záměry
         */
        getZamery: function() {
            return loadFromStorage(STORAGE_KEYS.ZAMERY, []);
        },

        /**
         * Vrátí záměry podle aktuálního postavení
         */
        getZameryForCurrentIdentity: function() {
            var zamery = this.getZamery();
            var identity = this.getCurrentIdentity();
            var user = this.getUser();
            
            if (!identity || !user) return zamery;

            // V prototypu vrátíme všechny záměry
            // V reálu by se filtrovalo podle oprávnění
            return zamery;
        },

        /**
         * Přidá nový záměr
         */
        addZamer: function(zamerData) {
            var zamery = this.getZamery();
            var user = this.getUser();
            var identity = this.getCurrentIdentity();
            
            var newZamer = Object.assign({
                id: generateId('zamer'),
                cislo: 'Z-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900000) + 100000),
                status: 'rozpracovano',
                stavebnik: identity ? (identity.type === 'FO' ? user.name : identity.name) : 'Neznámý',
                vytvoreno: new Date().toISOString(),
                posledniZmena: new Date().toISOString()
            }, zamerData);
            
            zamery.push(newZamer);
            saveToStorage(STORAGE_KEYS.ZAMERY, zamery);
            return newZamer;
        },

        /**
         * Aktualizuje záměr
         */
        updateZamer: function(zamerId, updates) {
            var zamery = this.getZamery();
            var zamer = zamery.find(function(z) { return z.id === zamerId; });
            
            if (zamer) {
                Object.assign(zamer, updates, { posledniZmena: new Date().toISOString() });
                saveToStorage(STORAGE_KEYS.ZAMERY, zamery);
            }
            return zamer;
        },

        // ----- ŽÁDOSTI -----

        /**
         * Vrátí všechny žádosti
         */
        getZadosti: function() {
            return loadFromStorage(STORAGE_KEYS.ZADOSTI, []);
        },

        /**
         * Přidá novou žádost a vytvoří záměr
         */
        addZadost: function(zadostData) {
            var zadosti = this.getZadosti();
            
            var newZadost = Object.assign({
                id: generateId('zadost'),
                cislo: 'ZAD-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 90000) + 10000),
                status: 'podana',
                vytvoreno: new Date().toISOString()
            }, zadostData);
            
            zadosti.push(newZadost);
            saveToStorage(STORAGE_KEYS.ZADOSTI, zadosti);

            // Automaticky vytvořit záměr pokud ještě neexistuje
            if (zadostData.vytvorZamer) {
                this.addZamer({
                    nazev: zadostData.nazev || 'Nový záměr',
                    typ: zadostData.typZadosti || 'Povolení stavby',
                    lokalita: zadostData.lokalita || 'Neuvedeno',
                    zadostId: newZadost.id
                });
            }

            return newZadost;
        },

        // ----- UTILITY -----

        formatDate: formatDate,
        generateId: generateId
    };
})();

// Export pro použití v prohlížeči
if (typeof window !== 'undefined') {
    window.PortalStavebnika = PortalStavebnika;
}
