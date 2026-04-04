// api/lead.js — POST /api/lead
// Registra um novo lead (cadastro após primeira leitura).
// Upsert por email: se o email já existir, atualiza nome e signo e retorna isNew: false.

import { getSupabase }  from './_lib/supabase.js'
import { setCORSHeaders, VALID_SIGNS } from './_lib/utils.js'

export default async function handler(req, res) {
  setCORSHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })

  // ── Validação ──────────────────────────────────────────────────
  const { name, email, sign } = req.body || {}

  if (!name?.trim() || !email?.trim() || !sign?.trim()) {
    return res.status(400).json({
      error:   'MISSING_FIELDS',
      message: 'Nome, e-mail e signo são obrigatórios.',
    })
  }

  const emailNorm = email.trim().toLowerCase()
  const nameNorm  = name.trim()
  const signNorm  = sign.trim()

  // Validação de email (básica — o banco rejeita formatos inválidos também)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({
      error:   'INVALID_EMAIL',
      message: 'Formato de e-mail inválido.',
    })
  }

  // Validação de signo
  if (!VALID_SIGNS.includes(signNorm)) {
    return res.status(400).json({
      error:   'INVALID_SIGN',
      message: `Signo inválido. Valores aceitos: ${VALID_SIGNS.join(', ')}.`,
    })
  }

  const db = getSupabase()

  try {
    // ── Upsert por email (case-insensitive via index) ──────────────
    // Supabase não suporta ON CONFLICT com expressão de index diretamente via client,
    // então fazemos select + insert/update explicitamente.
    const { data: existing } = await db
      .from('leads')
      .select('id, plan')
      .ilike('email', emailNorm)
      .maybeSingle()

    if (existing) {
      // Atualiza dados do lead existente (nome e signo podem ter mudado)
      await db
        .from('leads')
        .update({ name: nameNorm, sign: signNorm, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      return res.status(200).json({
        success: true,
        leadId:  existing.id,
        plan:    existing.plan,
        isNew:   false,
        message: 'Bem-vinda de volta! Sua leitura diária continua disponível. ✨',
      })
    }

    // Novo lead
    const { data: newLead, error: insertErr } = await db
      .from('leads')
      .insert({ name: nameNorm, email: emailNorm, sign: signNorm, plan: 'free' })
      .select('id, plan')
      .single()

    if (insertErr) {
      // Conflito de email (race condition entre select e insert) → trata como existente
      if (insertErr.code === '23505') {
        const { data: raced } = await db
          .from('leads').select('id, plan').ilike('email', emailNorm).maybeSingle()
        return res.status(200).json({
          success: true,
          leadId:  raced?.id || null,
          plan:    raced?.plan || 'free',
          isNew:   false,
          message: 'Cadastro confirmado! ✨',
        })
      }
      throw insertErr
    }

    // ── Webhook de email marketing (descomentado quando estiver pronto) ──
    // TODO: Integração com Brevo / Mailchimp / ActiveCampaign
    // Payload: { name: nameNorm, email: emailNorm, sign: signNorm, plan: 'free' }
    //
    // const webhookUrl = process.env.EMAIL_WEBHOOK_URL
    // const webhookKey = process.env.EMAIL_WEBHOOK_KEY
    // if (webhookUrl) {
    //   fetch(webhookUrl, {
    //     method:  'POST',
    //     headers: { 'Content-Type': 'application/json', 'api-key': webhookKey },
    //     body:    JSON.stringify({ name: nameNorm, email: emailNorm, sign: signNorm }),
    //   }).catch(err => console.error('[lead] webhook error:', err.message))
    // }
    // ────────────────────────────────────────────────────────────────

    return res.status(201).json({
      success: true,
      leadId:  newLead.id,
      plan:    newLead.plan,
      isNew:   true,
      message: 'Cadastro realizado! A partir de agora, uma leitura especial aguarda você todos os dias. ✨',
    })

  } catch (err) {
    console.error('[lead] Erro interno:', err)
    return res.status(500).json({
      error:   'INTERNAL_ERROR',
      message: 'Não foi possível salvar seu cadastro. Tente novamente.',
    })
  }
}
