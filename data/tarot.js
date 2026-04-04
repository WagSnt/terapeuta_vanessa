/**
 * data/tarot.js
 * Baralho completo de Tarot — 78 cartas (Arcanos Maiores e Menores).
 * Importado pelos serverless functions em /api/.
 *
 * Campos:
 *   id       {number}   0–77, índice único
 *   name     {string}   Nome em português
 *   suit     {string}   'maior' | 'paus' | 'copas' | 'espadas' | 'ouros'
 *   keywords {string[]} 2–3 temas centrais (usados no fallback e no prompt da IA)
 */
export const tarotCards = [
  // ── Arcanos Maiores (0–21) ────────────────────────────────────
  { id:  0, name: 'O Louco',             suit: 'maior',   keywords: ['novos começos', 'espontaneidade', 'aventura'] },
  { id:  1, name: 'O Mago',              suit: 'maior',   keywords: ['manifestação', 'poder', 'habilidade'] },
  { id:  2, name: 'A Sacerdotisa',       suit: 'maior',   keywords: ['intuição', 'mistério', 'sabedoria interior'] },
  { id:  3, name: 'A Imperatriz',        suit: 'maior',   keywords: ['abundância', 'fertilidade', 'natureza'] },
  { id:  4, name: 'O Imperador',         suit: 'maior',   keywords: ['autoridade', 'estrutura', 'proteção'] },
  { id:  5, name: 'O Hierofante',        suit: 'maior',   keywords: ['tradição', 'espiritualidade', 'orientação'] },
  { id:  6, name: 'Os Amantes',          suit: 'maior',   keywords: ['amor', 'harmonia', 'escolhas'] },
  { id:  7, name: 'O Carro',             suit: 'maior',   keywords: ['determinação', 'vitória', 'controle'] },
  { id:  8, name: 'A Força',             suit: 'maior',   keywords: ['coragem', 'paciência', 'força interior'] },
  { id:  9, name: 'O Eremita',           suit: 'maior',   keywords: ['introspecção', 'orientação', 'solidão'] },
  { id: 10, name: 'A Roda da Fortuna',   suit: 'maior',   keywords: ['ciclos', 'mudança', 'destino'] },
  { id: 11, name: 'A Justiça',           suit: 'maior',   keywords: ['equilíbrio', 'verdade', 'karma'] },
  { id: 12, name: 'O Enforcado',         suit: 'maior',   keywords: ['pausa', 'nova perspectiva', 'entrega'] },
  { id: 13, name: 'A Morte',             suit: 'maior',   keywords: ['transformação', 'encerramento', 'renovação'] },
  { id: 14, name: 'A Temperança',        suit: 'maior',   keywords: ['moderação', 'paciência', 'equilíbrio'] },
  { id: 15, name: 'O Diabo',             suit: 'maior',   keywords: ['apego', 'ilusões', 'libertação'] },
  { id: 16, name: 'A Torre',             suit: 'maior',   keywords: ['ruptura', 'revelação', 'mudança'] },
  { id: 17, name: 'A Estrela',           suit: 'maior',   keywords: ['esperança', 'renovação', 'inspiração'] },
  { id: 18, name: 'A Lua',               suit: 'maior',   keywords: ['intuição', 'subconsciente', 'mistério'] },
  { id: 19, name: 'O Sol',               suit: 'maior',   keywords: ['alegria', 'vitalidade', 'clareza'] },
  { id: 20, name: 'O Julgamento',        suit: 'maior',   keywords: ['renovação', 'reflexão', 'chamado'] },
  { id: 21, name: 'O Mundo',             suit: 'maior',   keywords: ['conclusão', 'integração', 'plenitude'] },

  // ── Paus (22–35) ─────────────────────────────────────────────
  { id: 22, name: 'Ás de Paus',          suit: 'paus',    keywords: ['inspiração', 'criatividade', 'potencial'] },
  { id: 23, name: 'Dois de Paus',        suit: 'paus',    keywords: ['planejamento', 'expansão', 'visão'] },
  { id: 24, name: 'Três de Paus',        suit: 'paus',    keywords: ['progresso', 'exploração', 'crescimento'] },
  { id: 25, name: 'Quatro de Paus',      suit: 'paus',    keywords: ['celebração', 'harmonia', 'estabilidade'] },
  { id: 26, name: 'Cinco de Paus',       suit: 'paus',    keywords: ['conflito', 'competição', 'desafio'] },
  { id: 27, name: 'Seis de Paus',        suit: 'paus',    keywords: ['vitória', 'reconhecimento', 'confiança'] },
  { id: 28, name: 'Sete de Paus',        suit: 'paus',    keywords: ['defesa', 'perseverança', 'resiliência'] },
  { id: 29, name: 'Oito de Paus',        suit: 'paus',    keywords: ['movimento', 'velocidade', 'ação'] },
  { id: 30, name: 'Nove de Paus',        suit: 'paus',    keywords: ['resistência', 'cautela', 'persistência'] },
  { id: 31, name: 'Dez de Paus',         suit: 'paus',    keywords: ['sobrecarga', 'responsabilidade', 'fardo'] },
  { id: 32, name: 'Valete de Paus',      suit: 'paus',    keywords: ['entusiasmo', 'aventura', 'exploração'] },
  { id: 33, name: 'Cavaleiro de Paus',   suit: 'paus',    keywords: ['ação', 'paixão', 'impulsividade'] },
  { id: 34, name: 'Rainha de Paus',      suit: 'paus',    keywords: ['confiança', 'carisma', 'determinação'] },
  { id: 35, name: 'Rei de Paus',         suit: 'paus',    keywords: ['liderança', 'visão', 'empreendedorismo'] },

  // ── Copas (36–49) ─────────────────────────────────────────────
  { id: 36, name: 'Ás de Copas',         suit: 'copas',   keywords: ['amor', 'intuição', 'abertura emocional'] },
  { id: 37, name: 'Dois de Copas',       suit: 'copas',   keywords: ['parceria', 'conexão', 'união'] },
  { id: 38, name: 'Três de Copas',       suit: 'copas',   keywords: ['celebração', 'amizade', 'alegria'] },
  { id: 39, name: 'Quatro de Copas',     suit: 'copas',   keywords: ['contemplação', 'introspecção', 'avaliação'] },
  { id: 40, name: 'Cinco de Copas',      suit: 'copas',   keywords: ['perda', 'tristeza', 'cura'] },
  { id: 41, name: 'Seis de Copas',       suit: 'copas',   keywords: ['nostalgia', 'memórias', 'inocência'] },
  { id: 42, name: 'Sete de Copas',       suit: 'copas',   keywords: ['fantasia', 'ilusão', 'escolhas'] },
  { id: 43, name: 'Oito de Copas',       suit: 'copas',   keywords: ['abandono', 'busca interior', 'transição'] },
  { id: 44, name: 'Nove de Copas',       suit: 'copas',   keywords: ['satisfação', 'realização', 'gratidão'] },
  { id: 45, name: 'Dez de Copas',        suit: 'copas',   keywords: ['harmonia', 'felicidade', 'plenitude'] },
  { id: 46, name: 'Valete de Copas',     suit: 'copas',   keywords: ['sensibilidade', 'criatividade', 'mensagem'] },
  { id: 47, name: 'Cavaleiro de Copas',  suit: 'copas',   keywords: ['romance', 'charme', 'idealismo'] },
  { id: 48, name: 'Rainha de Copas',     suit: 'copas',   keywords: ['compaixão', 'intuição', 'cuidado'] },
  { id: 49, name: 'Rei de Copas',        suit: 'copas',   keywords: ['sabedoria emocional', 'equilíbrio', 'diplomacia'] },

  // ── Espadas (50–63) ───────────────────────────────────────────
  { id: 50, name: 'Ás de Espadas',       suit: 'espadas', keywords: ['clareza', 'verdade', 'poder mental'] },
  { id: 51, name: 'Dois de Espadas',     suit: 'espadas', keywords: ['indecisão', 'equilíbrio', 'bloqueio'] },
  { id: 52, name: 'Três de Espadas',     suit: 'espadas', keywords: ['dor', 'separação', 'cura emocional'] },
  { id: 53, name: 'Quatro de Espadas',   suit: 'espadas', keywords: ['descanso', 'recuperação', 'pausa'] },
  { id: 54, name: 'Cinco de Espadas',    suit: 'espadas', keywords: ['conflito', 'aprendizado', 'derrota'] },
  { id: 55, name: 'Seis de Espadas',     suit: 'espadas', keywords: ['transição', 'paz', 'recuperação'] },
  { id: 56, name: 'Sete de Espadas',     suit: 'espadas', keywords: ['estratégia', 'cautela', 'independência'] },
  { id: 57, name: 'Oito de Espadas',     suit: 'espadas', keywords: ['limitação', 'aprisionamento', 'libertação'] },
  { id: 58, name: 'Nove de Espadas',     suit: 'espadas', keywords: ['ansiedade', 'preocupação', 'superação'] },
  { id: 59, name: 'Dez de Espadas',      suit: 'espadas', keywords: ['fim de ciclo', 'recomeço', 'libertação'] },
  { id: 60, name: 'Valete de Espadas',   suit: 'espadas', keywords: ['curiosidade', 'alerta', 'comunicação'] },
  { id: 61, name: 'Cavaleiro de Espadas',suit: 'espadas', keywords: ['ambição', 'rapidez', 'determinação'] },
  { id: 62, name: 'Rainha de Espadas',   suit: 'espadas', keywords: ['clareza', 'independência', 'discernimento'] },
  { id: 63, name: 'Rei de Espadas',      suit: 'espadas', keywords: ['intelecto', 'autoridade', 'ética'] },

  // ── Ouros (64–77) ─────────────────────────────────────────────
  { id: 64, name: 'Ás de Ouros',         suit: 'ouros',   keywords: ['prosperidade', 'manifestação', 'oportunidade'] },
  { id: 65, name: 'Dois de Ouros',       suit: 'ouros',   keywords: ['equilíbrio', 'adaptação', 'flexibilidade'] },
  { id: 66, name: 'Três de Ouros',       suit: 'ouros',   keywords: ['colaboração', 'habilidade', 'trabalho em equipe'] },
  { id: 67, name: 'Quatro de Ouros',     suit: 'ouros',   keywords: ['segurança', 'possessividade', 'controle'] },
  { id: 68, name: 'Cinco de Ouros',      suit: 'ouros',   keywords: ['dificuldade', 'escassez', 'superação'] },
  { id: 69, name: 'Seis de Ouros',       suit: 'ouros',   keywords: ['generosidade', 'partilha', 'gratidão'] },
  { id: 70, name: 'Sete de Ouros',       suit: 'ouros',   keywords: ['paciência', 'avaliação', 'crescimento'] },
  { id: 71, name: 'Oito de Ouros',       suit: 'ouros',   keywords: ['dedicação', 'aprendizado', 'habilidade'] },
  { id: 72, name: 'Nove de Ouros',       suit: 'ouros',   keywords: ['independência', 'abundância', 'conquista'] },
  { id: 73, name: 'Dez de Ouros',        suit: 'ouros',   keywords: ['legado', 'prosperidade', 'família'] },
  { id: 74, name: 'Valete de Ouros',     suit: 'ouros',   keywords: ['oportunidade', 'aprendizado', 'praticidade'] },
  { id: 75, name: 'Cavaleiro de Ouros',  suit: 'ouros',   keywords: ['diligência', 'método', 'confiabilidade'] },
  { id: 76, name: 'Rainha de Ouros',     suit: 'ouros',   keywords: ['praticidade', 'cuidado', 'prosperidade'] },
  { id: 77, name: 'Rei de Ouros',        suit: 'ouros',   keywords: ['realização', 'abundância', 'segurança'] },
]

