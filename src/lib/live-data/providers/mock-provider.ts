import type { LiveDataProvider } from './base-provider'
import type { LiveMatch, LiveCompetition, FetchMatchesOptions } from '../types'

const FRIENDLY: LiveCompetition = {
  id: 'intl-friendly',
  name: 'Amistoso Internacional',
  shortName: 'Amistoso',
  type: 'friendly',
}

// 15 completed friendlies — May 2026 pre-WC preparation window
// 15 upcoming friendlies — June 3–10 2026, final prep before kickoff June 11
const MOCK_MATCHES: LiveMatch[] = [
  // ── COMPLETED ───────────────────────────────────────────────────────
  {
    id: 'frnd-20260505-can-par',
    date: '2026-05-05', time: '19:00', timezone: 'ET',
    status: 'completed',
    home: { id: 'can', code: 'CAN', name: 'Canadá',    shortName: 'CAN', score: 1 },
    away: { id: 'par', code: 'PAR', name: 'Paraguay',  shortName: 'PAR', score: 0 },
    venue: { id: 'bmo-field', name: 'BMO Field', city: 'Toronto', country: 'Canadá', capacity: 30000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260507-usa-ecu',
    date: '2026-05-07', time: '18:30', timezone: 'ET',
    status: 'completed',
    home: { id: 'usa', code: 'USA', name: 'Estados Unidos', shortName: 'USA', score: 2 },
    away: { id: 'ecu', code: 'ECU', name: 'Ecuador',        shortName: 'ECU', score: 1 },
    venue: { id: 'gillette', name: 'Gillette Stadium', city: 'Foxborough', country: 'EE.UU.', capacity: 65878 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260509-bra-uru',
    date: '2026-05-09', time: '21:45', timezone: 'BRT',
    status: 'completed',
    home: { id: 'bra', code: 'BRA', name: 'Brasil',   shortName: 'BRA', score: 3 },
    away: { id: 'uru', code: 'URU', name: 'Uruguay',  shortName: 'URU', score: 0 },
    venue: { id: 'maracana', name: 'Estádio do Maracanã', city: 'Río de Janeiro', country: 'Brasil', capacity: 78838 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260511-arg-col',
    date: '2026-05-11', time: '21:00', timezone: 'ART',
    status: 'completed',
    home: { id: 'arg', code: 'ARG', name: 'Argentina', shortName: 'ARG', score: 2 },
    away: { id: 'col', code: 'COL', name: 'Colombia',  shortName: 'COL', score: 1 },
    venue: { id: 'monumental', name: 'Estadio Monumental', city: 'Buenos Aires', country: 'Argentina', capacity: 84567 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260512-mex-pan',
    date: '2026-05-12', time: '20:00', timezone: 'CT',
    status: 'completed',
    home: { id: 'mex', code: 'MEX', name: 'México',  shortName: 'MEX', score: 3 },
    away: { id: 'pan', code: 'PAN', name: 'Panamá',  shortName: 'PAN', score: 0 },
    venue: { id: 'azteca', name: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', capacity: 87523 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260514-fra-sco',
    date: '2026-05-14', time: '21:00', timezone: 'CET',
    status: 'completed',
    home: { id: 'fra', code: 'FRA', name: 'Francia',  shortName: 'FRA', score: 2 },
    away: { id: 'sco', code: 'SCO', name: 'Escocia',  shortName: 'SCO', score: 0 },
    venue: { id: 'stade-de-france', name: 'Stade de France', city: 'Saint-Denis', country: 'Francia', capacity: 80698 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260516-ger-aut',
    date: '2026-05-16', time: '20:45', timezone: 'CEST',
    status: 'completed',
    home: { id: 'ger', code: 'GER', name: 'Alemania', shortName: 'GER', score: 2 },
    away: { id: 'aut', code: 'AUT', name: 'Austria',  shortName: 'AUT', score: 1 },
    venue: { id: 'signal-iduna', name: 'Signal Iduna Park', city: 'Dortmund', country: 'Alemania', capacity: 81365 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260517-esp-nor',
    date: '2026-05-17', time: '21:00', timezone: 'CEST',
    status: 'completed',
    home: { id: 'esp', code: 'ESP', name: 'España',   shortName: 'ESP', score: 4 },
    away: { id: 'nor', code: 'NOR', name: 'Noruega',  shortName: 'NOR', score: 0 },
    venue: { id: 'bernabeu', name: 'Estadio Santiago Bernabéu', city: 'Madrid', country: 'España', capacity: 81044 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260519-eng-tun',
    date: '2026-05-19', time: '20:00', timezone: 'BST',
    status: 'completed',
    home: { id: 'eng', code: 'ENG', name: 'Inglaterra', shortName: 'ENG', score: 3 },
    away: { id: 'tun', code: 'TUN', name: 'Túnez',      shortName: 'TUN', score: 1 },
    venue: { id: 'wembley', name: 'Wembley Stadium', city: 'Londres', country: 'Inglaterra', capacity: 90000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260521-por-tur',
    date: '2026-05-21', time: '21:45', timezone: 'WEST',
    status: 'completed',
    home: { id: 'por', code: 'POR', name: 'Portugal', shortName: 'POR', score: 3 },
    away: { id: 'tur', code: 'TUR', name: 'Turquía',  shortName: 'TUR', score: 0 },
    venue: { id: 'estadio-luz', name: 'Estádio da Luz', city: 'Lisboa', country: 'Portugal', capacity: 64642 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260522-mar-civ',
    date: '2026-05-22', time: '20:00', timezone: 'WET',
    status: 'completed',
    home: { id: 'mar', code: 'MAR', name: 'Marruecos',      shortName: 'MAR', score: 2 },
    away: { id: 'civ', code: 'CIV', name: 'Costa de Marfil', shortName: 'CIV', score: 0 },
    venue: { id: 'stade-mohammed-v', name: 'Stade Mohammed V', city: 'Casablanca', country: 'Marruecos', capacity: 45891 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260524-jpn-kor',
    date: '2026-05-24', time: '19:00', timezone: 'JST',
    status: 'completed',
    home: { id: 'jpn', code: 'JPN', name: 'Japón',     shortName: 'JPN', score: 3 },
    away: { id: 'kor', code: 'KOR', name: 'Corea del Sur', shortName: 'KOR', score: 1 },
    venue: { id: 'japan-national', name: 'Japan National Stadium', city: 'Tokio', country: 'Japón', capacity: 68000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260526-sen-gha',
    date: '2026-05-26', time: '18:00', timezone: 'GMT',
    status: 'completed',
    home: { id: 'sen', code: 'SEN', name: 'Senegal', shortName: 'SEN', score: 2 },
    away: { id: 'gha', code: 'GHA', name: 'Ghana',   shortName: 'GHA', score: 0 },
    venue: { id: 'stade-wade', name: 'Stade Abdoulaye Wade', city: 'Dakar', country: 'Senegal', capacity: 50000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260528-bel-ned',
    date: '2026-05-28', time: '20:45', timezone: 'CEST',
    status: 'completed',
    home: { id: 'bel', code: 'BEL', name: 'Bélgica',     shortName: 'BEL', score: 1 },
    away: { id: 'ned', code: 'NED', name: 'Países Bajos', shortName: 'NED', score: 1 },
    venue: { id: 'baudouin', name: 'King Baudouin Stadium', city: 'Bruselas', country: 'Bélgica', capacity: 50024 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260530-cro-sui',
    date: '2026-05-30', time: '20:30', timezone: 'CEST',
    status: 'completed',
    home: { id: 'cro', code: 'CRO', name: 'Croacia', shortName: 'CRO', score: 2 },
    away: { id: 'sui', code: 'SUI', name: 'Suiza',   shortName: 'SUI', score: 0 },
    venue: { id: 'maksimir', name: 'Stadion Maksimir', city: 'Zagreb', country: 'Croacia', capacity: 35123 },
    competition: FRIENDLY,
  },

  // ── UPCOMING ─────────────────────────────────────────────────────────
  {
    id: 'frnd-20260603-fra-nor',
    date: '2026-06-03', time: '20:45', timezone: 'CET',
    status: 'upcoming',
    home: { id: 'fra', code: 'FRA', name: 'Francia',  shortName: 'FRA' },
    away: { id: 'nor', code: 'NOR', name: 'Noruega',  shortName: 'NOR' },
    venue: { id: 'stade-de-france', name: 'Stade de France', city: 'Saint-Denis', country: 'Francia', capacity: 80698 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-bra-col',
    date: '2026-06-04', time: '22:00', timezone: 'BRT',
    status: 'upcoming',
    home: { id: 'bra', code: 'BRA', name: 'Brasil',   shortName: 'BRA' },
    away: { id: 'col', code: 'COL', name: 'Colombia', shortName: 'COL' },
    venue: { id: 'arena-corinthians', name: 'Arena Corinthians', city: 'São Paulo', country: 'Brasil', capacity: 47605 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-ger-cro',
    date: '2026-06-04', time: '20:45', timezone: 'CEST',
    status: 'upcoming',
    home: { id: 'ger', code: 'GER', name: 'Alemania', shortName: 'GER' },
    away: { id: 'cro', code: 'CRO', name: 'Croacia',  shortName: 'CRO' },
    venue: { id: 'vw-arena', name: 'Volkswagen Arena', city: 'Wolfsburg', country: 'Alemania', capacity: 30000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260605-esp-swe',
    date: '2026-06-05', time: '21:00', timezone: 'CEST',
    status: 'upcoming',
    home: { id: 'esp', code: 'ESP', name: 'España',   shortName: 'ESP' },
    away: { id: 'swe', code: 'SWE', name: 'Suecia',   shortName: 'SWE' },
    venue: { id: 'la-cartuja', name: 'Estadio de La Cartuja', city: 'Sevilla', country: 'España', capacity: 60000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260605-eng-sui',
    date: '2026-06-05', time: '20:00', timezone: 'BST',
    status: 'upcoming',
    home: { id: 'eng', code: 'ENG', name: 'Inglaterra', shortName: 'ENG' },
    away: { id: 'sui', code: 'SUI', name: 'Suiza',      shortName: 'SUI' },
    venue: { id: 'wembley', name: 'Wembley Stadium', city: 'Londres', country: 'Inglaterra', capacity: 90000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-por-irq',
    date: '2026-06-06', time: '21:45', timezone: 'WEST',
    status: 'upcoming',
    home: { id: 'por', code: 'POR', name: 'Portugal', shortName: 'POR' },
    away: { id: 'irq', code: 'IRQ', name: 'Irak',     shortName: 'IRQ' },
    venue: { id: 'estadio-luz', name: 'Estádio da Luz', city: 'Lisboa', country: 'Portugal', capacity: 64642 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-arg-par',
    date: '2026-06-06', time: '21:00', timezone: 'ART',
    status: 'upcoming',
    home: { id: 'arg', code: 'ARG', name: 'Argentina', shortName: 'ARG' },
    away: { id: 'par', code: 'PAR', name: 'Paraguay',  shortName: 'PAR' },
    venue: { id: 'monumental', name: 'Estadio Monumental', city: 'Buenos Aires', country: 'Argentina', capacity: 84567 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260607-mex-pan',
    date: '2026-06-07', time: '20:00', timezone: 'CT',
    status: 'upcoming',
    home: { id: 'mex', code: 'MEX', name: 'México',  shortName: 'MEX' },
    away: { id: 'pan', code: 'PAN', name: 'Panamá',  shortName: 'PAN' },
    venue: { id: 'azteca', name: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', capacity: 87523 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260607-ned-aus',
    date: '2026-06-07', time: '20:30', timezone: 'CEST',
    status: 'upcoming',
    home: { id: 'ned', code: 'NED', name: 'Países Bajos', shortName: 'NED' },
    away: { id: 'aus', code: 'AUS', name: 'Australia',    shortName: 'AUS' },
    venue: { id: 'cruyff-arena', name: 'Johan Cruyff Arena', city: 'Ámsterdam', country: 'Países Bajos', capacity: 54990 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260608-usa-can',
    date: '2026-06-08', time: '20:00', timezone: 'CT',
    status: 'upcoming',
    home: { id: 'usa', code: 'USA', name: 'Estados Unidos', shortName: 'USA' },
    away: { id: 'can', code: 'CAN', name: 'Canadá',         shortName: 'CAN' },
    venue: { id: 'childrens-mercy', name: "Children's Mercy Park", city: 'Kansas City', country: 'EE.UU.', capacity: 18467 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260609-mar-alg',
    date: '2026-06-09', time: '20:00', timezone: 'WET',
    status: 'upcoming',
    home: { id: 'mar', code: 'MAR', name: 'Marruecos', shortName: 'MAR' },
    away: { id: 'alg', code: 'ALG', name: 'Argelia',   shortName: 'ALG' },
    venue: { id: 'stade-mohammed-v', name: 'Stade Mohammed V', city: 'Casablanca', country: 'Marruecos', capacity: 45891 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260609-uru-ecu',
    date: '2026-06-09', time: '21:00', timezone: 'UYT',
    status: 'upcoming',
    home: { id: 'uru', code: 'URU', name: 'Uruguay', shortName: 'URU' },
    away: { id: 'ecu', code: 'ECU', name: 'Ecuador', shortName: 'ECU' },
    venue: { id: 'centenario', name: 'Estadio Centenario', city: 'Montevideo', country: 'Uruguay', capacity: 60235 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260610-sen-tun',
    date: '2026-06-10', time: '18:00', timezone: 'GMT',
    status: 'upcoming',
    home: { id: 'sen', code: 'SEN', name: 'Senegal', shortName: 'SEN' },
    away: { id: 'tun', code: 'TUN', name: 'Túnez',   shortName: 'TUN' },
    venue: { id: 'stade-wade', name: 'Stade Abdoulaye Wade', city: 'Dakar', country: 'Senegal', capacity: 50000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260610-jpn-ksa',
    date: '2026-06-10', time: '19:00', timezone: 'JST',
    status: 'upcoming',
    home: { id: 'jpn', code: 'JPN', name: 'Japón',        shortName: 'JPN' },
    away: { id: 'ksa', code: 'KSA', name: 'Arabia Saudita', shortName: 'KSA' },
    venue: { id: 'japan-national', name: 'Japan National Stadium', city: 'Tokio', country: 'Japón', capacity: 68000 },
    competition: FRIENDLY,
  },
  {
    id: 'frnd-20260610-bel-egy',
    date: '2026-06-10', time: '20:45', timezone: 'CEST',
    status: 'upcoming',
    home: { id: 'bel', code: 'BEL', name: 'Bélgica', shortName: 'BEL' },
    away: { id: 'egy', code: 'EGY', name: 'Egipto',  shortName: 'EGY' },
    venue: { id: 'baudouin', name: 'King Baudouin Stadium', city: 'Bruselas', country: 'Bélgica', capacity: 50024 },
    competition: FRIENDLY,
  },
]

export class MockProvider implements LiveDataProvider {
  readonly id = 'mock'
  readonly name = 'Mock Provider'
  readonly description = 'Static pre-WC 2026 international friendly data for development'

  async fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]> {
    const { from, to, competitionType, teamCode } = options

    let result = MOCK_MATCHES.filter(m => m.date >= from && m.date <= to)

    if (competitionType) {
      result = result.filter(m => m.competition.type === competitionType)
    }

    if (teamCode) {
      const code = teamCode.toUpperCase()
      result = result.filter(m => m.home.code === code || m.away.code === code)
    }

    return result
  }

  async fetchMatchById(id: string): Promise<LiveMatch | null> {
    return MOCK_MATCHES.find(m => m.id === id) ?? null
  }
}
