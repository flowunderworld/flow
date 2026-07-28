class PortfolioCarousel {
    constructor() {
        this.carousel = document.getElementById('portfolioCarousel');
        this.track = this.carousel?.querySelector('.portfolio-track');
        this.slides = this.carousel?.querySelectorAll('.portfolio-slide');
        this.bullets = document.querySelectorAll('#portfolioBullets .bullet');
        
        this.currentIndex = 0;
        this.autoplayInterval = null;
        this.autoplayDelay = 7000; // 7 segundos
        this.isTransitioning = false;
        
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        
        if (this.carousel && this.track && this.slides.length > 0) {
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

        // Setas de navegação (desktop) + teclado
        this.prevBtn = this.carousel.querySelector('.portfolio-prev');
        this.nextBtn = this.carousel.querySelector('.portfolio-next');
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.go(-1));
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.go(1));

        this.carousel.setAttribute('tabindex', '0');
        this.carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); this.go(1); }
        });
    }

    go(direction) {
        const total = this.slides.length;
        const index = (this.currentIndex + direction + total) % total;
        this.goToSlide(index, true);
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
        
        const portfolioSection = document.querySelector('.portfolio');
        if (portfolioSection) {
            observer.observe(portfolioSection);
        }
    }
    
    goToSlide(index, resetAutoplay = true) {
        if (this.isTransitioning || index === this.currentIndex) return;
        
        this.isTransitioning = true;
        
        // Remove classe active do slide atual
        this.slides[this.currentIndex]?.classList.remove('active');
        this.bullets[this.currentIndex]?.classList.remove('active');
        
        // Atualiza index
        this.currentIndex = index;
        
        // Adiciona classe active no novo slide
        this.slides[this.currentIndex]?.classList.add('active');
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
        }, 600);
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex, false);
    }
    
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex, true);
    }
    
    startAutoplay() {
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
                const nextIndex = (this.currentIndex + 1) % this.slides.length;
                this.goToSlide(nextIndex);
            } else {
                // Swipe right - anterior
                const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
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
                const nextIndex = (this.currentIndex + 1) % this.slides.length;
                this.goToSlide(nextIndex);
            } else if (e.deltaX < -20) {
                // Scroll para esquerda - anterior
                const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
                this.goToSlide(prevIndex);
            }
        }
    }
}

// Inicializa o carousel quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PortfolioCarousel();
    });
} else {
    new PortfolioCarousel();
}