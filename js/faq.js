// FAQ acordeão — um item aberto por vez, acessível (aria-expanded / aria-hidden)
(function () {
    'use strict';

    function initFaq() {
        var items = document.querySelectorAll('.faq-item');
        if (!items.length) return;

        function closeItem(item) {
            var btn = item.querySelector('.faq-question');
            var panel = item.querySelector('.faq-answer');
            item.classList.remove('open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (panel) {
                panel.setAttribute('aria-hidden', 'true');
                panel.style.maxHeight = null;
            }
        }

        function openItem(item) {
            var btn = item.querySelector('.faq-question');
            var panel = item.querySelector('.faq-answer');
            item.classList.add('open');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            if (panel) {
                panel.setAttribute('aria-hidden', 'false');
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }
        }

        items.forEach(function (item) {
            var btn = item.querySelector('.faq-question');
            if (!btn) return;

            btn.addEventListener('click', function () {
                var isOpen = item.classList.contains('open');

                // Fecha todos os itens
                items.forEach(closeItem);

                // Abre o clicado apenas se estava fechado (um por vez)
                if (!isOpen) openItem(item);
            });
        });

        // Recalcula a altura do painel aberto ao redimensionar
        window.addEventListener('resize', function () {
            var openPanel = document.querySelector('.faq-item.open .faq-answer');
            if (openPanel) openPanel.style.maxHeight = openPanel.scrollHeight + 'px';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFaq);
    } else {
        initFaq();
    }
})();
