// ╔══════════════════════════════════════════════════════════════╗
// ║  FIFA World Cup 2026 — Fixture Data Layer                   ║
// ║  Desacoplado del componente visual para facilitar futura    ║
// ║  integración con API de resultados en tiempo real.          ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Types ─────────────────────────────────────────────────────────
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'postponed'
export type Phase = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'
export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface CalTeam {
  code: string
  name: string
  score?: number
}

export interface CalMatch {
  id: string
  date: string       // 'YYYY-MM-DD' ISO local
  time: string       // 'HH:MM' hora local del estadio
  timezone: string   // 'ET' | 'CT' | 'PT'
  stadium: string
  city: string
  home: CalTeam
  away: CalTeam
  group?: GroupLetter
  phase: Phase
  matchday?: 1 | 2 | 3
  status: MatchStatus
  minute?: number    // minuto actual; para integración LIVE futura
  // Campos preparados para integración futura:
  // lineupHome?: string[]
  // lineupAway?: string[]
  // events?: MatchEvent[]
}

// ── UI Constants ──────────────────────────────────────────────────
export const PHASE_LABELS: Record<Phase, string> = {
  group: 'Fase de Grupos',
  r32:   'Ronda de 32',
  r16:   'Octavos de Final',
  qf:    'Cuartos de Final',
  sf:    'Semifinales',
  '3rd': 'Tercer Lugar',
  final: 'Gran Final',
}

export const PHASE_SHORT: Record<Phase, string> = {
  group: 'Grupos',
  r32:   'Ronda 32',
  r16:   'Octavos',
  qf:    'Cuartos',
  sf:    'Semis',
  '3rd': '3er Lugar',
  final: 'Final',
}

export const PHASE_ORDER: Phase[] = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']
export const GROUPS: GroupLetter[] = ['A','B','C','D','E','F','G','H','I','J','K','L']

// ── Venues — 15 sedes oficiales FIFA World Cup 2026 ───────────────
// Nota: "Rose Bowl" (Pasadena, CA) NO es sede oficial. El venue
// oficial para Los Ángeles es SoFi Stadium (Inglewood, CA).
export const VENUES = {
  // México
  AZTECA:    { name: 'Estadio Azteca',    city: 'Ciudad de México', tz: 'CT' },
  AKRON:     { name: 'Estadio Akron',     city: 'Guadalajara',      tz: 'CT' },
  BBVA:      { name: 'Estadio BBVA',      city: 'Monterrey',        tz: 'CT' },
  // Canadá
  BC_PLACE:  { name: 'BC Place',          city: 'Vancouver',        tz: 'PT' },
  BMO_FIELD: { name: 'BMO Field',         city: 'Toronto',          tz: 'ET' },
  // USA
  METLIFE:   { name: 'MetLife Stadium',   city: 'Nueva York/NJ',    tz: 'ET' },
  SOFI:      { name: 'SoFi Stadium',      city: 'Los Ángeles',      tz: 'PT' },
  ATT:       { name: 'AT&T Stadium',      city: 'Dallas',           tz: 'CT' },
  LEVIS:     { name: "Levi's Stadium",    city: 'San Francisco',    tz: 'PT' },
  HARD_ROCK: { name: 'Hard Rock Stadium', city: 'Miami',            tz: 'ET' },
  MERCEDES:  { name: 'Mercedes-Benz',     city: 'Atlanta',          tz: 'ET' },
  LUMEN:     { name: 'Lumen Field',       city: 'Seattle',          tz: 'PT' },
  ARROWHEAD: { name: 'Arrowhead Stadium', city: 'Kansas City',      tz: 'CT' },
  NRG:       { name: 'NRG Stadium',       city: 'Houston',          tz: 'CT' },
  GILLETTE:  { name: 'Gillette Stadium',  city: 'Boston',           tz: 'ET' },
  LINCOLN:   { name: 'Lincoln Financial', city: 'Philadelphia',     tz: 'ET' },
} as const

