// ===== RASTREAMENTO DE CONVERSÃO (Google Ads / GA4) =====
// Função central: todo clique que leva ao WhatsApp dispara um evento,
// com o nome diferenciando a origem do clique.
(function () {
    'use strict';

    // ID da ação de conversão do Google Ads, no formato 'AW-XXXXXXXXX/AbC-D_efGhIjKlM'.
    // Enquanto for null nenhuma conversão é enviada — disparar com placeholder
    // sujaria a conta. Basta preencher a constante para ativar.
    var ADS_CONVERSION = null; // [[PREENCHER: GOOGLE_ADS_CONVERSAO]]

    // Exposta globalmente para os demais scripts enviarem os dados do lead.
    window.trackWhatsApp = function (eventName, params) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', eventName, params || {});
    };

    // Evento GA4 sozinho não é conversão do Ads — sem esta chamada a campanha
    // não otimiza. Disparada em todo ponto de saída para o WhatsApp.
    window.trackAdsConversion = function (value) {
        if (!ADS_CONVERSION) return;
        if (typeof window.gtag !== 'function') return;
        var payload = { send_to: ADS_CONVERSION, currency: 'BRL' };
        if (typeof value === 'number' && !isNaN(value)) payload.value = value;
        window.gtag('event', 'conversion', payload);
    };

    function initTracking() {
        // Liga os cliques de WhatsApp que não carregam dados de cotação:
        // botão flutuante (whatsapp_flutuante), rodapé (whatsapp_rodape).
        // A calculadora e o modal de briefing chamam trackWhatsApp direto.
        var links = document.querySelectorAll('[data-track]');
        links.forEach(function (link) {
            link.addEventListener('click', function () {
                window.trackWhatsApp(link.getAttribute('data-track'), {});
                window.trackAdsConversion();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }
})();
