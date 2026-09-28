/**
 * ====================================================================
 * Nhà Kính Thông Minh - Dynamic Greenhouse Particle Canvas System
 * Lightweight, 60fps Ambient Floating Leaves & Botanical Spores
 * ====================================================================
 */

'use strict';

(function(window) {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let animationId = null;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const PARTICLE_COUNT = 32;
    const particles = [];

    class BotanicalParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 20;
            this.size = Math.random() * 4 + 2;
            this.speedY = -(Math.random() * 0.45 + 0.25);
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.02;
            this.isLeaf = Math.random() > 0.45;
            this.hue = Math.random() > 0.3 ? 120 : 90; // Fresh greens and sunlit chartreuse
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.25;
            this.angle += this.spin;

            if (this.y < -30 || this.x < -30 || this.x > width + 30) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            if (this.isLeaf) {
                // Draw delicate stylized leaf
                ctx.fillStyle = `hsla(${this.hue}, 65%, 48%, ${this.opacity})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 1.8, this.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw soft glowing spore
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
                gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${this.opacity * 1.3})`);
                gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new BotanicalParticle());
    }

    function loop() {
        if (!document.hidden) {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
        }
        animationId = requestAnimationFrame(loop);
    }

    loop();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animationId = requestAnimationFrame(loop);
        }
    });
})(window);
