/* ===========================================
   ISSŘ Maketa - Sdílené komponenty
   =========================================== */

/**
 * Načte HTML komponentu do elementu
 * @param {string} elementId - ID elementu pro vložení
 * @param {string} componentPath - Cesta ke komponentě
 */
async function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        element.innerHTML = html;
    } catch (error) {
        console.error(`Chyba při načítání komponenty ${componentPath}:`, error);
    }
}

/**
 * Inicializace stránky - načte hlavičku
 */
document.addEventListener('DOMContentLoaded', function() {
    // Zjistit relativní cestu k root (pro pages/ podsložku)
    const isInSubfolder = window.location.pathname.includes('/pages/');
    const basePath = isInSubfolder ? '..' : '.';
    
    // Načíst hlavičku
    loadComponent('header-placeholder', `${basePath}/components/header.html`);
});

/**
 * Navigace mezi stránkami
 */
function navigateTo(page) {
    window.location.href = page;
}
