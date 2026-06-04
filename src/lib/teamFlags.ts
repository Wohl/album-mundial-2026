// Maps album team codes → ISO 3166-1 alpha-2 codes used by flag-icons
// Last audited: 2026-06-03 against real apifootball.com API response (237 matches, 165 unique codes)
export const TEAM_ISO2: Record<string, string> = {
  // ── Mundial 2026 — Grupo A ────────────────────────────────────
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  // ── Grupo B ──────────────────────────────────────────────────
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  // ── Grupo C ──────────────────────────────────────────────────
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  // ── Grupo D ──────────────────────────────────────────────────
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  // ── Grupo E ──────────────────────────────────────────────────
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  // ── Grupo F ──────────────────────────────────────────────────
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  // ── Grupo G ──────────────────────────────────────────────────
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  // ── Grupo H ──────────────────────────────────────────────────
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  // ── Grupo I ──────────────────────────────────────────────────
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  // ── Grupo J ──────────────────────────────────────────────────
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  // ── Grupo K ──────────────────────────────────────────────────
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  // ── Grupo L ──────────────────────────────────────────────────
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',

  // ── Amistosos — selecciones no clasificadas al Mundial 2026 ───
  // Americas
  ARU: 'aw',      // Aruba
  BOL: 'bo',      // Bolivia
  CHI: 'cl',      // Chile
  CRC: 'cr',      // Costa Rica
  DOM: 'do',      // República Dominicana
  GUA: 'gt',      // Guatemala
  HON: 'hn',      // Honduras
  IRL: 'ie',      // Irlanda
  NCA: 'ni',      // Nicaragua
  NIR: 'gb-nir',  // Irlanda del Norte
  PER: 'pe',      // Perú
  SLV: 'sv',      // El Salvador
  TTO: 'tt',      // Trinidad y Tobago
  VEN: 've',      // Venezuela
  WAL: 'gb-wls',  // Gales

  // Europa
  DEN: 'dk',      // Dinamarca
  FIN: 'fi',      // Finlandia
  GRE: 'gr',      // Grecia
  ISL: 'is',      // Islandia
  KOS: 'xk',      // Kosovo (código no oficial — soportado por flag-icons)
  MKD: 'mk',      // Macedonia del Norte
  MLT: 'mt',      // Malta
  POL: 'pl',      // Polonia
  SRB: 'rs',      // Serbia
  SVK: 'sk',      // Eslovaquia
  SVN: 'si',      // Eslovenia
  UKR: 'ua',      // Ucrania

  // ── Cobertura extendida — auditoría API real 2026-06-03 ────────
  // (165 códigos únicos detectados en 237 amistosos internacionales)

  // Europa ampliada
  ALB: 'al',      // Albania
  AND: 'ad',      // Andorra
  ARM: 'am',      // Armenia
  AZE: 'az',      // Azerbaiyán
  BUL: 'bg',      // Bulgaria
  CYP: 'cy',      // Chipre
  EST: 'ee',      // Estonia
  GEO: 'ge',      // Georgia
  GIB: 'gi',      // Gibraltar
  HUN: 'hu',      // Hungría
  IRE: 'ie',      // Irlanda (alias de IRL — variante de API)
  ITA: 'it',      // Italia
  LAT: 'lv',      // Letonia
  LIE: 'li',      // Liechtenstein
  LIT: 'lt',      // Lituania
  LUX: 'lu',      // Luxemburgo
  MNE: 'me',      // Montenegro
  MOL: 'md',      // Moldavia
  MON: 'mc',      // Mónaco
  ROM: 'ro',      // Rumanía (alias de ROU — variante de API)
  ROU: 'ro',      // Rumanía
  RUS: 'ru',      // Rusia
  SLO: 'si',      // Eslovenia (alias de SVN — variante de API)
  SMR: 'sm',      // San Marino

  // Américas ampliado
  BAH: 'bs',      // Bahamas
  BER: 'bm',      // Bermuda
  CAY: 'ky',      // Islas Caimán
  CUB: 'cu',      // Cuba
  JAM: 'jm',      // Jamaica
  PAK: 'pk',      // Pakistán
  PUE: 'pr',      // Puerto Rico

  // África
  ANG: 'ao',      // Angola
  BEN: 'bj',      // Benín
  BFA: 'bf',      // Burkina Faso
  BOT: 'bw',      // Botsuana
  BUR: 'bi',      // Burundi
  CAM: 'kh',      // Cambodia (apifootball.com usa CAM para Cambodia, CMR para Camerún)
  CEN: 'cf',      // República Centroafricana
  COM: 'km',      // Comoras
  ETH: 'et',      // Etiopía
  GAM: 'gm',      // Gambia
  GUI: 'gn',      // Guinea
  KEN: 'ke',      // Kenia
  LBA: 'ly',      // Libia (código FIFA oficial)
  LES: 'ls',      // Lesoto
  LIB: 'ly',      // Libia (variante de API)
  MAD: 'mg',      // Madagascar
  MLI: 'ml',      // Malí
  MOZ: 'mz',      // Mozambique
  NGA: 'ng',      // Nigeria
  NIG: 'ne',      // Níger (distinto de Nigeria/NGA)
  RWA: 'rw',      // Ruanda
  SDN: 'sd',      // Sudán
  SIE: 'sl',      // Sierra Leona
  TAN: 'tz',      // Tanzania
  TOG: 'tg',      // Togo
  UGA: 'ug',      // Uganda
  ZIM: 'zw',      // Zimbabue

  // Asia
  AFG: 'af',      // Afganistán
  BAN: 'bd',      // Bangladesh
  BHR: 'bh',      // Baréin
  BHU: 'bt',      // Bután
  CHN: 'cn',      // China
  IDN: 'id',      // Indonesia
  IND: 'in',      // India
  IRA: 'ir',      // Irán (alias de IRN — variante de API para selección juvenil)
  ISR: 'il',      // Israel
  JAP: 'jp',      // Japón (alias de JPN — variante de API para selección juvenil)
  KAZ: 'kz',      // Kazajistán
  KGZ: 'kg',      // Kirguistán
  KWT: 'kw',      // Kuwait
  KYR: 'kg',      // Kirguistán (alias de KGZ — variante de API)
  LBN: 'lb',      // Líbano
  MAU: 'mr',      // Mauritania
  MYA: 'mm',      // Myanmar
  OMA: 'om',      // Omán
  PHI: 'ph',      // Filipinas
  PLE: 'ps',      // Palestina
  SAU: 'sa',      // Arabia Saudí (alias de KSA — variante de API)
  SGP: 'sg',      // Singapur
  SIN: 'sg',      // Singapur (alias de SGP — variante de API)
  SYR: 'sy',      // Siria
  TAJ: 'tj',      // Tayikistán (alias de TJK — variante de API)
  THA: 'th',      // Tailandia
  TJK: 'tj',      // Tayikistán
  TKM: 'tm',      // Turkmenistán

  // Oceanía / Pacífico
  EQU: 'gq',      // Guinea Ecuatorial
  FIJ: 'fj',      // Fiyi
  VAN: 'vu',      // Vanuatu
}
