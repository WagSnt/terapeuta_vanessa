/* =====================================================
   VANESSA SANTOS — TERAPEUTA
   main.js
===================================================== */

(function () {
  'use strict';

  /* ===================================================
     REFERÊNCIAS DOM
  =================================================== */
  const header     = document.getElementById('header');
  const navToggle  = document.getElementById('navToggle');
  const navLinks   = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  /* ===================================================
     HEADER — SCROLL FIXO COM FUNDO
  =================================================== */
  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ===================================================
     MENU MOBILE
  =================================================== */
  function openMenu() {
    navOverlay.style.display = 'block';
    // Força reflow para que a transição de opacidade dispare corretamente
    navOverlay.offsetHeight; // eslint-disable-line no-unused-expressions
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    navOverlay.style.display = 'none';
  }

  navToggle.addEventListener('click', function () {
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navOverlay.addEventListener('click', closeMenu);

  // Fechar ao clicar em qualquer link
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Fechar com tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });

  /* ===================================================
     NAVEGAÇÃO SUAVE — SCROLL COM OFFSET DO HEADER
  =================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = header.offsetHeight;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ===================================================
     ANIMAÇÕES DE ENTRADA AO ROLAR (INTERSECTION OBSERVER)
  =================================================== */
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold:  0.10,
      rootMargin: '0px 0px -56px 0px'
    });

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });

  } else {
    // Fallback: mostrar tudo imediatamente para navegadores sem suporte
    animatedElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ===================================================
     ACTIVE LINK — DESTACAR SEÇÃO ATUAL NO MENU
  =================================================== */
  const sections = document.querySelectorAll('section[id], div[id="home"]');
  const navItems = document.querySelectorAll('.nav-link');

  function setActiveLink() {
    const scrollY = window.scrollY + header.offsetHeight + 60;

    sections.forEach(function (section) {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navItems.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });

})();
