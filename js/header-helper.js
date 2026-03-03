/**
 * PORTÁL STAVEBNÍKA - Helper pro hlavičku
 * =======================================
 * Tento modul se includuje na všech stránkách a zajišťuje:
 * - Kontrolu přihlášení
 * - Načítání dat do hlavičky
 * - Ovládání user menu
 * - Odhlášení
 */

var HeaderHelper = (function() {
    'use strict';

    /**
     * Inicializace hlavičky
     * Volat na DOMContentLoaded
     */
    function init() {
        // Kontrola přihlášení
        if (!PortalStavebnika.isLoggedIn()) {
            window.location.href = getBasePath() + 'index.html';
            return false;
        }

        // Načtení dat do hlavičky
        loadHeaderData();
        
        // Nastavení event listenerů
        setupEventListeners();
        
        return true;
    }

    /**
     * Zjištění base path podle umístění stránky
     */
    function getBasePath() {
        var path = window.location.pathname;
        if (path.includes('/pages/')) {
            return '../';
        }
        return '';
    }

    /**
     * Načtení dat uživatele do hlavičky
     */
    function loadHeaderData() {
        var headerData = PortalStavebnika.getHeaderData();
        var identity = PortalStavebnika.getCurrentIdentity();
        var user = PortalStavebnika.getUser();
        
        // Elementy v hlavičce
        var userDisplayName = document.getElementById('userDisplayName') || document.getElementById('headerUserName');
        var userDisplayDetail = document.getElementById('userDisplayDetail') || document.getElementById('headerUserDetail');
        var dropdownName = document.getElementById('dropdownName');
        var dropdownDetail = document.getElementById('dropdownDetail');
        var dropdownBadge = document.getElementById('dropdownBadge');
        
        if (userDisplayName) {
            userDisplayName.textContent = headerData.name;
        }
        
        if (userDisplayDetail) {
            userDisplayDetail.textContent = headerData.detail || '';
        }
        
        if (dropdownName && user) {
            dropdownName.textContent = user.name;
        }
        
        if (dropdownDetail && user) {
            dropdownDetail.textContent = 'Nar.: ' + user.birthDate;
        }
        
        if (dropdownBadge && identity) {
            var badgeText = 'Fyzická osoba';
            if (identity.type === 'OSVC') badgeText = 'OSVČ';
            if (identity.type === 'PO') badgeText = 'Právnická osoba';
            dropdownBadge.textContent = badgeText;
        }
    }

    /**
     * Nastavení event listenerů
     */
    function setupEventListeners() {
        // Zavření dropdown při kliknutí mimo
        document.addEventListener('click', function(e) {
            var userSection = document.querySelector('.gov-header-user');
            if (userSection && !userSection.contains(e.target)) {
                var btn = document.querySelector('.gov-header-user-btn');
                var dropdown = document.getElementById('userDropdown');
                if (btn) btn.classList.remove('active');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    }

    /**
     * Toggle user menu
     */
    function toggleUserMenu() {
        var btn = document.querySelector('.gov-header-user-btn');
        var dropdown = document.getElementById('userDropdown');
        if (btn) btn.classList.toggle('active');
        if (dropdown) dropdown.classList.toggle('show');
    }

    /**
     * Odhlášení
     */
    function logout() {
        PortalStavebnika.logout();
        window.location.href = getBasePath() + 'index.html';
    }

    /**
     * Získání aktuální identity pro zobrazení
     */
    function getCurrentIdentityDisplay() {
        var identity = PortalStavebnika.getCurrentIdentity();
        var user = PortalStavebnika.getUser();
        
        if (!identity || !user) return null;
        
        return {
            name: identity.type === 'FO' ? user.name : identity.name,
            detail: identity.detail || '',
            type: identity.type,
            ico: identity.ico || null
        };
    }

    // Public API
    return {
        init: init,
        loadHeaderData: loadHeaderData,
        toggleUserMenu: toggleUserMenu,
        logout: logout,
        getCurrentIdentityDisplay: getCurrentIdentityDisplay,
        getBasePath: getBasePath
    };
})();

// Globální funkce pro zpětnou kompatibilitu
function toggleUserMenu() {
    HeaderHelper.toggleUserMenu();
}

function logout() {
    HeaderHelper.logout();
}

// Export
if (typeof window !== 'undefined') {
    window.HeaderHelper = HeaderHelper;
}
