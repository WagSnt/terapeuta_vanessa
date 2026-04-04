// api/_lib/utils.js
// Utilitários compartilhados pelos serverless functions.

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Retorna a data atual no timezone de Brasília (America/Sao_Paulo) no formato YYYY-MM-DD.
 * Usada como chave do rate limiting diário — garante reset à meia-noite local.
 */
export function getTodayBrasilia() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Gera HMAC-SHA256 de uma string usando FINGERPRINT_SALT do ambiente.
 * Protege a privacidade do visitorId bruto do FingerprintJS.
 * @param {string} raw - visitorId do dispositivo
 * @returns {string} hash hexadecimal (64 chars)
 */
export function hashFingerprint(raw) {
  const salt = process.env.FINGERPRINT_SALT || 'dev_salt_change_in_production'
  return createHmac('sha256', salt).update(raw).digest('hex')
}

/**
 * Calcula mensagem de tempo até o próximo reset (meia-noite, horário de Brasília).
 * @returns {string} ex: "Retorna em 4h30min (meia-noite, horário de Brasília)"
 */
export function getNextResetMessage() {
  const now       = new Date()
  const brStr     = now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
  const [h, m]    = brStr.split(':').map(Number)
  const minsLeft  = (24 * 60) - (h * 60 + m)
  const hoursLeft = Math.floor(minsLeft / 60)
  const minsRest  = minsLeft % 60

  if (hoursLeft === 0)  return `Retorna em ${minsRest} minuto${minsRest !== 1 ? 's' : ''}`
  if (minsRest  === 0)  return `Retorna em ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}`
  return `Retorna em ${hoursLeft}h${String(minsRest).padStart(2, '0')}min (meia-noite, horário de Brasília)`
}

/**
 * Compara duas strings de forma timing-safe para evitar timing attacks.
 * Usar na verificação do ADMIN_KEY.
 */
export function safeCompare(a, b) {
  try {
    const bufA = Buffer.from(String(a))
    const bufB = Buffer.from(String(b))
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Define headers CORS e Content-Type na resposta.
 * Chamadas são sempre do mesmo domínio Vercel, mas deixamos explícito para facilidade.
 */
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')
  res.setHeader('Content-Type', 'application/json')
}

/**
 * Preço do GPT-4o mini (USD por token, atualizado em 2025-04).
 * Ajuste se os preços mudarem: https://openai.com/pricing
 */
export const PRICING = {
  inputPerToken:  0.15  / 1_000_000,  // $0.15  / 1M tokens
  outputPerToken: 0.60  / 1_000_000,  // $0.60  / 1M tokens
}

export function estimateCost(promptTokens, completionTokens) {
  return (promptTokens * PRICING.inputPerToken) + (completionTokens * PRICING.outputPerToken)
}

/**
 * Lista válida de signos (normalizada). Usada na validação da rota /api/lead.
 */
export const VALID_SIGNS = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes',
]
