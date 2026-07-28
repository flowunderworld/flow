// Previne flash de conteúdo não estilizado
document.body.classList.add('loading');

// Animação de fade-in ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const heroContainer = document.querySelector('.hero-container');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    // Remove classe de loading
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    }, 50);
    
    // Fade-in suave do conteúdo da hero
    if (heroContainer) {
        heroContainer.style.opacity = '0';
        heroContainer.style.transform = 'translateY(30px)';
        heroContainer.style.transition = 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            heroContainer.style.opacity = '1';
            heroContainer.style.transform = 'translateY(0)';
        }, 150);
    }
    
    // Fade-in das setas com delay
    if (scrollIndicator) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.transition = 'opacity 1.2s ease-in';
        
        setTimeout(() => {
            scrollIndicator.style.opacity = '1';
        }, 1000);
    }
});

// O CTA do header abre o modal de briefing (ver js/briefing-modal.js).
// O scroll até #calculator saiu daqui junto com a calculadora, que hoje vive
// em confeccao.html.

// Destaca no menu do desktop a seção visível (IntersectionObserver)
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = Array.from(document.querySelectorAll('.header-nav-link'));
    if (!navLinks.length) return;

    const linkFor = {};
    navLinks.forEach((link) => {
        // Ignora links para outra página (ex.: confeccao.html) — só âncoras
        // internas participam do scroll-spy.
        const href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        linkFor[href.slice(1)] = link;
    });

    const sections = Object.keys(linkFor)
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    const setActive = (id) => {
        navLinks.forEach((l) => l.classList.remove('active'));
        if (linkFor[id]) linkFor[id].classList.add('active');
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
    }, {
        // Considera a seção "ativa" quando cruza a faixa logo abaixo do header
        rootMargin: '-45% 0px -50% 0px',
        threshold: 0
    });

    sections.forEach((s) => observer.observe(s));
});

// Adiciona pequena interação ao scroll
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Adiciona sombra ao header quando houver scroll
    if (currentScroll > 10) {
        header?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
}, { passive: true });