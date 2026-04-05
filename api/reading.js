// api/reading.js — POST /api/reading
// Gera a Leitura do Dia: sorteia carta, chama IA (ou fallback) e registra no banco.

import OpenAI from 'openai'
import { getSupabase }          from './_lib/supabase.js'
import { drawCard, getFallbackReading } from '../data/tarot.js'
import {
  getTodayBrasilia,
  hashFingerprint,
  getNextResetMessage,
  setCORSHeaders,
  estimateCost,
} from './_lib/utils.js'

// ── Prompt do sistema (enxuto: ~70 tokens de input total por chamada) ──────────
const SYSTEM_PROMPT =
  'Você é a voz espiritual da terapeuta holística Vanessa Santos, do RS. ' +
  'Gere uma leitura do tarot em português do Brasil com tom acolhedor e suave — nunca dramático ou alarmista. ' +
  'Entre 200 e 250 palavras. Finalize com exatamente "✨" seguido de uma pergunta de reflexão. ' +
  'Sem títulos, sem markdown, sem emojis extras.'

function buildUserPrompt(card, sign) {
  const pos  = card.reversed ? 'invertida' : 'normal'
  const base = `Carta: ${card.name}, posição ${pos}.`
  const sig  = sign ? ` Signo do consulente: ${sign}.` : ''
  return `${base}${sig} Escreva a mensagem do dia.`
}

// ── Handler principal ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORSHeaders(res, req)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })

  // ── 1. Validação de entrada ────────────────────────────────────
  const { fingerprintId, leadId, sign } = req.body || {}

  if (!fingerprintId || typeof fingerprintId !== 'string' || fingerprintId.length < 8) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'fingerprintId inválido ou ausente.' })
  }

  const db          = getSupabase()
  const today       = getTodayBrasilia()
  const fpHash      = hashFingerprint(fingerprintId)

  try {
    // ── 2. Rate limit: 1 leitura por dispositivo por dia ──────────
    // Verificação prévia (evita chamar IA desnecessariamente antes do INSERT falhar)
    const { count: existingCount } = await db
      .from('readings')
      .select('id', { count: 'exact', head: true })
      .eq('fingerprint_hash', fpHash)
      .eq('reading_date', today)

    if (existingCount > 0) {
      return res.status(429).json({
        error:        'ALREADY_READ_TODAY',
        message:      'Você já recebeu sua leitura de hoje.',
        resetMessage: getNextResetMessage(),
      })
    }

    // ── 3. Verificar limite global de chamadas à IA ────────────────
    const maxAiCalls  = parseInt(process.env.MAX_AI_CALLS_PER_DAY || '100', 10)
    const todayUTC    = new Date().toISOString().slice(0, 10)

    const { count: aiCount } = await db
      .from('readings')
      .select('id', { count: 'exact', head: true })
      .eq('is_fallback', false)
      .eq('reading_date', today)

    const useFallback = (aiCount || 0) >= maxAiCalls

    // ── 4. Sortear carta ───────────────────────────────────────────
    const card = drawCard()

    // ── 5. Buscar signo do lead (personalização) ──────────────────
    let leadSign = sign || null
    let leadDbId = leadId || null

    if (leadId) {
      const { data: lead } = await db
        .from('leads')
        .select('id, sign')
        .eq('id', leadId)
        .single()
      if (lead) {
        leadDbId  = lead.id
        leadSign  = leadSign || lead.sign
      }
    }

    // ── 6. Gerar leitura (IA ou fallback) ─────────────────────────
    let readingText        = ''
    let promptTokens       = 0
    let completionTokens   = 0
    let isFallback         = useFallback

    if (!useFallback) {
      try {
        const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const response = await openai.chat.completions.create({
          model:      'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: buildUserPrompt(card, leadSign) },
          ],
          max_tokens:  350,
          temperature: 0.88,
        })

        readingText      = response.choices[0].message.content?.trim() || ''
        promptTokens     = response.usage?.prompt_tokens     || 0
        completionTokens = response.usage?.completion_tokens || 0

      } catch (aiErr) {
        console.error('[reading] OpenAI error:', aiErr.message)
        // Fallback silencioso: não expõe erro ao cliente
        isFallback  = true
        readingText = getFallbackReading(card)
      }
    } else {
      readingText = getFallbackReading(card)
    }

    // ── 7. Inserir leitura no banco ────────────────────────────────
    // ON CONFLICT (fingerprint_hash, reading_date) → 2ª request simultânea simplesmente
    // não insere; a verificação em (2) já protege. Aqui apenas garante consistência.
    const { data: reading, error: insertErr } = await db
      .from('readings')
      .insert({
        fingerprint_hash: fpHash,
        lead_id:          leadDbId,
        card_id:          card.id,
        card_name:        card.name,
        card_reversed:    card.reversed,
        card_suit:        card.suit,
        reading_text:     readingText,
        is_fallback:      isFallback,
        reading_date:     today,
      })
      .select('id')
      .maybeSingle()

    // Se UNIQUE constraint disparou (race condition), retorna 429
    if (insertErr?.code === '23505') {
      return res.status(429).json({
        error:        'ALREADY_READ_TODAY',
        message:      'Você já recebeu sua leitura de hoje.',
        resetMessage: getNextResetMessage(),
      })
    }

    if (insertErr) throw insertErr

    // ── 8. Logar custo de IA (apenas para chamadas reais) ─────────
    if (!isFallback && reading?.id && promptTokens > 0) {
      const costUsd = estimateCost(promptTokens, completionTokens)

      await db.from('ai_usage').insert({
        reading_id:        reading.id,
        model:             'gpt-4o-mini',
        prompt_tokens:     promptTokens,
        completion_tokens: completionTokens,
        cost_usd:          costUsd,
      })
    }

    // ── 9. Resposta ao cliente ─────────────────────────────────────
    return res.status(200).json({
      success:    true,
      card: {
        id:       card.id,
        name:     card.name,
        suit:     card.suit,
        reversed: card.reversed,
      },
      reading:    readingText,
      isFallback,
      readingId:  reading?.id || null,
    })

  } catch (err) {
    console.error('[reading] Erro interno:', err)
    return res.status(500).json({
      error:   'INTERNAL_ERROR',
      message: 'Não foi possível gerar sua leitura. Tente novamente em instantes.',
    })
  }
}