// ── Costa Rica ────────────────────────────────────────────────────
export const COSTA_RICA_CODE = 'CRC'
// Costa Rica no clasificó al Mundial 2026 (no aparece en ningún grupo del draw oficial).
export const CR_QUALIFIED = false

// ── Search Utilities ──────────────────────────────────────────────

/** Filtra partidos por texto libre (nombre de selección, código, estadio o ciudad). */
export function searchMatches(query: string, matches: CalMatch[]): CalMatch[] {
  const q = query.toLowerCase().trim()
  if (!q) return matches
  return matches.filter(m =>
    m.home.name.toLowerCase().includes(q) ||
    m.away.name.toLowerCase().includes(q) ||
    m.home.code.toLowerCase().includes(q) ||
    m.away.code.toLowerCase().includes(q) ||
    m.stadium.toLowerCase().includes(q) ||
    m.city.toLowerCase().includes(q)
  )
}

/** Retorna todos los partidos de una selección específica por código. */
export function getTeamMatches(code: string, matches: CalMatch[]): CalMatch[] {
  const c = code.toUpperCase()
  return matches.filter(m => m.home.code === c || m.away.code === c)
}

/** Retorna todos los partidos de varias selecciones (OR logic). */
export function getFavoriteMatches(codes: string[], matches: CalMatch[]): CalMatch[] {
  if (codes.length === 0) return []
  const set = new Set(codes.map(c => c.toUpperCase()))
  return matches.filter(m => set.has(m.home.code) || set.has(m.away.code))
}

