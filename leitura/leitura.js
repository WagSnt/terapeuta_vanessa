/**
 * leitura/leitura.js
 * Frontend da seção "Leitura do Dia"
 *
 * Estados da UI:
 *   idle      → Painel inicial com o verso da carta e botão
 *   loading   → Spinner enquanto a IA gera
 *   reading   → Carta revelada + texto + opções de compartilhamento
 *   capture   → Modal de captura de lead (após 1ª leitura sem cadastro)
 *   limit     → Limite diário atingido
 *   error     → Erro de comunicação
 *
 * localStorage:
 *   ldt_fp       — visitorId do FingerprintJS (cache para evitar re-inicialização)
 *   ldt_lead     — JSON { id, sign } do lead cadastrado
 *   ldt_today    — JSON { date, card, reading } da leitura de hoje (cache de exibição)
 */
;(function () {
  'use strict'

  // ── Referências DOM ──────────────────────────────────────────
  const $ = id => document.getElementById(id)

  const panels = {
    idle:    $('ldtPanelIdle'),
    loading: $('ldtPanelLoading'),
    reading: $('ldtPanelReading'),
    limit:   $('ldtPanelLimit'),
    error:   $('ldtPanelError'),
  }

  // ── Overlay: abrir / fechar ──────────────────────────────────
  function openOverlay() {
    const overlay = $('ldtOverlay')
    if (!overlay) return

    overlay.hidden = false
    document.body.style.overflow = 'hidden'

    // Foco no primeiro elemento interativo para acessibilidade
    requestAnimationFrame(() => {
      $('ldtOverlayClose')?.focus()
    })
  }

  function closeOverlay() {
    const overlay = $('ldtOverlay')
    if (!overlay) return

    overlay.hidden = true
    document.body.style.overflow = ''

    // Fechar também o modal de lead se estiver aberto
    closeLeadModal()
  }

  // ── Estado interno ───────────────────────────────────────────
  let state = {
    fp:          localStorage.getItem('ldt_fp')    || null,
    lead:        null,  // { id, sign } — preenchido após cadastro ou restaurado do LS
    currentRead: null,  // { card, reading } da leitura corrente
  }

  // Restaurar lead do localStorage
  try {
    const raw = localStorage.getItem('ldt_lead')
    if (raw) state.lead = JSON.parse(raw)
  } catch (_) {}

  // ── Utilitários ──────────────────────────────────────────────
  function getTodayBrasilia() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  }

  function saveLead(data) {
    state.lead = data
    localStorage.setItem('ldt_lead', JSON.stringify(data))
  }

  function cacheToday(card, reading) {
    localStorage.setItem('ldt_today', JSON.stringify({
      date: getTodayBrasilia(), card, reading,
    }))
  }

  function getCachedToday() {
    try {
      const raw = localStorage.getItem('ldt_today')
      if (!raw) return null
      const data = JSON.parse(raw)
      if (data.date === getTodayBrasilia()) return data
      localStorage.removeItem('ldt_today')
      return null
    } catch (_) { return null }
  }

  // Ícone por naipe (exibido na frente da carta)
  function suitIcon(suit) {
    return { maior: '✦', paus: '✶', copas: '♡', espadas: '✧', ouros: '◆' }[suit] || '✦'
  }

  // ── Renderização de estados ──────────────────────────────────
  function showPanel(name) {
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== name
    })
  }

  function showReading(card, reading) {
    // Preencher frente da carta
    $('ldtCardSuitIcon').textContent  = suitIcon(card.suit)
    $('ldtCardName').textContent      = card.name
    $('ldtCardPosition').textContent  = card.reversed ? 'Posição Invertida' : 'Posição Normal'

    // Renderizar texto (preserva o símbolo ✨ e parágrafos)
    const paragraphs = reading.split(/\n+/).filter(p => p.trim())
    $('ldtReadingText').innerHTML = paragraphs
      .map(p => `<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`)
      .join('')

    showPanel('reading')
    state.currentRead = { card, reading }

    // Flip com delay para o CSS estar rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        $('ldtCard')?.classList.add('is-flipped')
      })
    })
  }

  function showLimit(resetMessage) {
    const el = $('ldtNextReset')
    if (el && resetMessage) el.textContent = resetMessage

    // Mostrar botão de re-compartilhar se tiver leitura cacheada
    const cached = getCachedToday()
    const btnShare = $('ldtBtnShareAgain')
    if (btnShare) {
      btnShare.hidden = !cached
      if (cached) state.currentRead = { card: cached.card, reading: cached.reading }
    }

    showPanel('limit')
  }

  // ── Obter fingerprint ────────────────────────────────────────
  async function getFingerprint() {
    if (state.fp) return state.fp

    // FingerprintJS v4 carregado via CDN <script> como IIFE (window.FingerprintJS)
    if (typeof FingerprintJS === 'undefined') {
      // Fallback: gera ID aleatório se CDN não carregar
      const fallback = 'fp_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      state.fp = fallback
      localStorage.setItem('ldt_fp', fallback)
      return fallback
    }

    const fp     = await FingerprintJS.load()
    const result = await fp.get()
    state.fp     = result.visitorId
    localStorage.setItem('ldt_fp', state.fp)
    return state.fp
  }

  // ── Requisitar leitura ───────────────────────────────────────
  async function requestReading() {
    showPanel('loading')

    let fp
    try {
      fp = await getFingerprint()
    } catch (err) {
      console.error('[ldt] fingerprint error:', err)
      fp = 'fp_' + Date.now().toString(36)
    }

    try {
      const body = { fingerprintId: fp }
      if (state.lead?.id)   body.leadId = state.lead.id
      if (state.lead?.sign) body.sign   = state.lead.sign

      const res  = await fetch('/api/reading', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await res.json()

      if (res.status === 429) {
        showLimit(data.resetMessage || '')
        return
      }

      if (!res.ok) {
        throw new Error(data.message || 'Erro desconhecido')
      }

      // Cache da leitura de hoje
      cacheToday(data.card, data.reading)

      showReading(data.card, data.reading)

      // Se não tem lead cadastrado, abrir modal de captura após a carta revelar
      if (!state.lead) {
        setTimeout(() => openLeadModal(), 900)
      }

    } catch (err) {
      console.error('[ldt] reading error:', err)
      $('ldtErrorText').textContent = err.message || 'Não foi possível gerar sua leitura. Tente novamente.'
      showPanel('error')
    }
  }

  // ── Modal de lead ────────────────────────────────────────────
  function openLeadModal() {
    const backdrop = $('ldtModalBackdrop')
    if (backdrop) {
      backdrop.hidden = false
      backdrop.removeAttribute('aria-hidden')
      $('ldtFieldName')?.focus()
    }
  }

  function closeLeadModal() {
    const backdrop = $('ldtModalBackdrop')
    if (backdrop) {
      backdrop.hidden = true
      backdrop.setAttribute('aria-hidden', 'true')
    }
  }

  async function submitLead(e) {
    e.preventDefault()

    const form  = e.target
    const name  = form.name.value.trim()
    const email = form.email.value.trim()
    const sign  = form.sign.value

    // Limpar erros anteriores
    $('ldtFormError').hidden = true

    // Validação básica no cliente
    let hasError = false
    ;[form.name, form.email, form.sign].forEach(field => field.classList.remove('invalid'))

    if (!name)  { form.name.classList.add('invalid');  hasError = true }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.email.classList.add('invalid'); hasError = true
    }
    if (!sign)  { form.sign.classList.add('invalid');  hasError = true }

    if (hasError) {
      showFormError('Preencha todos os campos corretamente.')
      return
    }

    const btn = $('ldtFormSubmit')
    btn.disabled    = true
    btn.textContent = 'Salvando...'

    try {
      const res  = await fetch('/api/lead', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, sign }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Erro ao salvar cadastro.')

      // Salvar lead no state e localStorage
      saveLead({ id: data.leadId, sign })

      // Mostrar confirmação dentro do modal
      form.hidden = true
      showCaptureSuccess(name)

      // Fechar modal automaticamente após 3s
      setTimeout(closeLeadModal, 3000)

    } catch (err) {
      showFormError(err.message || 'Não foi possível salvar. Tente novamente.')
      btn.disabled    = false
      btn.textContent = 'Quero receber minha leitura diária ✨'
    }
  }

  function showFormError(msg) {
    const el = $('ldtFormError')
    if (el) { el.textContent = msg; el.hidden = false }
  }

  function showCaptureSuccess(name) {
    const el = $('ldtCaptureSuccess')
    if (el) {
      el.hidden = false
      el.querySelector('.ldt-capture-success-name').textContent = name.split(' ')[0]
    }
  }

  // ── Compartilhamento ─────────────────────────────────────────
  function buildShareText(card, reading) {
    // Pega os primeiros 2 parágrafos do texto para o compartilhamento
    const paragraphs = reading.split(/\n+/).filter(p => p.trim())
    const excerpt    = paragraphs.slice(0, 2).join('\n\n')
    const pos        = card.reversed ? 'Invertida' : 'Normal'

    return `✨ *Minha Leitura do Tarot de Hoje*\n\n` +
           `🃏 Carta: *${card.name}* (${pos})\n\n` +
           `${excerpt}\n\n` +
           `📿 Quer receber a sua leitura todos os dias? Acesse:\n` +
           `👉 https://nessaterapeuta.vercel.app/#leitura\n\n` +
           `— Leitura gerada por *Vanessa Santos Terapeuta* ✦`
  }

  function shareWhatsApp() {
    if (!state.currentRead) return
    const text = buildShareText(state.currentRead.card, state.currentRead.reading)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function copyToClipboard() {
    if (!state.currentRead) return
    const text = buildShareText(state.currentRead.card, state.currentRead.reading)
    try {
      await navigator.clipboard.writeText(text)
      const btn = $('ldtBtnCopy')
      if (btn) {
        const original     = btn.textContent
        btn.textContent    = '✓ Copiado!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = original
          btn.classList.remove('copied')
        }, 2500)
      }
    } catch (_) {
      alert('Não foi possível copiar automaticamente. Selecione o texto manualmente.')
    }
  }

  // ── Event listeners ──────────────────────────────────────────
  function init() {
    // Botão flutuante + link do menu → abrir overlay
    $('ldtFloatBtn')?.addEventListener('click', openOverlay)

    document.getElementById('navLinkLeitura')?.addEventListener('click', function (e) {
      e.preventDefault()
      openOverlay()
      // Fechar menu mobile se estiver aberto
      document.getElementById('navLinks')?.classList.remove('open')
      document.getElementById('navOverlay')?.classList.remove('open')
      document.getElementById('navToggle')?.classList.remove('open')
      document.getElementById('navToggle')?.setAttribute('aria-expanded', 'false')
    })

    // Botão de fechar o overlay
    $('ldtOverlayClose')?.addEventListener('click', closeOverlay)

    // Fechar overlay com Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('ldtModalBackdrop')?.hidden) {
          closeLeadModal()
        } else if (!$('ldtOverlay')?.hidden) {
          closeOverlay()
        }
      }
    })

    // Botão principal: receber leitura
    $('ldtBtnReading')?.addEventListener('click', requestReading)

    // Retry em caso de erro
    $('ldtBtnRetry')?.addEventListener('click', requestReading)

    // Formulário de cadastro
    $('ldtFormLead')?.addEventListener('submit', submitLead)

    // Fechar modal de lead (backdrop click ou Escape)
    $('ldtModalBackdrop')?.addEventListener('click', function (e) {
      if (e.target === this) closeLeadModal()
    })

    // Compartilhamento
    $('ldtBtnShareWhatsapp')?.addEventListener('click', shareWhatsApp)
    $('ldtBtnCopy')?.addEventListener('click', copyToClipboard)
    $('ldtBtnShareAgain')?.addEventListener('click', shareWhatsApp)

    // ── Verificar hint no botão conforme estado do lead ─────────
    const hintEl = $('ldtHint')
    if (hintEl && state.lead) {
      hintEl.textContent = 'Sua leitura diária está disponível'
    }

    // ── Restaurar leitura cacheada ao abrir o overlay ───────────
    // Se o usuário já leu hoje, mostra direto quando o overlay abrir
    const overlay = $('ldtOverlay')
    if (overlay) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === 'hidden' && !overlay.hidden) {
            const cached = getCachedToday()
            if (cached && panels.idle && !panels.idle.hidden) {
              showReading(cached.card, cached.reading)
            }
          }
        })
      })
      observer.observe(overlay, { attributes: true })
    }
  }

  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
