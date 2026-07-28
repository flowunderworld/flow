// ===== CAPTURA DE ORIGEM (Google Ads / UTM) =====
// Sem isto, todo lead desembarca no WhatsApp sem origem e é impossível saber
// qual palavra gerou qual venda — que é justamente o dado que o investimento
// em Ads deveria comprar.
//
// Deve ser o PRIMEIRO script da página: expõe window.getRef() e window.waUrl(),
// usados por todos os outros pontos de saída para o WhatsApp.
(function () {
    'use strict';

    var WPP_NUMBER = '5511984651912';
    var STORAGE_KEY = 'flow_attribution';
    var FIELDS = ['gclid', 'utm_source', 'utm_campaign', 'utm_term'];

    // Cache em memória: mantém a origem funcionando mesmo quando o
    // sessionStorage não está disponível (file://, modo restrito, etc.).
    var cache = null;

    function read() {
        if (cache) return cache;
        try {
            var raw = window.sessionStorage.getItem(STORAGE_KEY);
            cache = raw ? JSON.parse(raw) : {};
        } catch (e) {
            cache = {};
        }
        return cache;
    }

    function write(data) {
        cache = data;
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // storage indisponível — o cache em memória continua valendo
        }
    }

    // Lê os parâmetros da URL na carga e persiste. Parâmetro novo sobrescreve
    // o antigo; ausência de parâmetro preserva o que já estava guardado.
    function capture() {
        var stored = read();
        var params;
        try {
            params = new URLSearchParams(window.location.search);
        } catch (e) {
            return stored;
        }
        var changed = false;
        FIELDS.forEach(function (key) {
            var value = params.get(key);
            if (value) {
                stored[key] = value;
                changed = true;
            }
        });
        if (changed) write(stored);
        return stored;
    }

    capture();

    // String curta que identifica de onde veio o visitante.
    window.getRef = function () {
        var data = read();
        return data.gclid || data.utm_campaign || data.utm_source || '';
    };

    // Ponto único de construção de URL do WhatsApp no site inteiro.
    // Anexa a origem do clique + a origem da campanha ao fim da mensagem.
    window.waUrl = function (message, origin) {
        var ref = window.getRef();
        var tag = origin || 'site';
        if (ref) tag += '-' + ref;
        var text = (message || '') + '\n\n---\nref: ' + tag;
        return 'https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(text);
    };

    // Os links estáticos (botão flutuante, rodapé) já nascem com um href
    // válido no HTML; aqui eles são reescritos para carregar mensagem e ref.
    function enhanceStaticLinks() {
        var links = document.querySelectorAll('a[data-wa-origin]');
        Array.prototype.forEach.call(links, function (link) {
            link.href = window.waUrl(
                link.getAttribute('data-wa-msg') || '',
                link.getAttribute('data-wa-origin')
            );
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceStaticLinks);
    } else {
        enhanceStaticLinks();
    }
})();