/** Ordena partidos por fecha y hora ascendente. */
export function sortByDate(matches: CalMatch[]): CalMatch[] {
  return [...matches].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

/** Agrupa partidos por fecha ISO. Retorna Map ordenado. */
export function groupByDate(matches: CalMatch[]): Map<string, CalMatch[]> {
  const map = new Map<string, CalMatch[]>()
  for (const m of matches) {
    const list = map.get(m.date) ?? []
    map.set(m.date, [...list, m])
  }
  return map
}

// ── Fixture Data — FIFA World Cup 2026 ────────────────────────────
// Total: 104 partidos (72 grupos + 16 R32 + 8 R16 + 4 QF + 2 SF + 1 3er + 1 Final)
// Fechas y venues exactos a confirmar con calendario oficial FIFA.
// Venue fijo confirmado: apertura MEX-RSA en Estadio Azteca (jun 11),
// Final en MetLife Stadium.
// CORRECCIÓN: "Rose Bowl" reemplazado por "SoFi Stadium" (sede oficial LA).
export const WC2026_MATCHES: CalMatch[] = [

  // ── GRUPO A: México · Sudáfrica · Rep. de Corea · Czechia ──────
  { id:'A-1-1', date:'2026-06-11', time:'20:00', timezone:'CT', stadium:'Estadio Azteca',   city:'Ciudad de México', home:{code:'MEX',name:'México'},           away:{code:'RSA',name:'Sudáfrica'},      group:'A', phase:'group', matchday:1, status:'upcoming' },
  { id:'A-1-2', date:'2026-06-12', time:'15:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',           home:{code:'CZE',name:'Czechia'},           away:{code:'KOR',name:'Corea'},          group:'A', phase:'group', matchday:1, status:'upcoming' },
  { id:'A-2-1', date:'2026-06-17', time:'15:00', timezone:'CT', stadium:'Estadio Azteca',   city:'Ciudad de México', home:{code:'MEX',name:'México'},           away:{code:'KOR',name:'Corea'},          group:'A', phase:'group', matchday:2, status:'upcoming' },
  { id:'A-2-2', date:'2026-06-17', time:'18:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',          home:{code:'RSA',name:'Sudáfrica'},        away:{code:'CZE',name:'Czechia'},        group:'A', phase:'group', matchday:2, status:'upcoming' },
  { id:'A-3-1', date:'2026-06-22', time:'18:00', timezone:'CT', stadium:'Estadio BBVA',     city:'Monterrey',        home:{code:'MEX',name:'México'},           away:{code:'CZE',name:'Czechia'},        group:'A', phase:'group', matchday:3, status:'upcoming' },
  { id:'A-3-2', date:'2026-06-22', time:'18:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',           home:{code:'RSA',name:'Sudáfrica'},        away:{code:'KOR',name:'Corea'},          group:'A', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO B: Canadá · Bosnia-Herz. · Qatar · Suiza ─────────────
  { id:'B-1-1', date:'2026-06-12', time:'12:00', timezone:'PT', stadium:'BC Place',         city:'Vancouver',        home:{code:'CAN',name:'Canadá'},           away:{code:'BIH',name:'Bosnia-Herz.'},   group:'B', phase:'group', matchday:1, status:'upcoming' },
  { id:'B-1-2', date:'2026-06-12', time:'21:00', timezone:'ET', stadium:'Arrowhead Stadium',city:'Kansas City',      home:{code:'QAT',name:'Qatar'},            away:{code:'SUI',name:'Suiza'},          group:'B', phase:'group', matchday:1, status:'upcoming' },
  { id:'B-2-1', date:'2026-06-17', time:'12:00', timezone:'PT', stadium:'BC Place',         city:'Vancouver',        home:{code:'CAN',name:'Canadá'},           away:{code:'QAT',name:'Qatar'},          group:'B', phase:'group', matchday:2, status:'upcoming' },
  { id:'B-2-2', date:'2026-06-17', time:'21:00', timezone:'ET', stadium:'Arrowhead Stadium',city:'Kansas City',      home:{code:'BIH',name:'Bosnia-Herz.'},     away:{code:'SUI',name:'Suiza'},          group:'B', phase:'group', matchday:2, status:'upcoming' },
  { id:'B-3-1', date:'2026-06-22', time:'18:00', timezone:'PT', stadium:'Lumen Field',      city:'Seattle',          home:{code:'CAN',name:'Canadá'},           away:{code:'SUI',name:'Suiza'},          group:'B', phase:'group', matchday:3, status:'upcoming' },
  { id:'B-3-2', date:'2026-06-22', time:'18:00', timezone:'ET', stadium:'Mercedes-Benz',    city:'Atlanta',          home:{code:'QAT',name:'Qatar'},            away:{code:'BIH',name:'Bosnia-Herz.'},   group:'B', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO C: Brasil · Marruecos · Haití · Escocia ───────────────
  { id:'C-1-1', date:'2026-06-13', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'BRA',name:'Brasil'},           away:{code:'MAR',name:'Marruecos'},      group:'C', phase:'group', matchday:1, status:'upcoming' },
  { id:'C-1-2', date:'2026-06-13', time:'21:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',           home:{code:'HAI',name:'Haití'},            away:{code:'SCO',name:'Escocia'},        group:'C', phase:'group', matchday:1, status:'upcoming' },
  { id:'C-2-1', date:'2026-06-18', time:'15:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'BRA',name:'Brasil'},           away:{code:'SCO',name:'Escocia'},        group:'C', phase:'group', matchday:2, status:'upcoming' },
  { id:'C-2-2', date:'2026-06-18', time:'18:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',           home:{code:'MAR',name:'Marruecos'},        away:{code:'HAI',name:'Haití'},          group:'C', phase:'group', matchday:2, status:'upcoming' },
  { id:'C-3-1', date:'2026-06-23', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'BRA',name:'Brasil'},           away:{code:'HAI',name:'Haití'},          group:'C', phase:'group', matchday:3, status:'upcoming' },
  { id:'C-3-2', date:'2026-06-23', time:'18:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'MAR',name:'Marruecos'},        away:{code:'SCO',name:'Escocia'},        group:'C', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO D: Estados Unidos · Paraguay · Australia · Turquía ────
  { id:'D-1-1', date:'2026-06-14', time:'14:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'USA',name:'Estados Unidos'},   away:{code:'PAR',name:'Paraguay'},       group:'D', phase:'group', matchday:1, status:'upcoming' },
  { id:'D-1-2', date:'2026-06-14', time:'20:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'AUS',name:'Australia'},        away:{code:'TUR',name:'Turquía'},        group:'D', phase:'group', matchday:1, status:'upcoming' },
  { id:'D-2-1', date:'2026-06-19', time:'18:00', timezone:'ET', stadium:'Mercedes-Benz',    city:'Atlanta',          home:{code:'USA',name:'Estados Unidos'},   away:{code:'TUR',name:'Turquía'},        group:'D', phase:'group', matchday:2, status:'upcoming' },
  { id:'D-2-2', date:'2026-06-19', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'AUS',name:'Australia'},        away:{code:'PAR',name:'Paraguay'},       group:'D', phase:'group', matchday:2, status:'upcoming' },
  { id:'D-3-1', date:'2026-06-24', time:'18:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'USA',name:'Estados Unidos'},   away:{code:'AUS',name:'Australia'},      group:'D', phase:'group', matchday:3, status:'upcoming' },
  { id:'D-3-2', date:'2026-06-24', time:'18:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',           home:{code:'PAR',name:'Paraguay'},         away:{code:'TUR',name:'Turquía'},        group:'D', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO E: Alemania · Curazao · Costa de Marfil · Ecuador ─────
  { id:'E-1-1', date:'2026-06-14', time:'17:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',           home:{code:'GER',name:'Alemania'},         away:{code:'CUW',name:'Curazao'},        group:'E', phase:'group', matchday:1, status:'upcoming' },
  { id:'E-1-2', date:'2026-06-15', time:'12:00', timezone:'CT', stadium:'Estadio Akron',    city:'Guadalajara',      home:{code:'CIV',name:'Costa de Marfil'},  away:{code:'ECU',name:'Ecuador'},        group:'E', phase:'group', matchday:1, status:'upcoming' },
  { id:'E-2-1', date:'2026-06-20', time:'15:00', timezone:'ET', stadium:'Mercedes-Benz',    city:'Atlanta',          home:{code:'GER',name:'Alemania'},         away:{code:'ECU',name:'Ecuador'},        group:'E', phase:'group', matchday:2, status:'upcoming' },
  { id:'E-2-2', date:'2026-06-20', time:'18:00', timezone:'CT', stadium:'Estadio Akron',    city:'Guadalajara',      home:{code:'CIV',name:'Costa de Marfil'},  away:{code:'CUW',name:'Curazao'},        group:'E', phase:'group', matchday:2, status:'upcoming' },
  { id:'E-3-1', date:'2026-06-25', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'GER',name:'Alemania'},         away:{code:'CIV',name:'Costa de Marfil'},group:'E', phase:'group', matchday:3, status:'upcoming' },
  { id:'E-3-2', date:'2026-06-25', time:'18:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',          home:{code:'CUW',name:'Curazao'},          away:{code:'ECU',name:'Ecuador'},        group:'E', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO F: Países Bajos · Japón · Suecia · Túnez ─────────────
  // CORRECCIÓN: "Rose Bowl" → "SoFi Stadium" (venue oficial de Los Ángeles)
  { id:'F-1-1', date:'2026-06-15', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'NED',name:'Países Bajos'},     away:{code:'JPN',name:'Japón'},          group:'F', phase:'group', matchday:1, status:'upcoming' },
  { id:'F-1-2', date:'2026-06-15', time:'20:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'SWE',name:'Suecia'},           away:{code:'TUN',name:'Túnez'},          group:'F', phase:'group', matchday:1, status:'upcoming' },
  { id:'F-2-1', date:'2026-06-20', time:'18:00', timezone:'PT', stadium:"Levi's Stadium",   city:'San Francisco',    home:{code:'NED',name:'Países Bajos'},     away:{code:'TUN',name:'Túnez'},          group:'F', phase:'group', matchday:2, status:'upcoming' },
  { id:'F-2-2', date:'2026-06-20', time:'21:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'SWE',name:'Suecia'},           away:{code:'JPN',name:'Japón'},          group:'F', phase:'group', matchday:2, status:'upcoming' },
  { id:'F-3-1', date:'2026-06-25', time:'18:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'NED',name:'Países Bajos'},     away:{code:'SWE',name:'Suecia'},         group:'F', phase:'group', matchday:3, status:'upcoming' },
  { id:'F-3-2', date:'2026-06-25', time:'18:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'JPN',name:'Japón'},            away:{code:'TUN',name:'Túnez'},          group:'F', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO G: Bélgica · Egipto · Irán · Nueva Zelanda ───────────
  { id:'G-1-1', date:'2026-06-16', time:'12:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'BEL',name:'Bélgica'},          away:{code:'EGY',name:'Egipto'},         group:'G', phase:'group', matchday:1, status:'upcoming' },
  { id:'G-1-2', date:'2026-06-16', time:'21:00', timezone:'PT', stadium:'Lumen Field',      city:'Seattle',          home:{code:'IRN',name:'Irán'},             away:{code:'NZL',name:'Nueva Zelanda'},  group:'G', phase:'group', matchday:1, status:'upcoming' },
  { id:'G-2-1', date:'2026-06-21', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'BEL',name:'Bélgica'},          away:{code:'NZL',name:'Nueva Zelanda'},  group:'G', phase:'group', matchday:2, status:'upcoming' },
  { id:'G-2-2', date:'2026-06-21', time:'15:00', timezone:'CT', stadium:'Estadio Azteca',   city:'Ciudad de México', home:{code:'EGY',name:'Egipto'},           away:{code:'IRN',name:'Irán'},           group:'G', phase:'group', matchday:2, status:'upcoming' },
  { id:'G-3-1', date:'2026-06-26', time:'18:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',           home:{code:'BEL',name:'Bélgica'},          away:{code:'IRN',name:'Irán'},           group:'G', phase:'group', matchday:3, status:'upcoming' },
  { id:'G-3-2', date:'2026-06-26', time:'18:00', timezone:'PT', stadium:'Lumen Field',      city:'Seattle',          home:{code:'EGY',name:'Egipto'},           away:{code:'NZL',name:'Nueva Zelanda'},  group:'G', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO H: España · Cabo Verde · Arabia Saudí · Uruguay ───────
  { id:'H-1-1', date:'2026-06-16', time:'15:00', timezone:'CT', stadium:'Estadio BBVA',     city:'Monterrey',        home:{code:'ESP',name:'España'},           away:{code:'CPV',name:'Cabo Verde'},     group:'H', phase:'group', matchday:1, status:'upcoming' },
  { id:'H-1-2', date:'2026-06-16', time:'18:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'KSA',name:'Arabia Saudí'},     away:{code:'URU',name:'Uruguay'},        group:'H', phase:'group', matchday:1, status:'upcoming' },
  { id:'H-2-1', date:'2026-06-21', time:'12:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',           home:{code:'ESP',name:'España'},           away:{code:'KSA',name:'Arabia Saudí'},   group:'H', phase:'group', matchday:2, status:'upcoming' },
  { id:'H-2-2', date:'2026-06-21', time:'15:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'CPV',name:'Cabo Verde'},       away:{code:'URU',name:'Uruguay'},        group:'H', phase:'group', matchday:2, status:'upcoming' },
  { id:'H-3-1', date:'2026-06-26', time:'18:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',          home:{code:'ESP',name:'España'},           away:{code:'URU',name:'Uruguay'},        group:'H', phase:'group', matchday:3, status:'upcoming' },
  { id:'H-3-2', date:'2026-06-26', time:'18:00', timezone:'ET', stadium:'Mercedes-Benz',    city:'Atlanta',          home:{code:'CPV',name:'Cabo Verde'},       away:{code:'KSA',name:'Arabia Saudí'},   group:'H', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO I: Francia · Senegal · Iraq · Noruega ─────────────────
  // CORRECCIÓN: "Rose Bowl" → "SoFi Stadium"
  { id:'I-1-1', date:'2026-06-18', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'FRA',name:'Francia'},          away:{code:'SEN',name:'Senegal'},        group:'I', phase:'group', matchday:1, status:'upcoming' },
  { id:'I-1-2', date:'2026-06-18', time:'21:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'IRQ',name:'Iraq'},             away:{code:'NOR',name:'Noruega'},        group:'I', phase:'group', matchday:1, status:'upcoming' },
  { id:'I-2-1', date:'2026-06-23', time:'15:00', timezone:'PT', stadium:"Levi's Stadium",   city:'San Francisco',    home:{code:'FRA',name:'Francia'},          away:{code:'NOR',name:'Noruega'},        group:'I', phase:'group', matchday:2, status:'upcoming' },
  { id:'I-2-2', date:'2026-06-23', time:'18:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'SEN',name:'Senegal'},          away:{code:'IRQ',name:'Iraq'},           group:'I', phase:'group', matchday:2, status:'upcoming' },
  { id:'I-3-1', date:'2026-06-28', time:'18:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'FRA',name:'Francia'},          away:{code:'IRQ',name:'Iraq'},           group:'I', phase:'group', matchday:3, status:'upcoming' },
  { id:'I-3-2', date:'2026-06-28', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'SEN',name:'Senegal'},          away:{code:'NOR',name:'Noruega'},        group:'I', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO J: Argentina · Argelia · Austria · Jordania ───────────
  { id:'J-1-1', date:'2026-06-19', time:'21:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'ARG',name:'Argentina'},        away:{code:'ALG',name:'Argelia'},        group:'J', phase:'group', matchday:1, status:'upcoming' },
  { id:'J-1-2', date:'2026-06-19', time:'18:00', timezone:'CT', stadium:'Estadio Akron',    city:'Guadalajara',      home:{code:'AUT',name:'Austria'},          away:{code:'JOR',name:'Jordania'},       group:'J', phase:'group', matchday:1, status:'upcoming' },
  { id:'J-2-1', date:'2026-06-24', time:'21:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'ARG',name:'Argentina'},        away:{code:'JOR',name:'Jordania'},       group:'J', phase:'group', matchday:2, status:'upcoming' },
  { id:'J-2-2', date:'2026-06-24', time:'18:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',          home:{code:'ALG',name:'Argelia'},          away:{code:'AUT',name:'Austria'},        group:'J', phase:'group', matchday:2, status:'upcoming' },
  { id:'J-3-1', date:'2026-06-29', time:'18:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',     home:{code:'ARG',name:'Argentina'},        away:{code:'AUT',name:'Austria'},        group:'J', phase:'group', matchday:3, status:'upcoming' },
  { id:'J-3-2', date:'2026-06-29', time:'18:00', timezone:'CT', stadium:'Estadio BBVA',     city:'Monterrey',        home:{code:'ALG',name:'Argelia'},          away:{code:'JOR',name:'Jordania'},       group:'J', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO K: Portugal · Congo DR · Uzbekistán · Colombia ────────
  // CORRECCIÓN: "Rose Bowl" → "SoFi Stadium"
  { id:'K-1-1', date:'2026-06-20', time:'18:00', timezone:'PT', stadium:"Levi's Stadium",   city:'San Francisco',    home:{code:'POR',name:'Portugal'},         away:{code:'COD',name:'Congo DR'},       group:'K', phase:'group', matchday:1, status:'upcoming' },
  { id:'K-1-2', date:'2026-06-20', time:'21:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'UZB',name:'Uzbekistán'},       away:{code:'COL',name:'Colombia'},       group:'K', phase:'group', matchday:1, status:'upcoming' },
  { id:'K-2-1', date:'2026-06-25', time:'18:00', timezone:'PT', stadium:'Lumen Field',      city:'Seattle',          home:{code:'POR',name:'Portugal'},         away:{code:'UZB',name:'Uzbekistán'},     group:'K', phase:'group', matchday:2, status:'upcoming' },
  { id:'K-2-2', date:'2026-06-25', time:'21:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'COD',name:'Congo DR'},         away:{code:'COL',name:'Colombia'},       group:'K', phase:'group', matchday:2, status:'upcoming' },
  { id:'K-3-1', date:'2026-06-30', time:'18:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',      home:{code:'POR',name:'Portugal'},         away:{code:'COL',name:'Colombia'},       group:'K', phase:'group', matchday:3, status:'upcoming' },
  { id:'K-3-2', date:'2026-06-30', time:'18:00', timezone:'PT', stadium:"Levi's Stadium",   city:'San Francisco',    home:{code:'COD',name:'Congo DR'},         away:{code:'UZB',name:'Uzbekistán'},     group:'K', phase:'group', matchday:3, status:'upcoming' },

  // ── GRUPO L: Inglaterra · Croacia · Ghana · Panamá ─────────────
  { id:'L-1-1', date:'2026-06-21', time:'19:00', timezone:'ET', stadium:'BMO Field',        city:'Toronto',          home:{code:'ENG',name:'Inglaterra'},       away:{code:'CRO',name:'Croacia'},        group:'L', phase:'group', matchday:1, status:'upcoming' },
  { id:'L-1-2', date:'2026-06-21', time:'22:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',            home:{code:'GHA',name:'Ghana'},            away:{code:'PAN',name:'Panamá'},         group:'L', phase:'group', matchday:1, status:'upcoming' },
  { id:'L-2-1', date:'2026-06-26', time:'19:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'ENG',name:'Inglaterra'},       away:{code:'GHA',name:'Ghana'},          group:'L', phase:'group', matchday:2, status:'upcoming' },
  { id:'L-2-2', date:'2026-06-26', time:'22:00', timezone:'ET', stadium:'BMO Field',        city:'Toronto',          home:{code:'CRO',name:'Croacia'},          away:{code:'PAN',name:'Panamá'},         group:'L', phase:'group', matchday:2, status:'upcoming' },
  { id:'L-3-1', date:'2026-07-01', time:'18:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ',    home:{code:'ENG',name:'Inglaterra'},       away:{code:'PAN',name:'Panamá'},         group:'L', phase:'group', matchday:3, status:'upcoming' },
  { id:'L-3-2', date:'2026-07-01', time:'18:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',           home:{code:'CRO',name:'Croacia'},          away:{code:'GHA',name:'Ghana'},          group:'L', phase:'group', matchday:3, status:'upcoming' },

  // ── RONDA DE 32 (16 partidos) ────────────────────────────────────
  // CORRECCIÓN: R32-11 "Rose Bowl" → "SoFi Stadium"
  { id:'R32-01', date:'2026-07-05', time:'15:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ', home:{code:'TBD',name:'1° Grupo A'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-02', date:'2026-07-05', time:'19:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',        home:{code:'TBD',name:'1° Grupo B'}, away:{code:'TBD',name:'2° Grupo D'},  phase:'r32', status:'upcoming' },
  { id:'R32-03', date:'2026-07-06', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',   home:{code:'TBD',name:'1° Grupo C'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-04', date:'2026-07-06', time:'19:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',         home:{code:'TBD',name:'1° Grupo D'}, away:{code:'TBD',name:'2° Grupo B'},  phase:'r32', status:'upcoming' },
  { id:'R32-05', date:'2026-07-07', time:'15:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',        home:{code:'TBD',name:'1° Grupo E'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-06', date:'2026-07-07', time:'19:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',  home:{code:'TBD',name:'1° Grupo F'}, away:{code:'TBD',name:'2° Grupo H'},  phase:'r32', status:'upcoming' },
  { id:'R32-07', date:'2026-07-08', time:'15:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ', home:{code:'TBD',name:'1° Grupo G'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-08', date:'2026-07-08', time:'19:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',       home:{code:'TBD',name:'1° Grupo H'}, away:{code:'TBD',name:'2° Grupo F'},  phase:'r32', status:'upcoming' },
  { id:'R32-09', date:'2026-07-09', time:'15:00', timezone:'PT', stadium:"Levi's Stadium",   city:'San Francisco', home:{code:'TBD',name:'1° Grupo I'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-10', date:'2026-07-09', time:'19:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',         home:{code:'TBD',name:'1° Grupo J'}, away:{code:'TBD',name:'2° Grupo L'},  phase:'r32', status:'upcoming' },
  { id:'R32-11', date:'2026-07-10', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',   home:{code:'TBD',name:'1° Grupo K'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-12', date:'2026-07-10', time:'19:00', timezone:'PT', stadium:'Lumen Field',      city:'Seattle',       home:{code:'TBD',name:'1° Grupo L'}, away:{code:'TBD',name:'2° Grupo J'},  phase:'r32', status:'upcoming' },
  { id:'R32-13', date:'2026-07-11', time:'15:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ', home:{code:'TBD',name:'2° Grupo A'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-14', date:'2026-07-11', time:'19:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',        home:{code:'TBD',name:'2° Grupo C'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-15', date:'2026-07-12', time:'15:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',        home:{code:'TBD',name:'2° Grupo E'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },
  { id:'R32-16', date:'2026-07-12', time:'19:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',         home:{code:'TBD',name:'2° Grupo G'}, away:{code:'TBD',name:'3° Mejor'},    phase:'r32', status:'upcoming' },

  // ── OCTAVOS DE FINAL (8 partidos) ────────────────────────────────
  // CORRECCIÓN: R16-3 "Rose Bowl" → "SoFi Stadium"
  { id:'R16-1', date:'2026-07-14', time:'15:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ', home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-2', date:'2026-07-14', time:'19:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',        home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-3', date:'2026-07-15', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',   home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-4', date:'2026-07-15', time:'19:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',         home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-5', date:'2026-07-16', time:'15:00', timezone:'ET', stadium:'Lincoln Financial',city:'Philadelphia',  home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-6', date:'2026-07-16', time:'19:00', timezone:'CT', stadium:'NRG Stadium',      city:'Houston',       home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-7', date:'2026-07-17', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',   home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },
  { id:'R16-8', date:'2026-07-17', time:'19:00', timezone:'ET', stadium:'Gillette Stadium', city:'Boston',        home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'r16', status:'upcoming' },

  // ── CUARTOS DE FINAL (4 partidos) ────────────────────────────────
  // CORRECCIÓN: QF-3 "Rose Bowl" → "SoFi Stadium"
  { id:'QF-1', date:'2026-07-19', time:'15:00', timezone:'ET', stadium:'MetLife Stadium',  city:'Nueva York/NJ', home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'qf', status:'upcoming' },
  { id:'QF-2', date:'2026-07-19', time:'19:00', timezone:'CT', stadium:'AT&T Stadium',     city:'Dallas',        home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'qf', status:'upcoming' },
  { id:'QF-3', date:'2026-07-20', time:'15:00', timezone:'PT', stadium:'SoFi Stadium',     city:'Los Ángeles',   home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'qf', status:'upcoming' },
  { id:'QF-4', date:'2026-07-20', time:'19:00', timezone:'ET', stadium:'Hard Rock Stadium',city:'Miami',         home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'qf', status:'upcoming' },

  // ── SEMIFINALES (2 partidos) ─────────────────────────────────────
  // CORRECCIÓN: SF-2 "Rose Bowl" → "SoFi Stadium"
  { id:'SF-1', date:'2026-07-22', time:'18:00', timezone:'CT', stadium:'AT&T Stadium', city:'Dallas',      home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'sf',  status:'upcoming' },
  { id:'SF-2', date:'2026-07-23', time:'18:00', timezone:'PT', stadium:'SoFi Stadium', city:'Los Ángeles', home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'sf',  status:'upcoming' },

  // ── TERCER LUGAR ─────────────────────────────────────────────────
  { id:'3RD',  date:'2026-07-25', time:'15:00', timezone:'ET', stadium:'Hard Rock Stadium', city:'Miami',          home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'3rd', status:'upcoming' },

  // ── GRAN FINAL ───────────────────────────────────────────────────
  // Venue confirmado: MetLife Stadium (East Rutherford, NJ)
  { id:'FINAL', date:'2026-07-26', time:'18:00', timezone:'ET', stadium:'MetLife Stadium', city:'Nueva York/NJ', home:{code:'TBD',name:'Por definir'}, away:{code:'TBD',name:'Por definir'}, phase:'final', status:'upcoming' },
]
