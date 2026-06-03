// Maps English team names returned by API-Football to FIFA 3-letter codes.
// API-Football uses English names; our app uses standard FIFA codes.
// Add aliases as needed — API-Football may return multiple name variants.
// Last audited: 2026-06-03 against WC 2026 draw (48 teams) + common friendlies opponents.

const NAME_TO_CODE: Record<string, string> = {
  // ── Group A ──────────────────────────────────────────────────
  'Mexico':           'MEX',
  'South Africa':     'RSA',
  'Korea Republic':   'KOR',
  'South Korea':      'KOR',
  'Czech Republic':   'CZE',
  'Czechia':          'CZE',

  // ── Group B ──────────────────────────────────────────────────
  'Canada':                    'CAN',
  'Bosnia and Herzegovina':    'BIH',
  'Bosnia & Herzegovina':      'BIH',
  'Qatar':                     'QAT',
  'Switzerland':               'SUI',

  // ── Group C ──────────────────────────────────────────────────
  'Brazil':    'BRA',
  'Morocco':   'MAR',
  'Haiti':     'HAI',
  'Scotland':  'SCO',

  // ── Group D ──────────────────────────────────────────────────
  'United States':   'USA',
  'USA':             'USA',
  'Paraguay':        'PAR',
  'Australia':       'AUS',
  'Turkey':          'TUR',
  'Türkiye':         'TUR',

  // ── Group E ──────────────────────────────────────────────────
  'Germany':        'GER',
  'Curacao':        'CUW',
  'Curaçao':        'CUW',
  'Ivory Coast':    'CIV',
  "Côte d'Ivoire":  'CIV',
  "Cote d'Ivoire":  'CIV',
  'Ecuador':        'ECU',

  // ── Group F ──────────────────────────────────────────────────
  'Netherlands':  'NED',
  'Holland':      'NED',
  'Japan':        'JPN',
  'Sweden':       'SWE',
  'Tunisia':      'TUN',

  // ── Group G ──────────────────────────────────────────────────
  'Belgium':      'BEL',
  'Egypt':        'EGY',
  'Iran':         'IRN',
  'New Zealand':  'NZL',

  // ── Group H ──────────────────────────────────────────────────
  'Spain':        'ESP',
  'Cape Verde':   'CPV',
  'Saudi Arabia': 'KSA',
  'Uruguay':      'URU',

  // ── Group I ──────────────────────────────────────────────────
  'France':   'FRA',
  'Senegal':  'SEN',
  'Iraq':     'IRQ',
  'Norway':   'NOR',

  // ── Group J ──────────────────────────────────────────────────
  'Argentina':  'ARG',
  'Algeria':    'ALG',
  'Austria':    'AUT',
  'Jordan':     'JOR',

  // ── Group K ──────────────────────────────────────────────────
  'Portugal':                  'POR',
  'DR Congo':                  'COD',
  'Congo DR':                  'COD',
  'Democratic Republic of Congo': 'COD',
  'Congo':                     'COD',
  'Uzbekistan':                'UZB',
  'Colombia':                  'COL',

  // ── Group L ──────────────────────────────────────────────────
  'England':  'ENG',
  'Croatia':  'CRO',
  'Ghana':    'GHA',
  'Panama':   'PAN',

  // ── Common amistosos opponents (non-WC) ──────────────────────
  'Costa Rica':          'CRC',
  'Wales':               'WAL',
  'Trinidad and Tobago': 'TTO',
  'Trinidad & Tobago':   'TTO',
  'Kenya':               'KEN',
  'Israel':              'ISR',
  'China':               'CHN',
  'China PR':            'CHN',
  'Venezuela':           'VEN',
  'Bolivia':             'BOL',
  'Chile':               'CHI',
  'Peru':                'PER',
  'Honduras':            'HON',
  'El Salvador':         'SLV',
  'Jamaica':             'JAM',
  'Guatemala':           'GUA',
  'Cuba':                'CUB',
  'Russia':              'RUS',
  'Ukraine':             'UKR',
  'Poland':              'POL',
  'Greece':              'GRE',
  'Serbia':              'SRB',
  'Romania':             'ROU',
  'Hungary':             'HUN',
  'Denmark':             'DEN',
  'Finland':             'FIN',
  'Iceland':             'ISL',
  'Slovakia':            'SVK',
  'Slovenia':            'SVN',
  'Albania':             'ALB',
  'Montenegro':          'MNE',
  'North Macedonia':     'MKD',
  'Kosovo':              'KOS',  // API-Football uses KOS; UEFA uses KVX
  'Luxembourg':          'LUX',
  'Liechtenstein':       'LIE',
  'Andorra':             'AND',
  'Faroe Islands':       'FRO',
  'Gibraltar':           'GIB',
  'San Marino':          'SMR',
  'Malta':               'MLT',
  'Cameroon':            'CMR',
  'Nigeria':             'NGA',
  'Mali':                'MLI',
  'Guinea':              'GUI',
  'Burkina Faso':        'BFA',
  'Sudan':               'SDN',
  'Ethiopia':            'ETH',
  'Tanzania':            'TAN',
  'Uganda':              'UGA',
  'Zambia':              'ZAM',
  'Zimbabwe':            'ZIM',
  'Angola':              'ANG',
  'Mozambique':          'MOZ',
  'Namibia':             'NAM',
  'Botswana':            'BOT',
  'Mauritius':           'MRI',
  'Libya':               'LBA',
  'UAE':                 'UAE',
  'United Arab Emirates':'UAE',
  'Bahrain':             'BHR',
  'Kuwait':              'KWT',
  'Oman':                'OMA',
  'Syria':               'SYR',
  'Lebanon':             'LBN',
  'Palestine':           'PLE',
  'Thailand':            'THA',
  'Vietnam':             'VIE',
  'Indonesia':           'IDN',
  'Philippines':         'PHI',
  'Malaysia':            'MAS',
  'Singapore':           'SGP',
  'Myanmar':             'MYA',
  'India':               'IND',
  'Afghanistan':         'AFG',
  'Tajikistan':          'TJK',
  'Kyrgyzstan':          'KGZ',
  'Turkmenistan':        'TKM',
  'Kazakhstan':          'KAZ',

  // ── apifootball.com variant names (validated Sprint 3) ────────
  'D.R. Congo':             'COD',  // apifootball uses "D.R. Congo" not "DR Congo"
  // "Ivory Coast" already mapped at line 40 — apifootball.com confirmed variant

  // ── Additional teams found in mock/friendlies data ────────────
  'Aruba':                  'ARU',
  'Dominican Republic':     'DOM',
  'Republic of Ireland':    'IRL',
  'Ireland':                'IRL',
  // Kosovo already mapped above
  'Madagascar':             'MAD',
  'Nicaragua':              'NCA',
  'Northern Ireland':       'NIR',
}

/** Returns the FIFA 3-letter code for the given English team name, or a
 *  normalised fallback (first 3 chars uppercased) if the name is unknown. */
export function resolveTeamCode(englishName: string): string {
  const hit = NAME_TO_CODE[englishName]
  if (hit) return hit

  // Partial / case-insensitive fallback
  const lower = englishName.toLowerCase()
  for (const [key, code] of Object.entries(NAME_TO_CODE)) {
    if (key.toLowerCase() === lower) return code
  }

  // Unknown team — return a normalised slug so the app doesn't crash
  return englishName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'UNK'
}
