class ProcessCarousel {
    constructor() {
        this.carousel = document.getElementById('processCarousel');
        this.track = this.carousel?.querySelector('.process-track');
        this.cards = this.carousel?.querySelectorAll('.process-card');
        this.bullets = document.querySelectorAll('#processBullets .bullet');
        
        this.currentIndex = 0;
        this.autoplayInterval = null;
        this.autoplayDelay = 7000; // 7 segundos
        this.isTransitioning = false;
        
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;

        this.disabled = false;
        this.mq = window.matchMedia('(min-width: 1024px)');

        if (this.carousel && this.track && this.cards.length > 0) {
            this.init();
        }
    }

    init() {
        // Configura bullets
        this.bullets.forEach((bullet, index) => {
            bullet.addEventListener('click', () => this.goToSlide(index));
        });

        // Configura touch events para swipe
        this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        // Configura scroll horizontal (mouse wheel e trackpad)
        this.carousel.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Inicia autoplay
        this.startAutoplay();

        // Pausa autoplay quando a tab não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoplay();
            } else {
                this.startAutoplay();
            }
        });

        // Pausa autoplay quando usuário sai da seção
        this.setupIntersectionObserver();

        // Desktop (>=1024px) usa grade CSS: desativa o carrossel; reativa no mobile
        this.mq.addEventListener('change', (e) => {
            e.matches ? this.disable() : this.enable();
        });
        if (this.mq.matches) this.disable();
    }

    disable() {
        this.disabled = true;
        this.stopAutoplay();
        if (this.track) this.track.style.transform = '';
    }

    enable() {
        this.disabled = false;
        if (this.track) this.track.style.transform = `translateX(${-this.currentIndex * 100}%)`;
        this.startAutoplay();
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            threshold: 0.3
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startAutoplay();
                } else {
                    this.stopAutoplay();
                }
            });
        }, options);
        
        const processSection = document.querySelector('.process');
        if (processSection) {
            observer.observe(processSection);
        }
    }
    
    goToSlide(index, resetAutoplay = true) {
        if (this.disabled) return;
        if (this.isTransitioning || index === this.currentIndex) return;
        
        this.isTransitioning = true;
        
        // Remove classe active do card atual
        this.cards[this.currentIndex]?.classList.remove('active');
        this.bullets[this.currentIndex]?.classList.remove('active');
        
        // Atualiza index
        this.currentIndex = index;
        
        // Adiciona classe active no novo card
        this.cards[this.currentIndex]?.classList.add('active');
        this.bullets[this.currentIndex]?.classList.add('active');
        
        // Move o carousel
        const offset = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${offset}%)`;
        
        // Reset autoplay se necessário
        if (resetAutoplay) {
            this.stopAutoplay();
            this.startAutoplay();
        }
        
        // Permite nova transição após animação
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.cards.length;
        this.goToSlide(nextIndex, false);
    }
    
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        this.goToSlide(prevIndex, true);
    }
    
    startAutoplay() {
        if (this.disabled) return;
        this.stopAutoplay(); // Limpa qualquer interval existente
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoplayDelay);
    }
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > this.minSwipeDistance) {
            if (diff > 0) {
                // Swipe left - próximo
                const nextIndex = (this.currentIndex + 1) % this.cards.length;
                this.goToSlide(nextIndex);
            } else {
                // Swipe right - anterior
                const prevIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
                this.goToSlide(prevIndex);
            }
        }
    }
    
    handleWheel(e) {
        // Previne scroll da página quando dentro do carousel
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            
            // Throttle para evitar múltiplas trocas rápidas
            if (this.isTransitioning) return;
            
            if (e.deltaX > 20) {
                // Scroll para direita - próximo
                const nextIndex = (this.currentIndex + 1) % this.cards.length;
                this.goToSlide(nextIndex);
            } else if (e.deltaX < -20) {
                // Scroll para esquerda - anterior
                const prevIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
                this.goToSlide(prevIndex);
            }
        }
    }
}

// Inicializa o carousel quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProcessCarousel();
    });
} else {
    new ProcessCarousel();
}