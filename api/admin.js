// api/admin.js — GET /api/admin
// Painel de métricas para a administradora.
// Acesso protegido por ADMIN_KEY no header x-admin-key ou query param ?key=...

import { getSupabase }  from './_lib/supabase.js'
import { safeCompare, getTodayBrasilia } from './_lib/utils.js'

// Taxa de câmbio BRL/USD aproximada (atualizar periodicamente ou usar uma API)
const USD_TO_BRL = 5.20

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (req.method !== 'GET') {
    return res.status(405).send('<p>Method Not Allowed</p>')
  }

  // ── Autenticação ───────────────────────────────────────────────
  const providedKey = req.headers['x-admin-key'] || req.query.key || ''
  const adminKey    = process.env.ADMIN_KEY || ''

  if (!adminKey || !safeCompare(providedKey, adminKey)) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="admin"')
    return res.status(401).send('<p style="font-family:sans-serif">Acesso negado. Passe o header <code>x-admin-key</code>.</p>')
  }

  const db    = getSupabase()
  const today = getTodayBrasilia()

  // Primeiro dia do mês atual (Brasília)
  const [year, month] = today.split('-')
  const startOfMonth  = `${year}-${month}-01`

  try {
    // ── Consultas em paralelo ──────────────────────────────────────
    const [
      leadsTotal,
      leadsToday,
      readingsToday,
      aiToday,
      aiMonth,
      recentLeads,
    ] = await Promise.all([
      // Total de leads
      db.from('leads').select('id', { count: 'exact', head: true }),

      // Leads criados hoje
      db.from('leads').select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00+00:00`),

      // Leituras geradas hoje
      db.from('readings').select('id, is_fallback', { count: 'exact' })
        .eq('reading_date', today),

      // Uso de IA hoje
      db.from('ai_usage').select('prompt_tokens, completion_tokens, cost_usd')
        .gte('created_at', `${today}T00:00:00+00:00`),

      // Uso de IA no mês
      db.from('ai_usage').select('cost_usd')
        .gte('created_at', `${startOfMonth}T00:00:00+00:00`),

      // Últimos 20 leads
      db.from('leads').select('id, name, email, sign, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // ── Cálculos ───────────────────────────────────────────────────
    const totalLeads      = leadsTotal.count          || 0
    const newLeadsToday   = leadsToday.count           || 0
    const readTodayCount  = readingsToday.count        || 0
    const fallbacksToday  = (readingsToday.data || []).filter(r => r.is_fallback).length
    const aiCallsToday    = (aiToday.data       || []).length

    const tokensTodayIn   = (aiToday.data || []).reduce((s, r) => s + (r.prompt_tokens     || 0), 0)
    const tokensTodayOut  = (aiToday.data || []).reduce((s, r) => s + (r.completion_tokens || 0), 0)
    const costTodayUsd    = (aiToday.data || []).reduce((s, r) => s + Number(r.cost_usd   || 0), 0)
    const costMonthUsd    = (aiMonth.data  || []).reduce((s, r) => s + Number(r.cost_usd  || 0), 0)
    const avgCostPerRead  = aiCallsToday > 0 ? costTodayUsd / aiCallsToday : 0

    const maxAiCalls      = parseInt(process.env.MAX_AI_CALLS_PER_DAY || '100', 10)

    // ── Renderizar HTML ────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Leitura do Dia</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 15px; color: #1a2e20; background: #f0faf4; padding: 2rem 1rem; }
    h1 { font-size: 1.6rem; color: #0f3d2a; margin-bottom: 0.25rem; }
    .meta { color: #5a7a65; font-size: 0.85rem; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #fff; border-radius: 12px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .card-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: .07em; color: #5a7a65; margin-bottom: .4rem; }
    .card-value { font-size: 1.7rem; font-weight: 600; color: #0f3d2a; }
    .card-sub { font-size: 0.8rem; color: #5a7a65; margin-top: .25rem; }
    .section-title { font-size: 1.1rem; font-weight: 600; color: #0f3d2a; margin: 2rem 0 .75rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    th { background: #0f3d2a; color: #fff; padding: .7rem 1rem; text-align: left; font-size: .8rem; letter-spacing: .05em; }
    td { padding: .65rem 1rem; border-bottom: 1px solid #e8f5ec; font-size: .85rem; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: .15rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 500; }
    .badge-free    { background: #e8f5ec; color: #1e7248; }
    .badge-premium { background: #fff3e0; color: #e65100; }
    .alert { background: #fff3e0; border-left: 4px solid #e65100; padding: .8rem 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1.5rem; font-size: .9rem; color: #7f3b00; }
    .ok   { background: #e8f5ec; border-color: #1e7248; color: #0f3d2a; }
  </style>
</head>
<body>
  <h1>Dashboard — Leitura do Dia</h1>
  <p class="meta">Hoje (Brasília): <strong>${today}</strong> &nbsp;·&nbsp; Mês: <strong>${year}/${month}</strong></p>

  ${aiCallsToday >= maxAiCalls
    ? `<div class="alert">⚠️ Limite diário de IA atingido (${aiCallsToday}/${maxAiCalls}). As leituras estão em modo fallback estático.</div>`
    : `<div class="alert ok">✅ IA operando normalmente. ${aiCallsToday} de ${maxAiCalls} chamadas usadas hoje.</div>`
  }

  <div class="grid">
    <div class="card">
      <div class="card-label">Total de Leads</div>
      <div class="card-value">${totalLeads.toLocaleString('pt-BR')}</div>
      <div class="card-sub">+${newLeadsToday} hoje</div>
    </div>
    <div class="card">
      <div class="card-label">Leituras Hoje</div>
      <div class="card-value">${readTodayCount}</div>
      <div class="card-sub">${fallbacksToday} fallback · ${readTodayCount - fallbacksToday} IA</div>
    </div>
    <div class="card">
      <div class="card-label">Chamadas IA Hoje</div>
      <div class="card-value">${aiCallsToday} / ${maxAiCalls}</div>
      <div class="card-sub">${tokensTodayIn + tokensTodayOut} tokens total</div>
    </div>
    <div class="card">
      <div class="card-label">Custo IA Hoje</div>
      <div class="card-value">$${costTodayUsd.toFixed(4)}</div>
      <div class="card-sub">≈ R$${(costTodayUsd * USD_TO_BRL).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Custo IA este Mês</div>
      <div class="card-value">$${costMonthUsd.toFixed(4)}</div>
      <div class="card-sub">≈ R$${(costMonthUsd * USD_TO_BRL).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Custo Médio/Leitura</div>
      <div class="card-value">$${avgCostPerRead.toFixed(6)}</div>
      <div class="card-sub">≈ R$${(avgCostPerRead * USD_TO_BRL).toFixed(4)}</div>
    </div>
  </div>

  <div class="section-title">Últimos 20 Leads</div>
  <table>
    <thead>
      <tr><th>Nome</th><th>E-mail</th><th>Signo</th><th>Plano</th><th>Cadastro</th></tr>
    </thead>
    <tbody>
      ${(recentLeads.data || []).map(l => {
        const date = new Date(l.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        return `<tr>
          <td>${escapeHtml(l.name)}</td>
          <td>${escapeHtml(l.email)}</td>
          <td>${escapeHtml(l.sign)}</td>
          <td><span class="badge badge-${l.plan}">${l.plan}</span></td>
          <td>${date}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  <!-- STRIPE_PREMIUM_PLACEHOLDER -->
  <!-- Futura integração de plano premium: plugar Stripe/Mercado Pago aqui -->
  <!-- 1. Adicionar coluna plan_expires_at em leads                         -->
  <!-- 2. Criar rota /api/checkout para criar sessão de pagamento           -->
  <!-- 3. Criar webhook /api/webhook-payment para ativar plano após pag.    -->

</body>
</html>`

    return res.status(200).send(html)

  } catch (err) {
    console.error('[admin] Erro interno:', err)
    return res.status(500).send(`<p>Erro interno: ${err.message}</p>`)
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
