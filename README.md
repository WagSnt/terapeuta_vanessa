# Vanessa Santos — Terapeuta Energética
## Site + Leitura do Dia (IA)

Landing page da terapeuta holística Vanessa Santos com feature de **Leitura do Tarot Diária gerada por IA**.

---

## Arquitetura

```
Frontend:  HTML + CSS + JS vanilla (sem framework)
Backend:   Vercel Serverless Functions (Node 18, ESM)
Banco:     Supabase (PostgreSQL, plano free)
IA:        OpenAI GPT-4o mini
Hosting:   Vercel (plano free)
Fingerprint: FingerprintJS v4 open source (CDN)
```

### Por que Supabase?
Free tier generoso (500 MB storage, 2 GB bandwidth, 50 MB banco). PostgreSQL com suporte nativo a `UUID`, `GENERATED ALWAYS AS`, e constraints que garantem consistência do rate limiting.

### Por que Vercel Serverless Functions?
Zero configuração de servidor. Cold start de ~300ms é aceitável para esta aplicação. Integra nativamente com variáveis de ambiente e domínio customizado.

### Por que GPT-4o mini e não GPT-4o?
Custo ~15x menor. Para leituras espirituais de 200 palavras, a qualidade é suficiente. O prompt enxuto (<100 tokens de input) e `max_tokens: 350` garantem custo previsível por chamada.

---

## Estrutura de pastas

```
├── index.html             Landing page principal
├── css/style.css          Estilos globais (paleta esmeralda)
├── js/main.js             Navegação, animações de scroll
├── leitura/
│   ├── leitura.css        Estilos da seção Leitura do Dia (namespace ldt-)
│   └── leitura.js         Frontend da seção (estados, API calls, compartilhamento)
├── data/
│   └── tarot.js           78 cartas do tarot (ESM) + funções drawCard, getFallbackReading
├── api/
│   ├── _lib/
│   │   ├── supabase.js    Cliente Supabase singleton
│   │   └── utils.js       Helpers: hash, timezone, custo, CORS
│   ├── reading.js         POST /api/reading  — gera leitura do dia
│   ├── lead.js            POST /api/lead     — registra lead
│   └── admin.js           GET  /api/admin    — painel de métricas (protegido)
├── images/                Imagens existentes do site
├── package.json           Dependências (openai, @supabase/supabase-js)
├── vercel.json            Configuração de runtime e headers
├── .env.example           Template de variáveis de ambiente
├── supabase-schema.sql    Schema SQL (executar no Supabase)
└── .gitignore
```

---

## Configuração e Deploy

### 1. Banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. Vá em **SQL Editor → New Query**.
3. Cole o conteúdo de `supabase-schema.sql` e execute.
4. Em **Settings → API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**não** a `anon` key)

### 2. OpenAI

