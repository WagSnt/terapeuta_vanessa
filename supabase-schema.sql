-- ================================================================
-- SCHEMA — Leitura do Dia | Vanessa Santos Terapeuta
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ================================================================

-- ── Tabela: leads ────────────────────────────────────────────────
-- Armazena usuários que preencheram o formulário de cadastro.
-- Sem senha — email é o identificador principal.
CREATE TABLE IF NOT EXISTS leads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  email      TEXT        NOT NULL,
  sign       TEXT        NOT NULL,
  -- 'free' agora; 'premium' quando monetização for ativada
  plan       TEXT        NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade por email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_uq ON leads (lower(email));

-- Índice para busca rápida no admin por data de criação
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);

-- ── Tabela: readings ─────────────────────────────────────────────
-- Cada leitura gerada (por IA ou fallback) fica registrada aqui.
-- fingerprint_hash é o HMAC-SHA256 do visitorId do FingerprintJS.
CREATE TABLE IF NOT EXISTS readings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT        NOT NULL,
  lead_id          UUID        REFERENCES leads(id) ON DELETE SET NULL,
  card_id          SMALLINT    NOT NULL CHECK (card_id BETWEEN 0 AND 77),
  card_name        TEXT        NOT NULL,
  card_reversed    BOOLEAN     NOT NULL DEFAULT FALSE,
  card_suit        TEXT        NOT NULL,  -- 'maior' | 'paus' | 'copas' | 'espadas' | 'ouros'
  reading_text     TEXT        NOT NULL,
  is_fallback      BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Data no timezone de Brasília (YYYY-MM-DD). Chave do rate limiting diário.
  reading_date     DATE        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- !! CRÍTICO: garante 1 leitura por dispositivo por dia com consistência transacional.
-- ON CONFLICT neste index = rate limit atingido (retorna 429 ao cliente).
CREATE UNIQUE INDEX IF NOT EXISTS readings_fp_date_uq
  ON readings (fingerprint_hash, reading_date);

-- Busca por lead (para histórico futuro e admin panel)
CREATE INDEX IF NOT EXISTS readings_lead_id_idx  ON readings (lead_id);

-- Filtro e contagem por data (contagem global diária para MAX_AI_CALLS_PER_DAY)
CREATE INDEX IF NOT EXISTS readings_date_idx      ON readings (reading_date DESC);
CREATE INDEX IF NOT EXISTS readings_date_fallback ON readings (reading_date, is_fallback);

-- ── Tabela: ai_usage ─────────────────────────────────────────────
-- Log de cada chamada real à API da OpenAI para controle de custo.
-- Registrada apenas quando is_fallback = FALSE.
CREATE TABLE IF NOT EXISTS ai_usage (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id        UUID        NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  model             TEXT        NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_tokens     INTEGER     NOT NULL CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER     NOT NULL CHECK (completion_tokens >= 0),
  -- Coluna gerada: nunca diverge da soma
  total_tokens      INTEGER     GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  -- Custo em USD calculado no servidor com preços do modelo usado
  cost_usd          NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregações de custo/tokens por data no admin panel
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_reading_id_idx ON ai_usage (reading_id);

-- ── Verificação do schema ────────────────────────────────────────
-- Execute após criar as tabelas para confirmar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
