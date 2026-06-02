import type { LiveDataProvider } from './base-provider'
import type { LiveMatch, LiveCompetition, LiveVenue, FetchMatchesOptions } from '../types'

const FRIENDLY: LiveCompetition = {
  id: 'intl-friendly',
  name: 'Amistoso Internacional',
  shortName: 'Amistoso',
  type: 'friendly',
}

// Venue placeholder for matches where exact stadium/city is unconfirmed
function tbd(country: string): LiveVenue {
  return { id: 'tbd', name: 'Por confirmar', city: 'Por confirmar', country }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE: Lista oficial de fogueos pre-Mundial 2026 (May 30 – Jun 10, 2026)
// Completed = partidos con marcador conocido
// Upcoming  = partidos sin marcador (incluye Jun 1 sin resultados reportados)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_MATCHES: LiveMatch[] = [

  // ══ SÁBADO 30 MAYO — COMPLETED ══════════════════════════════════════════
  {
    id: 'frnd-20260530-sco-cuw',
    date: '2026-05-30', time: '20:00', timezone: 'BST', status: 'completed',
    home: { id: 'sco', code: 'SCO', name: 'Escocia',  shortName: 'SCO', score: 4 },
    away: { id: 'cuw', code: 'CUW', name: 'Curazao',  shortName: 'CUW', score: 1 },
    venue: tbd('Escocia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260530-ecu-ksa',
    date: '2026-05-30', time: '20:00', timezone: 'Local', status: 'completed',
    home: { id: 'ecu', code: 'ECU', name: 'Ecuador',       shortName: 'ECU', score: 2 },
    away: { id: 'ksa', code: 'KSA', name: 'Arabia Saudí',  shortName: 'KSA', score: 1 },
    venue: tbd('Ecuador'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260530-kor-tto',
    date: '2026-05-30', time: '19:00', timezone: 'KST', status: 'completed',
    home: { id: 'kor', code: 'KOR', name: 'Corea del Sur',      shortName: 'KOR', score: 5 },
    away: { id: 'tto', code: 'TTO', name: 'Trinidad y Tobago',  shortName: 'TTO', score: 0 },
    venue: tbd('Corea del Sur'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260530-mex-aus',
    date: '2026-05-30', time: '20:00', timezone: 'CT', status: 'completed',
    home: { id: 'mex', code: 'MEX', name: 'México',    shortName: 'MEX', score: 1 },
    away: { id: 'aus', code: 'AUS', name: 'Australia', shortName: 'AUS', score: 0 },
    venue: tbd('México'), competition: FRIENDLY,
  },

  // ══ DOMINGO 31 MAYO — COMPLETED ══════════════════════════════════════════
  {
    id: 'frnd-20260531-jpn-isl',
    date: '2026-05-31', time: '19:00', timezone: 'JST', status: 'completed',
    home: { id: 'jpn', code: 'JPN', name: 'Japón',    shortName: 'JPN', score: 1 },
    away: { id: 'isl', code: 'ISL', name: 'Islandia', shortName: 'ISL', score: 0 },
    venue: tbd('Japón'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-sui-jor',
    date: '2026-05-31', time: '20:45', timezone: 'CEST', status: 'completed',
    home: { id: 'sui', code: 'SUI', name: 'Suiza',    shortName: 'SUI', score: 4 },
    away: { id: 'jor', code: 'JOR', name: 'Jordania', shortName: 'JOR', score: 1 },
    venue: tbd('Suiza'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-cze-kos',
    date: '2026-05-31', time: '20:30', timezone: 'CEST', status: 'completed',
    home: { id: 'cze', code: 'CZE', name: 'Chequia', shortName: 'CZE', score: 2 },
    away: { id: 'kos', code: 'KOS', name: 'Kosovo',  shortName: 'KOS', score: 1 },
    venue: tbd('República Checa'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-cpv-srb',
    date: '2026-05-31', time: '20:00', timezone: 'WET', status: 'completed',
    home: { id: 'cpv', code: 'CPV', name: 'Cabo Verde', shortName: 'CPV', score: 3 },
    away: { id: 'srb', code: 'SRB', name: 'Serbia',     shortName: 'SRB', score: 0 },
    venue: tbd('Cabo Verde'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-pol-ukr',
    date: '2026-05-31', time: '20:45', timezone: 'CEST', status: 'completed',
    home: { id: 'pol', code: 'POL', name: 'Polonia',  shortName: 'POL', score: 0 },
    away: { id: 'ukr', code: 'UKR', name: 'Ucrania',  shortName: 'UKR', score: 2 },
    venue: tbd('Polonia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-ger-fin',
    date: '2026-05-31', time: '20:45', timezone: 'CEST', status: 'completed',
    home: { id: 'ger', code: 'GER', name: 'Alemania',  shortName: 'GER', score: 4 },
    away: { id: 'fin', code: 'FIN', name: 'Finlandia', shortName: 'FIN', score: 0 },
    venue: tbd('Alemania'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-usa-sen',
    date: '2026-05-31', time: '19:00', timezone: 'ET', status: 'completed',
    home: { id: 'usa', code: 'USA', name: 'Estados Unidos', shortName: 'USA', score: 3 },
    away: { id: 'sen', code: 'SEN', name: 'Senegal',        shortName: 'SEN', score: 2 },
    venue: tbd('EE.UU.'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260531-bra-pan',
    date: '2026-05-31', time: '21:00', timezone: 'BRT', status: 'completed',
    home: { id: 'bra', code: 'BRA', name: 'Brasil', shortName: 'BRA', score: 6 },
    away: { id: 'pan', code: 'PAN', name: 'Panamá', shortName: 'PAN', score: 2 },
    venue: tbd('Brasil'), competition: FRIENDLY,
  },

  // ══ LUNES 1 JUNIO — UPCOMING ══════════════════════════════════════════════
  {
    id: 'frnd-20260601-svk-mlt',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'svk', code: 'SVK', name: 'Eslovaquia', shortName: 'SVK' },
    away: { id: 'mlt', code: 'MLT', name: 'Malta',      shortName: 'MLT' },
    venue: tbd('Eslovaquia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260601-nor-swe',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'nor', code: 'NOR', name: 'Noruega', shortName: 'NOR' },
    away: { id: 'swe', code: 'SWE', name: 'Suecia',  shortName: 'SWE' },
    venue: tbd('Noruega'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260601-tur-mkd',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'tur', code: 'TUR', name: 'Türkiye',             shortName: 'TUR' },
    away: { id: 'mkd', code: 'MKD', name: 'Macedonia del Norte', shortName: 'MKD' },
    venue: tbd('Türkiye'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260601-aut-tun',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'aut', code: 'AUT', name: 'Austria', shortName: 'AUT' },
    away: { id: 'tun', code: 'TUN', name: 'Túnez',   shortName: 'TUN' },
    venue: tbd('Austria'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260601-col-crc',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'col', code: 'COL', name: 'Colombia',   shortName: 'COL' },
    away: { id: 'crc', code: 'CRC', name: 'Costa Rica', shortName: 'CRC' },
    venue: tbd('Colombia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260601-can-uzb',
    date: '2026-06-01', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'can', code: 'CAN', name: 'Canadá',    shortName: 'CAN' },
    away: { id: 'uzb', code: 'UZB', name: 'Uzbekistán', shortName: 'UZB' },
    venue: tbd('Canadá'), competition: FRIENDLY,
  },

  // ══ MARTES 2 JUNIO — UPCOMING ════════════════════════════════════════════
  {
    id: 'frnd-20260602-cro-bel',
    date: '2026-06-02', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'cro', code: 'CRO', name: 'Croacia',  shortName: 'CRO' },
    away: { id: 'bel', code: 'BEL', name: 'Bélgica',  shortName: 'BEL' },
    venue: tbd('Croacia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260602-mar-mad',
    date: '2026-06-02', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'mar', code: 'MAR', name: 'Marruecos', shortName: 'MAR' },
    away: { id: 'mad', code: 'MAD', name: 'Madagascar', shortName: 'MAD' },
    venue: tbd('Marruecos'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260602-wal-gha',
    date: '2026-06-02', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'wal', code: 'WAL', name: 'Gales', shortName: 'WAL' },
    away: { id: 'gha', code: 'GHA', name: 'Ghana', shortName: 'GHA' },
    venue: tbd('Gales'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260602-hai-nzl',
    date: '2026-06-02', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'hai', code: 'HAI', name: 'Haití',        shortName: 'HAI' },
    away: { id: 'nzl', code: 'NZL', name: 'Nueva Zelanda', shortName: 'NZL' },
    venue: tbd('Haití'), competition: FRIENDLY,
  },

  // ══ MIÉRCOLES 3 JUNIO — UPCOMING ══════════════════════════════════════════
  {
    id: 'frnd-20260603-den-cod',
    date: '2026-06-03', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'den', code: 'DEN', name: 'Dinamarca',                     shortName: 'DEN' },
    away: { id: 'cod', code: 'COD', name: 'Rep. Democrática del Congo',    shortName: 'COD' },
    venue: tbd('Dinamarca'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260603-ned-alg',
    date: '2026-06-03', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'ned', code: 'NED', name: 'Países Bajos', shortName: 'NED' },
    away: { id: 'alg', code: 'ALG', name: 'Argelia',       shortName: 'ALG' },
    venue: tbd('Países Bajos'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260603-pol-nga',
    date: '2026-06-03', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'pol', code: 'POL', name: 'Polonia',  shortName: 'POL' },
    away: { id: 'nga', code: 'NGA', name: 'Nigeria',  shortName: 'NGA' },
    venue: tbd('Polonia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260603-pan-dom',
    date: '2026-06-03', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'pan', code: 'PAN', name: 'Panamá',                  shortName: 'PAN' },
    away: { id: 'dom', code: 'DOM', name: 'República Dominicana',    shortName: 'DOM' },
    venue: tbd('Panamá'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260603-kor-slv',
    date: '2026-06-03', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'kor', code: 'KOR', name: 'Corea del Sur', shortName: 'KOR' },
    away: { id: 'slv', code: 'SLV', name: 'El Salvador',   shortName: 'SLV' },
    venue: tbd('Corea del Sur'), competition: FRIENDLY,
  },

  // ══ JUEVES 4 JUNIO — UPCOMING ════════════════════════════════════════════
  {
    id: 'frnd-20260604-swe-gre',
    date: '2026-06-04', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'swe', code: 'SWE', name: 'Suecia',  shortName: 'SWE' },
    away: { id: 'gre', code: 'GRE', name: 'Grecia',  shortName: 'GRE' },
    venue: tbd('Suecia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-esp-irq',
    date: '2026-06-04', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'esp', code: 'ESP', name: 'España', shortName: 'ESP' },
    away: { id: 'irq', code: 'IRQ', name: 'Irak',   shortName: 'IRQ' },
    venue: tbd('España'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-fra-civ',
    date: '2026-06-04', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'fra', code: 'FRA', name: 'Francia',          shortName: 'FRA' },
    away: { id: 'civ', code: 'CIV', name: 'Costa de Marfil',  shortName: 'CIV' },
    venue: tbd('Francia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-gua-cze',
    date: '2026-06-04', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'gua', code: 'GUA', name: 'Guatemala', shortName: 'GUA' },
    away: { id: 'cze', code: 'CZE', name: 'Chequia',   shortName: 'CZE' },
    venue: tbd('Guatemala'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260604-mex-srb',
    date: '2026-06-04', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'mex', code: 'MEX', name: 'México', shortName: 'MEX' },
    away: { id: 'srb', code: 'SRB', name: 'Serbia', shortName: 'SRB' },
    venue: tbd('México'), competition: FRIENDLY,
  },

  // ══ VIERNES 5 JUNIO — UPCOMING ═══════════════════════════════════════════
  {
    id: 'frnd-20260605-par-nca',
    date: '2026-06-05', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'par', code: 'PAR', name: 'Paraguay',  shortName: 'PAR' },
    away: { id: 'nca', code: 'NCA', name: 'Nicaragua', shortName: 'NCA' },
    venue: tbd('Paraguay'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260605-can-irl',
    date: '2026-06-05', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'can', code: 'CAN', name: 'Canadá',  shortName: 'CAN' },
    away: { id: 'irl', code: 'IRL', name: 'Irlanda', shortName: 'IRL' },
    venue: tbd('Canadá'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260605-hai-per',
    date: '2026-06-05', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'hai', code: 'HAI', name: 'Haití', shortName: 'HAI' },
    away: { id: 'per', code: 'PER', name: 'Perú',  shortName: 'PER' },
    venue: tbd('Haití'), competition: FRIENDLY,
  },

  // ══ SÁBADO 6 JUNIO — UPCOMING ════════════════════════════════════════════
  {
    id: 'frnd-20260606-arg-hon',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'arg', code: 'ARG', name: 'Argentina', shortName: 'ARG' },
    away: { id: 'hon', code: 'HON', name: 'Honduras',  shortName: 'HON' },
    venue: tbd('Argentina'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-aus-sui',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'aus', code: 'AUS', name: 'Australia', shortName: 'AUS' },
    away: { id: 'sui', code: 'SUI', name: 'Suiza',     shortName: 'SUI' },
    venue: tbd('Australia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-bel-tun',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'bel', code: 'BEL', name: 'Bélgica', shortName: 'BEL' },
    away: { id: 'tun', code: 'TUN', name: 'Túnez',   shortName: 'TUN' },
    venue: tbd('Bélgica'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-bra-egy',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'bra', code: 'BRA', name: 'Brasil', shortName: 'BRA' },
    away: { id: 'egy', code: 'EGY', name: 'Egipto', shortName: 'EGY' },
    venue: tbd('Brasil'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-cuw-aru',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'cuw', code: 'CUW', name: 'Curazao', shortName: 'CUW' },
    away: { id: 'aru', code: 'ARU', name: 'Aruba',   shortName: 'ARU' },
    venue: tbd('Curazao'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-slv-qat',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'slv', code: 'SLV', name: 'El Salvador', shortName: 'SLV' },
    away: { id: 'qat', code: 'QAT', name: 'Qatar',        shortName: 'QAT' },
    venue: tbd('El Salvador'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-eng-nzl',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'eng', code: 'ENG', name: 'Inglaterra',    shortName: 'ENG' },
    away: { id: 'nzl', code: 'NZL', name: 'Nueva Zelanda', shortName: 'NZL' },
    venue: tbd('Inglaterra'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-por-chi',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'por', code: 'POR', name: 'Portugal', shortName: 'POR' },
    away: { id: 'chi', code: 'CHI', name: 'Chile',    shortName: 'CHI' },
    venue: tbd('Portugal'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-sco-bol',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'sco', code: 'SCO', name: 'Escocia', shortName: 'SCO' },
    away: { id: 'bol', code: 'BOL', name: 'Bolivia',  shortName: 'BOL' },
    venue: tbd('Escocia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-usa-ger',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'usa', code: 'USA', name: 'Estados Unidos', shortName: 'USA' },
    away: { id: 'ger', code: 'GER', name: 'Alemania',        shortName: 'GER' },
    venue: tbd('EE.UU.'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-ven-tur',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'ven', code: 'VEN', name: 'Venezuela', shortName: 'VEN' },
    away: { id: 'tur', code: 'TUR', name: 'Türkiye',   shortName: 'TUR' },
    venue: tbd('Venezuela'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260606-pan-bih',
    date: '2026-06-06', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'pan', code: 'PAN', name: 'Panamá',               shortName: 'PAN' },
    away: { id: 'bih', code: 'BIH', name: 'Bosnia y Herzegovina', shortName: 'BIH' },
    venue: tbd('Panamá'), competition: FRIENDLY,
  },

  // ══ DOMINGO 7 JUNIO — UPCOMING ═══════════════════════════════════════════
  {
    id: 'frnd-20260607-col-jor',
    date: '2026-06-07', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'col', code: 'COL', name: 'Colombia', shortName: 'COL' },
    away: { id: 'jor', code: 'JOR', name: 'Jordania', shortName: 'JOR' },
    venue: tbd('Colombia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260607-cro-svn',
    date: '2026-06-07', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'cro', code: 'CRO', name: 'Croacia',   shortName: 'CRO' },
    away: { id: 'svn', code: 'SVN', name: 'Eslovenia', shortName: 'SVN' },
    venue: tbd('Croacia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260607-ecu-gua',
    date: '2026-06-07', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'ecu', code: 'ECU', name: 'Ecuador',   shortName: 'ECU' },
    away: { id: 'gua', code: 'GUA', name: 'Guatemala', shortName: 'GUA' },
    venue: tbd('Ecuador'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260607-mar-nor',
    date: '2026-06-07', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'mar', code: 'MAR', name: 'Marruecos', shortName: 'MAR' },
    away: { id: 'nor', code: 'NOR', name: 'Noruega',   shortName: 'NOR' },
    venue: tbd('Marruecos'), competition: FRIENDLY,
  },

  // ══ LUNES 8 JUNIO — UPCOMING ════════════════════════════════════════════
  {
    id: 'frnd-20260608-fra-nir',
    date: '2026-06-08', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'fra', code: 'FRA', name: 'Francia',            shortName: 'FRA' },
    away: { id: 'nir', code: 'NIR', name: 'Irlanda del Norte',  shortName: 'NIR' },
    venue: tbd('Francia'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260608-per-esp',
    date: '2026-06-08', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'per', code: 'PER', name: 'Perú',   shortName: 'PER' },
    away: { id: 'esp', code: 'ESP', name: 'España', shortName: 'ESP' },
    venue: tbd('Perú'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260608-ned-uzb',
    date: '2026-06-08', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'ned', code: 'NED', name: 'Países Bajos', shortName: 'NED' },
    away: { id: 'uzb', code: 'UZB', name: 'Uzbekistán',   shortName: 'UZB' },
    venue: tbd('Países Bajos'), competition: FRIENDLY,
  },

  // ══ MARTES 9 JUNIO — UPCOMING ════════════════════════════════════════════
  {
    id: 'frnd-20260609-arg-isl',
    date: '2026-06-09', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'arg', code: 'ARG', name: 'Argentina', shortName: 'ARG' },
    away: { id: 'isl', code: 'ISL', name: 'Islandia',  shortName: 'ISL' },
    venue: tbd('Argentina'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260609-ksa-sen',
    date: '2026-06-09', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'ksa', code: 'KSA', name: 'Arabia Saudí', shortName: 'KSA' },
    away: { id: 'sen', code: 'SEN', name: 'Senegal',       shortName: 'SEN' },
    venue: tbd('Arabia Saudí'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260609-cod-chi',
    date: '2026-06-09', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'cod', code: 'COD', name: 'Rep. Democrática del Congo', shortName: 'COD' },
    away: { id: 'chi', code: 'CHI', name: 'Chile',                       shortName: 'CHI' },
    venue: tbd('Por confirmar'), competition: FRIENDLY,
  },

  // ══ MIÉRCOLES 10 JUNIO — UPCOMING ════════════════════════════════════════
  {
    id: 'frnd-20260610-eng-crc',
    date: '2026-06-10', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'eng', code: 'ENG', name: 'Inglaterra', shortName: 'ENG' },
    away: { id: 'crc', code: 'CRC', name: 'Costa Rica', shortName: 'CRC' },
    venue: tbd('Inglaterra'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260610-gua-aut',
    date: '2026-06-10', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'gua', code: 'GUA', name: 'Guatemala', shortName: 'GUA' },
    away: { id: 'aut', code: 'AUT', name: 'Austria',   shortName: 'AUT' },
    venue: tbd('Guatemala'), competition: FRIENDLY,
  },
  {
    id: 'frnd-20260610-por-nga',
    date: '2026-06-10', time: 'TBD', timezone: 'TBD', status: 'upcoming',
    home: { id: 'por', code: 'POR', name: 'Portugal', shortName: 'POR' },
    away: { id: 'nga', code: 'NGA', name: 'Nigeria',  shortName: 'NGA' },
    venue: tbd('Portugal'), competition: FRIENDLY,
  },
]

export class MockProvider implements LiveDataProvider {
  readonly id = 'mock'
  readonly name = 'Mock Provider'
  readonly description = 'Official pre-WC 2026 international friendly schedule (May 30 – Jun 10)'

  async fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]> {
    const { from, to, competitionType, teamCode } = options
    let result = MOCK_MATCHES.filter(m => m.date >= from && m.date <= to)
    if (competitionType) result = result.filter(m => m.competition.type === competitionType)
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
