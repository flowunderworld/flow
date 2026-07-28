// ===== CUSTOM SELECT (dropdown premium acessível) =====
// Progressive enhancement: mantém o <select> nativo (fonte da verdade do valor
// e do submit) escondido e constrói uma UI customizada sincronizada.
// Padrão ARIA "select-only combobox" (button + listbox).
(function () {
    'use strict';

    var uid = 0;

    function CustomSelect(select) {
        this.native = select;
        this.id = select.id || ('cs-' + (++uid));
        this.label = document.querySelector('label[for="' + select.id + '"]');
        this.open = false;
        this.activeIndex = -1;
        this.onDocClick = this.onDocClick.bind(this);
        this.render();
        this.bind();
    }

    CustomSelect.prototype.render = function () {
        var self = this;

        this.wrap = document.createElement('div');
        this.wrap.className = 'cs';

        // Gatilho
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'cs-trigger';
        this.trigger.id = this.id + '-trigger';
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.setAttribute('aria-controls', this.id + '-list');
        if (this.label) {
            if (!this.label.id) this.label.id = this.id + '-label';
            this.trigger.setAttribute('aria-labelledby', this.label.id + ' ' + this.trigger.id);
        }

        this.valueEl = document.createElement('span');
        this.valueEl.className = 'cs-value';
        var arrow = document.createElement('span');
        arrow.className = 'cs-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        this.trigger.appendChild(this.valueEl);
        this.trigger.appendChild(arrow);

        // Listbox
        this.list = document.createElement('ul');
        this.list.className = 'cs-list';
        this.list.id = this.id + '-list';
        this.list.setAttribute('role', 'listbox');
        this.list.tabIndex = -1;
        if (this.label) this.list.setAttribute('aria-labelledby', this.label.id);

        this.optionEls = [];
        Array.prototype.forEach.call(this.native.options, function (opt, i) {
            var li = document.createElement('li');
            li.className = 'cs-option';
            li.id = self.id + '-opt-' + i;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
            li.dataset.index = i;
            if (opt.value === '') li.classList.add('cs-placeholder');

            var lbl = document.createElement('span');
            lbl.className = 'cs-option-label';
            lbl.textContent = opt.textContent;
            var check = document.createElement('span');
            check.className = 'cs-check';
            check.setAttribute('aria-hidden', 'true');

            li.appendChild(lbl);
            li.appendChild(check);
            self.list.appendChild(li);
            self.optionEls.push(li);
        });

        // Esconde o nativo (mantém no DOM para valor/submit)
        this.native.classList.add('cs-native');
        this.native.setAttribute('tabindex', '-1');
        this.native.setAttribute('aria-hidden', 'true');

        this.native.parentNode.insertBefore(this.wrap, this.native);
        this.wrap.appendChild(this.trigger);
        this.wrap.appendChild(this.list);
        this.wrap.appendChild(this.native);

        this.syncValue();
    };

    CustomSelect.prototype.syncValue = function () {
        var idx = this.native.selectedIndex;
        var opt = this.native.options[idx];
        this.valueEl.textContent = opt ? opt.textContent : '';
        this.valueEl.classList.toggle('cs-value-placeholder', !!opt && opt.value === '');
        this.optionEls.forEach(function (li, i) {
            li.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
    };

    CustomSelect.prototype.openList = function () {
        if (this.open) return;
        this.open = true;
        this.wrap.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.setActive(this.native.selectedIndex >= 0 ? this.native.selectedIndex : 0);
        this.list.focus();
        document.addEventListener('click', this.onDocClick);
    };

    CustomSelect.prototype.closeList = function (focusTrigger) {
        if (!this.open) return;
        this.open = false;
        this.wrap.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.clearActive();
        document.removeEventListener('click', this.onDocClick);
        if (focusTrigger) this.trigger.focus();
    };

    CustomSelect.prototype.setActive = function (i) {
        this.clearActive();
        if (i < 0 || i >= this.optionEls.length) return;
        this.activeIndex = i;
        var li = this.optionEls[i];
        li.classList.add('active');
        this.list.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
    };

    CustomSelect.prototype.clearActive = function () {
        this.optionEls.forEach(function (li) { li.classList.remove('active'); });
        this.list.removeAttribute('aria-activedescendant');
        this.activeIndex = -1;
    };

    CustomSelect.prototype.choose = function (i) {
        if (i < 0 || i >= this.native.options.length) return;
        var changed = this.native.selectedIndex !== i;
        this.native.selectedIndex = i;
        this.syncValue();
        if (changed) this.native.dispatchEvent(new Event('change', { bubbles: true }));
        this.native.dispatchEvent(new CustomEvent('cs:select', {
            bubbles: true,
            detail: { value: this.native.value, changed: changed }
        }));
    };

    CustomSelect.prototype.onDocClick = function (e) {
        if (!this.wrap.contains(e.target)) this.closeList(false);
    };

    CustomSelect.prototype.bind = function () {
        var self = this;

        this.trigger.addEventListener('click', function () {
            self.open ? self.closeList(true) : self.openList();
        });

        this.trigger.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self.openList();
            }
        });

        this.list.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    self.setActive(Math.min(self.activeIndex + 1, self.optionEls.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    self.setActive(Math.max(self.activeIndex - 1, 0));
                    break;
                case 'Home':
                    e.preventDefault();
                    self.setActive(0);
                    break;
                case 'End':
                    e.preventDefault();
                    self.setActive(self.optionEls.length - 1);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    self.choose(self.activeIndex);
                    self.closeList(true);
                    break;
                case 'Escape':
                    e.preventDefault();
                    self.closeList(true);
                    break;
                case 'Tab':
                    self.closeList(false);
                    break;
            }
        });

        this.optionEls.forEach(function (li, i) {
            li.addEventListener('click', function () {
                self.choose(i);
                self.closeList(true);
            });
            li.addEventListener('mousemove', function () { self.setActive(i); });
        });

        // Rótulo foca/abre o dropdown customizado
        if (this.label) {
            this.label.addEventListener('click', function (e) {
                e.preventDefault();
                self.trigger.focus();
            });
        }
    };

    function initCustomSelects() {
        var selects = document.querySelectorAll('select[data-custom-select]');
        Array.prototype.forEach.call(selects, function (s) {
            if (!s.dataset.csReady) {
                new CustomSelect(s);
                s.dataset.csReady = '1';
            }
        });
    }

    window.CustomSelect = CustomSelect;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomSelects);
    } else {
        initCustomSelects();
    }
})();
