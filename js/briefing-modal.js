// ===== MODAL DE BRIEFING =====
// Coletor de briefing para estampa em corte. Abre SOMENTE no clique de
// [data-open-briefing-modal] — nunca sozinho.
// Carregado nas duas páginas; separado da calculadora, que só existe em
// confeccao.html.
(function () {
    'use strict';

    var modal = document.getElementById('briefingModal');
    var wppBtn = document.getElementById('briefingModalWpp');
    var lastFocused = null;

    // O modal é aberto por mais de um CTA (hero, header). Cada um leva a sua
    // própria mensagem e o seu próprio código de origem para o WhatsApp.
    var DEFAULT_ORIGIN = 'home-briefing';
    var DEFAULT_MSG = 'Olá! Segue meu briefing para estampa em corte:';
    var currentOrigin = DEFAULT_ORIGIN;
    var currentMsg = DEFAULT_MSG;

    var FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function focusables() {
        if (!modal) return [];
        return Array.prototype.slice
            .call(modal.querySelectorAll(FOCUSABLE))
            .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    function onKeydown(e) {
        // Fecha só por Voltar/X (requisito); Tab fica preso dentro do modal.
        if (e.key === 'Tab') {
            var f = focusables();
            if (!f.length) return;
            var first = f[0];
            var last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    // "trigger" é o botão que abriu o modal. Ele é a referência preferida para
    // devolver o foco no fechamento: nem todo navegador foca um <button> ao
    // clicar (Safari e Firefox no macOS não focam), e nesses casos
    // document.activeElement seria o <body>.
    function open(trigger) {
        if (!modal || !modal.hidden) return; // inexistente ou já aberto
        lastFocused = trigger || document.activeElement;
        modal.hidden = false;
        document.body.classList.add('modal-open');
        // força reflow para animar a partir do estado inicial
        void modal.offsetWidth;
        modal.classList.add('visible');
        var f = focusables();
        if (f.length) f[0].focus();
        document.addEventListener('keydown', onKeydown);
    }

    function close() {
        if (!modal || modal.hidden) return;
        modal.classList.remove('visible');
        document.removeEventListener('keydown', onKeydown);
        var done = false;
        var finish = function () {
            if (done) return;
            done = true;
            modal.hidden = true;
            document.body.classList.remove('modal-open');
            modal.removeEventListener('transitionend', onEnd);
            if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        };
        var onEnd = function (e) {
            if (e.target === modal) finish();
        };
        modal.addEventListener('transitionend', onEnd);
        setTimeout(finish, 320); // fallback
    }

    if (modal) {
        modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
    }

    document.querySelectorAll('[data-open-briefing-modal]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentOrigin = btn.getAttribute('data-wa-origin') || DEFAULT_ORIGIN;
            currentMsg = btn.getAttribute('data-wa-msg') || DEFAULT_MSG;
            open(btn);
        });
    });

    if (wppBtn) {
        wppBtn.addEventListener('click', function () {
            if (typeof window.trackWhatsApp === 'function') {
                window.trackWhatsApp('whatsapp_briefing', { origem: currentOrigin });
            }
            if (typeof window.trackAdsConversion === 'function') {
                window.trackAdsConversion();
            }

            window.open(window.waUrl(currentMsg, currentOrigin), '_blank', 'noopener');
        });
    }
})();
