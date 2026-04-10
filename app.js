/* =========================================
   DIRECTOR MARKET — Interactivity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // --- Drag-to-Submit Logic ---
    const submitSlider = document.getElementById('submitSlider');
    const submitThumb = document.getElementById('submitThumb');
    const actualBtn = document.getElementById('actualSubmitBtn');
    
    if (submitSlider && submitThumb && actualBtn) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
        let maxDrag = 0;
        
        const initDrag = () => {
            maxDrag = submitSlider.offsetWidth - submitThumb.offsetWidth - 6; // 6 for padding (3px each side)
        };
        initDrag();
        window.addEventListener('resize', initDrag);

        const formSuckTarget = document.getElementById('formSuckTarget');
        const planetLeft = document.querySelector('.inquiry-planet-left img');
        const planetRight = document.querySelector('.inquiry-planet-right img');

        const updatePlanetLighting = (progress) => {
            if (!planetLeft || !planetRight) return;

            // Simple linear interpolation for brightness
            // Left: 1.2 -> 0.3
            // Right: 0.3 -> 1.2
            const bLeft = 1.2 - (progress * 0.9);
            const bRight = 0.3 + (progress * 0.9);

            planetLeft.style.filter = `brightness(${bLeft})`;
            planetRight.style.filter = `brightness(${bRight})`;
        };

        const updateSuckEffect = (progress) => {
            // Adjust translation distance - 600px for a more dramatic slide off-screen
            const translateX = progress * 600;
            const opacity = 1 - (progress * 1.1);
            const blur = progress * 4;

            if (formSuckTarget) {
                formSuckTarget.style.transform = `translateX(${translateX}px)`;
                formSuckTarget.style.opacity = Math.max(0, opacity);
                formSuckTarget.style.filter = `blur(${blur}px)`;
            }
        };

        const submitFormWithAnimation = () => {
            if (submitSlider.classList.contains('success')) return;

            const form = submitSlider.closest('form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                // Reset thumb if it was moved
                submitThumb.style.transition = 'transform 0.4s ease';
                submitThumb.style.transform = `translateX(0px)`;
                updateSuckEffect(0);
                updatePlanetLighting(0);
                return;
            }

            // Success Animation
            if (formSuckTarget) formSuckTarget.classList.add('animating');
            submitThumb.style.transition = 'transform 0.4s ease';
            submitThumb.style.transform = `translateX(${maxDrag}px)`;
            updateSuckEffect(1);
            updatePlanetLighting(1);
            submitSlider.classList.add('success');
            
            setTimeout(() => {
                actualBtn.click();
            }, 400);
        };

        const onDragStart = (e) => {
            if (submitSlider.classList.contains('success')) return;
            isDragging = true;
            hasMoved = false;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            submitThumb.classList.add('dragging');
            submitThumb.style.transition = 'none'; // No transition while dragging
            
            if (formSuckTarget) formSuckTarget.classList.remove('animating');
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            
            // Prevent scrolling while dragging on touch
            if (e.type === 'touchmove') e.preventDefault();
            
            hasMoved = true;
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let deltaX = currentX - startX;
            
            if (deltaX < 0) deltaX = 0;
            if (deltaX > maxDrag) deltaX = maxDrag;
            
            const progress = deltaX / maxDrag;
            submitThumb.style.transform = `translateX(${deltaX}px)`;
            updateSuckEffect(progress);
            updatePlanetLighting(progress);
        };

        const onDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            submitThumb.classList.remove('dragging');
            
            const currentTransform = submitThumb.style.transform;
            const currentX = parseInt(currentTransform.replace(/[^0-9.]/g, '')) || 0;
            
            if (currentX >= maxDrag * 0.9) {
                submitFormWithAnimation();
            } else {
                // Snap back
                if (formSuckTarget) formSuckTarget.classList.add('animating');
                submitThumb.style.transition = 'transform 0.4s ease';
                submitThumb.style.transform = `translateX(0px)`;
                updateSuckEffect(0);
                updatePlanetLighting(0);
            }
        };

        submitThumb.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        
        submitThumb.addEventListener('touchstart', onDragStart, {passive: true});
        window.addEventListener('touchmove', onDragMove, {passive: false});
        window.addEventListener('touchend', onDragEnd);

        // Click support for the entire slider
        submitSlider.addEventListener('click', (e) => {
            // Submit if the slider is not successful and no significant drag movement occurred
            if (!submitSlider.classList.contains('success') && !hasMoved) {
                submitFormWithAnimation();
            }
        });
    }

    // --- Particles Background ---
    createParticles();

    // --- Solar System Background has been removed from contact page ---
    // --- Nav scroll behavior ---
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        // Update solar system rotation based on scroll
        document.documentElement.style.setProperty('--scroll-rotation', window.scrollY * 0.1);
    });

    // --- Mobile hamburger ---
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    hamburger?.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // --- Scroll animations (custom AOS) ---
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

    // --- Smooth scroll for nav links & Active state switching ---
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set initial active state based on current page/hash
    const updateActiveNav = () => {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active');
            
            if (currentPath.includes('work.html') && href.includes('work.html')) {
                link.classList.add('active');
            } else if (currentPath.includes('contact.html') && href.includes('contact.html')) {
                link.classList.add('active');
            } else if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
                if (currentHash === '#blog' && href.includes('#blog')) {
                    link.classList.add('active');
                } else if ((currentHash === '#hero' || currentHash === '#about' || !currentHash) && href.includes('#hero')) {
                    link.classList.add('active');
                }
            }
        });
    };

    updateActiveNav();
    window.addEventListener('hashchange', updateActiveNav);

    document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') || href.includes(window.location.pathname)) {
                e.preventDefault();
                const targetId = href.split('#')[1];
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update URL hash without jumping
                    history.pushState(null, null, `#${targetId}`);
                    updateActiveNav();
                }
            }
        });
    });


    // --- Parallax on hero ---
    const heroImg = document.querySelector('.hero-img');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight && heroImg) {
            heroImg.style.transform = `scale(${1 + scrolled * 0.0003})`;
        }
    });

    // --- Client Logos "Emerge from Earth" Animation ---
    const clientsSection = document.querySelector('.section-clients');
    const clientLogos = document.querySelectorAll('.client-logo-float');

    const handleClientAnimation = () => {
        if (!clientsSection) return;

        const rect = clientsSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate how much the section has entered the viewport (0 to 1)
        // Starts animating when the top of the section enters the bottom of the screen
        let revealProgress = (windowHeight - rect.top) / (windowHeight * 0.8);
        revealProgress = Math.max(0, Math.min(1, revealProgress));

        clientLogos.forEach((logo, i) => {
            const speed = parseFloat(logo.getAttribute('data-parallax')) || 0.1;
            
            // emergeY: 섹션이 보이기 시작할 때 100px 아래에서 시작하여 0으로 수렴
            const emergeY = (1 - revealProgress) * 100;
            
            // 로컬 패럴랙스: 섹션 노출 정도에 따라 최대 -40px 정도만 위로 이동하도록 설정 (간격 축소 반영)
            const scrollParallax = revealProgress * -40 * speed;


            // 최종 트랜스폼 적용
            logo.style.opacity = revealProgress;
            logo.style.transform = `translateY(${emergeY + scrollParallax}px) scale(${0.8 + revealProgress * 0.2})`;
            
            if (revealProgress > 0.8) {
                logo.classList.add('emerged');
            } else {
                logo.classList.remove('emerged');
            }
        });


    };

    window.addEventListener('scroll', handleClientAnimation);
    handleClientAnimation(); // Initial check


    // --- Service cards stagger animation ---
    const cards = document.querySelectorAll('.service-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 150);
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        cardObserver.observe(card);
    });

    // --- Client logos hover glow ---
    document.querySelectorAll('.client-logo').forEach(logo => {
        logo.addEventListener('mouseenter', function () {
            this.style.boxShadow = '0 0 30px rgba(230,60,47,0.06)';
        });
        logo.addEventListener('mouseleave', function () {
            this.style.boxShadow = 'none';
        });
    });
});

/* --- Star Particles --- */
function createParticles() {
    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 300;
    // 70% decrease of [2, 4, 6, 8, 12] -> roughly [0.6, 1.2, 1.8, 2.4, 3.6]
    const SIZES = [0.6, 1.2, 1.8, 2.4, 3.6];

    let mouse = { x: -1000, y: -1000 };
    let trail = [];
    const TRAIL_LENGTH = 20;

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const size = SIZES[Math.floor(Math.random() * SIZES.length)];
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: size,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.3, // Brighter base alpha
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            // Mouse Interaction (피하기)
            let dx = mouse.x - p.x;
            let dy = mouse.y - p.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let maxDistance = 200;

            if (distance < maxDistance && distance > 0) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (maxDistance - distance) / maxDistance;
                p.x -= forceDirectionX * force * 5;
                p.y -= forceDirectionY * force * 5;
            }

            // Normal movement
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.05; // Faster pulsing for twinkling effect

            // Boundaries
            if (p.x < -p.radius * 2) p.x = canvas.width + p.radius * 2;
            if (p.x > canvas.width + p.radius * 2) p.x = -p.radius * 2;
            if (p.y < -p.radius * 2) p.y = canvas.height + p.radius * 2;
            if (p.y > canvas.height + p.radius * 2) p.y = -p.radius * 2;

            const currentAlpha = p.alpha + Math.sin(p.pulse) * 0.4;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, currentAlpha)})`;
            // Glowing star effect
            ctx.shadowBlur = p.radius * 4;
            ctx.shadowColor = `rgba(255, 255, 255, ${Math.max(0.2, currentAlpha)})`;
            ctx.fill();
            // Reset shadow to prevent weird overlapping artifacts
            ctx.shadowBlur = 0;
        });

        // Shooting Star Mouse Trail
        if (mouse.x !== -1000) {
            trail.push({ x: mouse.x, y: mouse.y });
            if (trail.length > TRAIL_LENGTH) {
                trail.shift();
            }
        } else if (trail.length > 0) {
            trail.shift();
        }

        if (trail.length > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < trail.length - 1; i++) {
                const p1 = trail[i];
                const p2 = trail[i + 1];
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                const ratio = i / trail.length; // 0 to 1
                ctx.strokeStyle = `rgba(255, 255, 255, ${ratio * 0.8})`;
                ctx.lineWidth = ratio * 4;
                ctx.stroke();
            }

            // Draw head (glow)
            const head = trail[trail.length - 1];
            ctx.beginPath();
            ctx.arc(head.x, head.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(255, 255, 255, 1)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', resize);
}

/* --- Solar System Background --- */
function initSolarSystem() {
    // Avoid duplicate initialization
    if (document.querySelector('.solar-system-container')) return;

    const baseBg = document.createElement('div');
    baseBg.className = 'solar-system-base-bg';
    
    const container = document.createElement('div');
    container.className = 'solar-system-container';
    
    const overlay = document.createElement('div');
    overlay.className = 'solar-system-overlay';
    
    // Create Sun
    const sun = document.createElement('div');
    sun.className = 'sun';
    container.appendChild(sun);
    
    // Define Planets: name, distance (vmin)
    const planets = [
        { name: 'mercury', dist: 25 },
        { name: 'venus',   dist: 35 },
        { name: 'earth',   dist: 45 },
        { name: 'mars',    dist: 55 },
        { name: 'jupiter', dist: 75 },
        { name: 'saturn',  dist: 100 },
        { name: 'uranus',  dist: 125 },
        { name: 'neptune', dist: 145 }
    ];
    
    planets.forEach(p => {
        const orbit = document.createElement('div');
        orbit.className = 'orbit';
        orbit.style.width = `${p.dist * 2}vmin`;
        orbit.style.height = `${p.dist * 2}vmin`;
        
        // Random initial rotation for the orbit
        const initialRotation = Math.random() * 360;
        orbit.style.transform = `translate(-50%, -50%) rotate(${initialRotation}deg)`;
        
        // Create the planet
        const planet = document.createElement('div');
        planet.className = `planet ${p.name}`;
        
        // Randomize planet position along the orbit
        const planetPos = Math.random() * 360;
        planet.style.transform = `rotate(${planetPos}deg) translateY(-${p.dist}vmin)`;
        
        // Add Saturn's Rings
        if (p.name === 'saturn') {
            const rings = document.createElement('div');
            rings.className = 'saturn-rings';
            planet.appendChild(rings);
        }
        
        orbit.appendChild(planet);
        container.appendChild(orbit);
    });
    
    document.body.prepend(overlay);
    document.body.prepend(container);
    document.body.prepend(baseBg);
}