1. Acesse [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Crie uma chave de API.
3. Em **Settings → Billing**, configure um limite de gasto mensal (recomendado: R$ 30).
4. Copie a chave → `OPENAI_API_KEY`.

### 3. Vercel

```bash
# Instale o CLI da Vercel (uma vez)
npm install -g vercel

# Na raiz do projeto:
vercel

# Siga o assistente:
# - Link to existing project? No
# - Project name: terapeuta-vanessa
# - Framework: Other
# - Root directory: ./
```

Ou faça deploy pelo painel: [vercel.com/new](https://vercel.com/new) → importe o repositório GitHub.

### 4. Variáveis de ambiente

No painel da Vercel: **Settings → Environment Variables**, adicione:

| Variável                   | Descrição                                      |
|---------------------------|------------------------------------------------|
| `OPENAI_API_KEY`          | Chave da OpenAI                                |
| `SUPABASE_URL`            | URL do projeto Supabase                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase               |
| `ADMIN_KEY`               | Senha do painel admin (string aleatória, 32+ chars) |
| `FINGERPRINT_SALT`        | Salt HMAC para privacidade (string aleatória, 32+ chars) |
| `MAX_AI_CALLS_PER_DAY`    | Limite diário de chamadas IA (ex: `100`)       |

Para gerar strings aleatórias seguras:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Redeploy após variáveis

```bash
vercel --prod
```

---

## Rotas da API

### `POST /api/reading`
Gera a leitura do dia para um visitante.

**Body:**
```json
{
  "fingerprintId": "abc123",       // obrigatório
  "leadId":        "uuid-do-lead", // opcional (após cadastro)
  "sign":          "Libra"         // opcional (personaliza o prompt)
}
```

**Respostas:**
- `200` — leitura gerada com sucesso
- `429` — limite diário atingido (1 por dispositivo por dia)
- `400` — campos inválidos
- `500` — erro interno

---

### `POST /api/lead`
Registra ou atualiza o lead (upsert por email).

**Body:**
```json
{
  "name":  "Maria Silva",
  "email": "maria@email.com",
  "sign":  "Libra"
}
```

---

### `GET /api/admin?key=SUA_ADMIN_KEY`
Painel HTML com métricas: custo de IA, total de leads, leituras do dia.

Ou via header: `x-admin-key: SUA_ADMIN_KEY`

---

## Estimativa de custo mensal (OpenAI)

Preços do GPT-4o mini: $0,15/1M tokens input · $0,60/1M tokens output  
Por leitura: ~85 tokens input + ~320 tokens output ≈ **$0,000205 por leitura**

| Cenário       | Usuários/dia | Leituras/mês | Custo OpenAI/mês | Custo em BRL (~R$5,20/USD) |
|--------------|-------------|-------------|-----------------|--------------------------|
| Início       | 30          | 900         | ~$0,18          | ~R$ 1,00                 |
| Crescimento  | 100         | 3.000       | ~$0,62          | ~R$ 3,20                 |
| Escalado     | 500         | 15.000      | ~$3,08          | ~R$ 16,00                |
| Alto tráfego | 1.000       | 30.000      | ~$6,15          | ~R$ 32,00                |

> **Com `MAX_AI_CALLS_PER_DAY=100`**: custo máximo garantido ≈ $0,62/mês (~R$ 3,20).  
> Acima do limite, leituras de fallback estático são servidas — **sem custo de IA**.

Supabase free tier cobre até ~50k rows e ~2 GB de bandwidth — suficiente para meses de operação.  
Vercel free tier: 100 GB bandwidth, 100k serverless invocations/mês.

---

## Controle de custo

1. **Rate limit duplo**: 1 leitura por dispositivo (fingerprint) por dia, verificado no banco antes de qualquer chamada à OpenAI.
2. **Limite global**: `MAX_AI_CALLS_PER_DAY` configura teto diário de chamadas reais à IA.
3. **Prompt enxuto**: sistema + usuário < 100 tokens; `max_tokens: 350` no output.
4. **Log em `ai_usage`**: cada chamada real registra tokens e custo estimado. Visível no painel `/api/admin`.
5. **Fallback estático**: quando o limite for atingido, leituras geradas localmente (sem custo) usando os keywords de cada carta.

---

## Extensões futuras (já preparadas)

### Google AdSense
Os espaços estão reservados e comentados no HTML com instruções:
- `<!-- ADSENSE_BLOCK_POST_READING -->` — após a leitura
- `<!-- ADSENSE_BLOCK_LIMIT_REACHED -->` — quando o limite diário for atingido

### Email marketing (Brevo / Mailchimp)
Em `api/lead.js`, há um bloco comentado:
```javascript
// TODO: Integração com Brevo / Mailchimp
// await triggerEmailWebhook({ name, email, sign })
```
Adicione `EMAIL_WEBHOOK_URL` e `EMAIL_WEBHOOK_KEY` no `.env` e descomente.

### Plano premium / Monetização
- Campo `plan` (default `'free'`) já existe na tabela `leads`.
- Em `api/admin.js`, há o comentário `<!-- STRIPE_PREMIUM_PLACEHOLDER -->` indicando onde plugar.
- Fluxo: criar rota `/api/checkout` (Stripe/Mercado Pago) + webhook `/api/webhook-payment` para atualizar `plan = 'premium'`.
- Benefícios premium: múltiplas leituras/dia, histórico completo, leituras mais longas.

---

## Manutenção

**Atualizar preço do GPT-4o mini**: editar constante `PRICING` em `api/_lib/utils.js`.

**Aumentar limite diário**: alterar `MAX_AI_CALLS_PER_DAY` nas variáveis de ambiente da Vercel (sem redeploy necessário — serverless functions leem em runtime).

**Monitorar custo**: acessar `/api/admin?key=SUA_ADMIN_KEY`.

**Resetar lead para testes**: deletar o registro em `leads` e `readings` no Supabase Table Editor.
