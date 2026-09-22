/* ============================================
   STUDY ENGLISH — USER MANUAL
   app.js — Interactive features
   ============================================ */

// === THEME MANAGER ===
const ThemeManager = {
  key: 'study-en-theme',
  current: 'dark',

  init() {
    const saved = localStorage.getItem(this.key);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.current = saved || preferred;
    this.apply(this.current);
    this.updateToggleIcons();
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.current = theme;
    localStorage.setItem(this.key, theme);
  },

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    this.updateToggleIcons();
  },

  updateToggleIcons() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = this.current === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('title', this.current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    });
  }
};

// === NAVBAR ===
const Navbar = {
  init() {
    // Theme toggle
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => ThemeManager.toggle());
    });

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        const isOpen = navLinks.classList.contains('open');
        menuToggle.querySelector('span:nth-child(1)').style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
        menuToggle.querySelector('span:nth-child(2)').style.opacity = isOpen ? '0' : '';
        menuToggle.querySelector('span:nth-child(3)').style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
      });

      // Close on link click
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
        });
      });
    }

    // Active link highlight
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.style.boxShadow = window.scrollY > 20
          ? 'var(--shadow-lg)'
          : 'var(--shadow-md), 0 0 0 1px var(--border-color)';
      }
    }, { passive: true });
  }
};

// === SCROLL ANIMATIONS ===
const ScrollAnimations = {
  observer: null,

  init() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    document.querySelectorAll('.animate-on-scroll, .animate-stagger').forEach(el => {
      this.observer.observe(el);
    });
  }
};

// === COPY CODE ===
const CodeCopy = {
  init() {
    document.querySelectorAll('.prompt-code').forEach(block => {
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(block.textContent.replace('Copy', '').trim())
          .then(() => {
            btn.textContent = '✓ Copied!';
            btn.style.color = 'var(--emerald)';
            btn.style.borderColor = 'var(--emerald)';
            setTimeout(() => {
              btn.textContent = 'Copy';
              btn.style.color = '';
              btn.style.borderColor = '';
            }, 2000);
          })
          .catch(() => {
            btn.textContent = 'Failed';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
          });
      });
      block.style.position = 'relative';
      block.appendChild(btn);
    });
  }
};

// === SMOOTH SCROLL ===
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = 100;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }
};

// === PARTICLES (Hero) ===
const Particles = {
  init() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.color = ['#6366f1', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 3)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      resize();
      particles = Array.from({ length: 80 }, () => new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - dist / 100) * 0.08;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      animFrame = requestAnimationFrame(animate);
    };

    init();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      particles.forEach(p => p.reset());
    });
    resizeObserver.observe(canvas);
  }
};

// === FLOW DIAGRAM ANIMATION ===
const FlowAnimation = {
  init() {
    document.querySelectorAll('.flow-node').forEach((node, i) => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(20px)';
      setTimeout(() => {
        node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
      }, 300 + i * 120);
    });
  }
};

// === STATS COUNTER ===
const StatsCounter = {
  init() {
    const stats = document.querySelectorAll('[data-count]');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          let current = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current) + suffix;
            if (current >= target) clearInterval(timer);
          }, 16);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(s => observer.observe(s));
  }
};

// === TOOLTIP ===
const Tooltip = {
  init() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.style.position = 'relative';

      el.addEventListener('mouseenter', () => {
        const tip = document.createElement('div');
        tip.className = 'tooltip-popup';
        tip.textContent = el.dataset.tooltip;
        tip.style.cssText = `
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 999;
          box-shadow: var(--shadow-md);
          opacity: 0;
          transition: opacity 0.2s ease;
        `;
        el.appendChild(tip);
        requestAnimationFrame(() => { tip.style.opacity = '1'; });
      });

      el.addEventListener('mouseleave', () => {
        const tip = el.querySelector('.tooltip-popup');
        if (tip) tip.remove();
      });
    });
  }
};

// === INIT ALL ===
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Navbar.init();
  ScrollAnimations.init();
  SmoothScroll.init();
  CodeCopy.init();
  Particles.init();
  StatsCounter.init();
  Tooltip.init();

  // Flow animation on scroll
  const flowDiagram = document.querySelector('.flow-diagram');
  if (flowDiagram) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        FlowAnimation.init();
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    obs.observe(flowDiagram);
  }
});