/**
 * Sorteia uma carta aleatória do baralho com posição (normal ou invertida).
 * @returns {{ id, name, suit, keywords, reversed: boolean }}
 */
export function drawCard() {
  const card = tarotCards[Math.floor(Math.random() * tarotCards.length)]
  return { ...card, reversed: Math.random() < 0.5 }
}

/**
 * Gera leitura de fallback baseada nos keywords da carta.
 * Usada quando o limite global de IA for atingido.
 * @param {{ name: string, keywords: string[], reversed: boolean }} card
 * @returns {string}
 */
export function getFallbackReading(card) {
  const pos      = card.reversed ? 'invertida' : 'normal'
  const keywords = card.keywords.join(', ')
  const theme    = card.keywords[0]

  return `A carta ${card.name} em posição ${pos} chega até você hoje carregando as energias de ${keywords}.

Não é por acaso que esta mensagem foi chamada para o seu dia. O universo tem uma sabedoria própria e, mesmo quando não enxergamos o mapa completo, cada símbolo que surge tem um propósito — especialmente os que aparecem nos momentos em que mais precisamos de clareza.

Permita-se sentar com esta energia de ${theme} por um instante. Observe o que ela desperta em você: onde em sua vida ela ressoa? O que em seu cotidiano está pedindo esse olhar mais atento? Muitas vezes, as respostas que buscamos externamente já existem dentro de nós, aguardando o silêncio necessário para serem ouvidas.

Você está em um caminho de aprendizado contínuo, e cada passo — mesmo os que parecem tropeços — é parte do seu crescimento. Confie no processo que sua alma escolheu.

✨ Pergunta de reflexão: De que forma a energia de ${theme} se manifesta na sua vida agora, e o que ela está te convidando a transformar?`
}
