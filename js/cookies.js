/* =====================================================
   VANESSA SANTOS — TERAPEUTA
   js/cookies.js — Consentimento LGPD
   Gerencia preferências de cookies/armazenamento local
   e aplica bloqueio de YouTube quando necessário.
===================================================== */
;(function () {
  'use strict';

  var STORAGE_KEY = 'lgpd_consent'; // 'all' | 'essential'
  var BANNER_ID   = 'lgpdBanner';

  /* ── Lê preferência salva ──────────────────────── */
  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (_) { return null; }
  }

  /* ── Persiste preferência e fecha banner ───────── */
  function saveConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
    hideBanner();
    if (value === 'essential') applyEssentialMode();
  }

  /* ── Oculta banner com slide-down ──────────────── */
  function hideBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;
    banner.classList.add('lgpd-banner--hidden');
    banner.classList.remove('lgpd-banner--visible');
    setTimeout(function () {
      banner.setAttribute('aria-hidden', 'true');
      banner.style.display = 'none';
    }, 380);
  }

  /* ── Exibe banner com slide-up ─────────────────── */
  function showBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;
    banner.style.display = '';
    banner.offsetHeight; // reflow para disparar transição
    banner.classList.add('lgpd-banner--visible');
    banner.removeAttribute('aria-hidden');
  }

  /* ── Modo "apenas essenciais":                    ─
     Substitui iframes do YouTube por placeholders   ─
     com clique para carregar.                       ─ */
  function applyEssentialMode() {
    document.querySelectorAll('iframe[src*="youtube"]').forEach(function (iframe) {
      var match   = iframe.src.match(/embed\/([^?&#]+)/);
      var videoId = match ? match[1] : null;
      if (!videoId) return;

      var title = iframe.title || 'Vídeo do YouTube';
      var thumb = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';

      var placeholder = document.createElement('div');
      placeholder.className = 'yt-gate';
      placeholder.setAttribute('role', 'figure');
      placeholder.setAttribute('aria-label', title);
      placeholder.innerHTML =
        '<img src="' + thumb + '" alt="Miniatura: ' + title + '" loading="lazy" width="560" height="315">' +
        '<div class="yt-gate-overlay">' +
          '<button class="yt-gate-btn" type="button">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
          '</button>' +
          '<p class="yt-gate-note">Ao carregar você aceita os termos do YouTube</p>' +
        '</div>';

      placeholder.querySelector('button').setAttribute('aria-label', 'Carregar vídeo: ' + title);

      // Carrega vídeo ao clicar
      placeholder.querySelector('button').addEventListener('click', function () {
        var newIframe             = document.createElement('iframe');
        newIframe.src             = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1';
        newIframe.title           = title;
        newIframe.width           = '560';
        newIframe.height          = '315';
        newIframe.frameBorder     = '0';
        newIframe.allow           = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        newIframe.allowFullscreen = true;
        newIframe.setAttribute('loading', 'lazy');
        placeholder.replaceWith(newIframe);
      });

      iframe.replaceWith(placeholder);
    });
  }

  /* ── Inicialização ─────────────────────────────── */
  var consent = getConsent();

  if (!consent) {
    // Sem preferência → exibir banner após pequena espera
    window.addEventListener('load', function () {
      setTimeout(showBanner, 900);
    });
  } else if (consent === 'essential') {
    // Aplicar modo restritivo assim que o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyEssentialMode);
    } else {
      applyEssentialMode();
    }
  }

  /* ── Eventos dos botões ────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var btnAll   = document.getElementById('lgpdBtnAll');
    var btnEss   = document.getElementById('lgpdBtnEssential');
    var btnClose = document.getElementById('lgpdBtnClose');

    if (btnAll)   btnAll.addEventListener('click',   function () { saveConsent('all'); });
    if (btnEss)   btnEss.addEventListener('click',   function () { saveConsent('essential'); });
    if (btnClose) btnClose.addEventListener('click', function () { saveConsent('essential'); });
  });

})();
