document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the index (about) page
    if (document.querySelector('body').classList.contains('about-page') || 
        window.location.pathname.endsWith('index.html') || 
        window.location.pathname.endsWith('/')) {
        
        // Handle "Try It" button animation
        const tryItBtn = document.querySelector('a.btn-primary[href="prediction.html"]');
        if (tryItBtn) {
            tryItBtn.addEventListener('mouseenter', function() {
                this.classList.add('animate__animated', 'animate__pulse');
            });
            
            tryItBtn.addEventListener('animationend', function() {
                this.classList.remove('animate__animated', 'animate__pulse');
            });
        }
        
        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // Account for fixed navbar
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Add GitHub link target
        const githubLink = document.querySelector('a[href*="github.com"]');
        if (githubLink && !githubLink.getAttribute('href').includes('yourusername')) {
            // If the placeholder is still there, update with a real repo link
            githubLink.setAttribute('href', 'https://github.com/ManasVerma007/image-recognition-service');
        }
        
        // Add fade-in animation for cards when scrolling
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('fade-in');
            observer.observe(card);
        });
    }
    
    // Add class to fix the CSS filename issue (styles.css vs style.css)
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach(link => {
        if (link.getAttribute('href') === 'css/styles.css') {
            link.setAttribute('href', 'css/style.css');
        }
    });
    
    // Add version info in footer if applicable
    const footer = document.querySelector('footer p');
    if (footer) {
        const today = new Date();
        footer.innerHTML += ` <span class="text-muted small">v1.0.0 (${today.getFullYear()})</span>`;
    }
});