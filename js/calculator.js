// ===== CALCULADORA DE ORÇAMENTO (confeccao.html) =====
// Só a calculadora. O controle do modal vive em js/briefing-modal.js.
(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // CONSTANTES DE PREÇO
    // Os valores unitários ficam aqui, e não em data-price no HTML, para não
    // deixar a tabela de preços legível para qualquer concorrente que abra o
    // código-fonte da página. As chaves são neutras de propósito.
    // ---------------------------------------------------------------------

    var BASE_UNIT = {
        p1: 37,
        p2: 42,
        p3: 47,
        p4: 55,
        p5: 60,
        p6: 65,
        p7: 75
    };

    // Custo de gravação por tela.
    var SCREEN_PRICE = 50;

    // Locais de estampa. "count" é quantas telas cada opção consome por cor;
    // "mult" é o quanto o local adicional pesa no valor de impressão da peça.
    // [[PREENCHER: multiplicadores por local de estampa]] — 1.0 = sem acréscimo.
    var LOCATIONS = {
        'frente':        { count: 1, mult: 1.0 },
        'costas':        { count: 1, mult: 1.0 },
        'manga':         { count: 1, mult: 1.0 },
        'frente-costas': { count: 2, mult: 1.0 }
    };

    // Faixas de volume com preço decrescente por peça.
    // [[PREENCHER: multiplicadores de faixa de volume]] — 1.0 = sem desconto.
    // Enquanto estiverem em 1.0 a estimativa sai pelo preço de tabela, que é
    // exatamente o sentido de "a partir de".
    var VOLUME_TIERS = [
        { min: 30,  max: 99,       mult: 1.0 },
        { min: 100, max: 299,      mult: 1.0 },
        { min: 300, max: Infinity, mult: 1.0 }
    ];

    var MIN_QTY = 30;

    // ---------------------------------------------------------------------

    var productSelect = document.getElementById('product');
    var colorsSelect = document.getElementById('colors');
    var locationsSelect = document.getElementById('locations');
    var quantityInput = document.getElementById('quantity');

    if (!productSelect || !colorsSelect || !locationsSelect || !quantityInput) return;

    var totalPriceEl = document.getElementById('totalPrice');
    var screensCostEl = document.getElementById('screensCost');
    var piecesCostEl = document.getElementById('piecesCost');
    var summaryEl = document.getElementById('summary');
    var whatsappBtn = document.getElementById('whatsappBtn');

    var productError = document.getElementById('productError');
    var colorsError = document.getElementById('colorsError');
    var locationsError = document.getElementById('locationsError');
    var quantityError = document.getElementById('quantityError');

    var hasInteracted = false;
    var lastTrackedSignature = '';

    function money(value) {
        return 'R$ ' + value.toFixed(2).replace('.', ',');
    }

    function showError(el, field) {
        if (el) el.classList.add('visible');
        if (field) field.classList.add('error');
    }

    function clearError(el, field) {
        if (el) el.classList.remove('visible');
        if (field) field.classList.remove('error');
    }

    function volumeMultiplier(quantity) {
        for (var i = 0; i < VOLUME_TIERS.length; i++) {
            if (quantity >= VOLUME_TIERS[i].min && quantity <= VOLUME_TIERS[i].max) {
                return VOLUME_TIERS[i].mult;
            }
        }
        return 1;
    }

    function optionText(select) {
        var opt = select.options[select.selectedIndex];
        return opt ? opt.textContent.trim() : '';
    }

    // O <select> nativo fica escondido pelo custom-select; quem recebe foco é
    // o gatilho customizado. Devolve o elemento realmente focável do campo.
    function visibleControl(field) {
        var trigger = document.getElementById(field.id + '-trigger');
        return trigger || field;
    }

    function focusField(field) {
        var group = field.closest('.form-group') || field;
        group.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var control = visibleControl(field);
        if (control && typeof control.focus === 'function') control.focus();
    }

    function resetPrice() {
        totalPriceEl.textContent = money(0);
        screensCostEl.textContent = money(0);
        piecesCostEl.textContent = money(0);
    }

    // Zera o input quando o usuário clica nele pela primeira vez
    quantityInput.addEventListener('focus', function () {
        if (!hasInteracted) {
            this.value = '';
            hasInteracted = true;
        }
    });

    // Se o usuário sair sem digitar nada ou abaixo do mínimo, volta para o mínimo
    quantityInput.addEventListener('blur', function () {
        if (this.value === '' || parseInt(this.value, 10) < MIN_QTY) {
            this.value = String(MIN_QTY);
        }
        onFormChange();
    });

    function validateQuantityLive() {
        var raw = quantityInput.value;
        var q = parseInt(raw, 10);
        if (raw !== '' && !isNaN(q) && q < MIN_QTY) {
            showError(quantityError, quantityInput);
        } else {
            clearError(quantityError, quantityInput);
        }
    }

    function isValid() {
        var q = parseInt(quantityInput.value, 10);
        return !!(productSelect.value && colorsSelect.value && locationsSelect.value &&
                  !isNaN(q) && q >= MIN_QTY);
    }

    function calculatePrice() {
        var quantity = parseInt(quantityInput.value, 10) || 0;
        var unit = BASE_UNIT[productSelect.value];
        var colors = parseInt(colorsSelect.value, 10);
        var location = LOCATIONS[locationsSelect.value];

        if (!unit || !colors || !location || quantity < 1) {
            resetPrice();
            return;
        }

        // Cada local de estampa consome uma tela por cor.
        var totalScreens = colors * location.count;
        var screensCost = totalScreens * SCREEN_PRICE;
        var piecesCost = quantity * unit * location.mult * volumeMultiplier(quantity);

        totalPriceEl.textContent = money(screensCost + piecesCost);
        screensCostEl.textContent = money(screensCost);
        piecesCostEl.textContent = money(piecesCost);

        updateSummary(totalScreens);
        trackCalculation(quantity);
    }

    function updateSummary(totalScreens) {
        summaryEl.style.display = 'block';
        document.getElementById('summaryProduct').textContent = optionText(productSelect);
        document.getElementById('summaryQuantity').textContent = quantityInput.value + ' unidades';
        document.getElementById('summaryColors').textContent = optionText(colorsSelect);
        document.getElementById('summaryLocations').textContent = optionText(locationsSelect);
        document.getElementById('summaryScreens').textContent =
            totalScreens + (totalScreens === 1 ? ' tela' : ' telas');
    }

    // Mede quantos chegaram a calcular — sem isso não dá para saber quantos
    // calcularam e desistiram, que é o número que revela se o preço espanta.
    // A assinatura evita um evento por tecla digitada.
    function trackCalculation(quantity) {
        var signature = [productSelect.value, colorsSelect.value, locationsSelect.value, quantity].join('|');
        if (signature === lastTrackedSignature) return;
        lastTrackedSignature = signature;

        if (typeof window.trackWhatsApp === 'function') {
            window.trackWhatsApp('orcamento_calculado', {
                produto: optionText(productSelect),
                quantidade: quantity,
                cores: colorsSelect.value,
                locais: locationsSelect.value,
                valor_total: totalPriceEl.textContent
            });
        }
    }

    function onFormChange() {
        if (productSelect.value) clearError(productError, productSelect);
        if (colorsSelect.value) clearError(colorsError, colorsSelect);
        if (locationsSelect.value) clearError(locationsError, locationsSelect);
        validateQuantityLive();
        if (isValid()) {
            calculatePrice();
        } else {
            resetPrice();
        }
    }

    productSelect.addEventListener('change', onFormChange);
    colorsSelect.addEventListener('change', onFormChange);
    locationsSelect.addEventListener('change', onFormChange);
    quantityInput.addEventListener('input', onFormChange);

    if (whatsappBtn) {
        // O botão nunca fica desabilitado: se o formulário estiver incompleto,
        // ele mostra o erro e leva o usuário até o campo. Botão morto faz o
        // lead sair sem descobrir o que faltava.
        whatsappBtn.addEventListener('click', function () {
            var quantity = parseInt(quantityInput.value, 10);
            var firstInvalid = null;

            if (!productSelect.value) {
                showError(productError, productSelect);
                firstInvalid = firstInvalid || productSelect;
            }
            if (!colorsSelect.value) {
                showError(colorsError, colorsSelect);
                firstInvalid = firstInvalid || colorsSelect;
            }
            if (!locationsSelect.value) {
                showError(locationsError, locationsSelect);
                firstInvalid = firstInvalid || locationsSelect;
            }
            if (isNaN(quantity) || quantity < MIN_QTY) {
                showError(quantityError, quantityInput);
                firstInvalid = firstInvalid || quantityInput;
            }

            if (firstInvalid) {
                focusField(firstInvalid);
                return;
            }

            var location = LOCATIONS[locationsSelect.value];
            var totalScreens = parseInt(colorsSelect.value, 10) * location.count;

            var message = 'Olá! Fiz uma estimativa de confecção pelo site.\n' +
                'Segue o que configurei:\n\n' +
                '*Produto:* ' + optionText(productSelect) + '\n' +
                '*Quantidade:* ' + quantity + ' unidades\n' +
                '*Cores:* ' + optionText(colorsSelect) + '\n' +
                '*Locais de estampa:* ' + optionText(locationsSelect) + '\n' +
                '*Telas:* ' + totalScreens + '\n' +
                '*Custo das telas:* ' + screensCostEl.textContent + '\n' +
                '*Valor das peças:* ' + piecesCostEl.textContent + '\n\n' +
                '*ESTIMATIVA A PARTIR DE:* ' + totalPriceEl.textContent + '\n\n' +
                'Estimativa para ' + location.count + ' local(is) de estampa em peça clara. ' +
                'Valor final confirmado após análise da arte.';

            if (typeof window.trackWhatsApp === 'function') {
                window.trackWhatsApp('whatsapp_calculadora', {
                    produto: optionText(productSelect),
                    quantidade: quantity,
                    cores: colorsSelect.value,
                    locais: locationsSelect.value,
                    valor_total: totalPriceEl.textContent
                });
            }
            if (typeof window.trackAdsConversion === 'function') {
                window.trackAdsConversion();
            }

            window.open(window.waUrl(message, 'confeccao-calc'), '_blank', 'noopener');
        });
    }
})();
