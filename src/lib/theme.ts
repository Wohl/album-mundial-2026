export const colors = {
  dark:     '#081120',
  surface:  '#0F172A',
  surface2: '#132030',
  surface3: '#1A2840',
  surface4: '#213255',
  gold:     '#F5C542',
  gold2:    '#FFD700',
  goldLight:'#FFF5CC',
  humo:     '#F3F4F6',
  verde:    '#0E5A36',
} as const

export const gradients = {
  gold: 'linear-gradient(135deg, #F5C542, #FFD700, #FFF5CC)',
  activeTab: 'linear-gradient(135deg, #F5C542, #FFD700)',
  cardOwned: 'linear-gradient(to bottom, rgba(5,46,22,0.40), #132030, #132030)',
  cardRepeated: 'linear-gradient(to bottom, rgba(120,53,15,0.30), #132030, #132030)',
  cardFoil: 'linear-gradient(to bottom, rgba(133,77,14,0.50), #132030, #132030)',
  cardLegend: 'linear-gradient(to bottom, rgba(88,28,135,0.60), #132030, #132030)',
} as const

export const borders = {
  tab: {
    active:   'rgba(245,197,66,0.5)',
    inactive: 'rgba(42,60,90,0.45)',
    hover:    'rgba(245,197,66,0.35)',
  },
  card: {
    owned:    'rgba(34,197,94,0.35)',
    repeated: 'rgba(245,158,11,0.35)',
    foil:     'rgba(255,215,0,0.60)',
    legend:   'rgba(168,85,247,0.50)',
    missing:  'rgba(42,60,90,0.80)',
  },
} as const

export const text = {
  tabActive:   '#0B1624',
  tabInactive: 'rgba(163,181,211,0.75)',
  tabHover:    '#E5E7EB',
  muted:       'rgba(163,181,211,0.35)',
} as const

export const shadows = {
  activeTab:    '0 3px 16px rgba(245,197,66,0.28), 0 1px 0 rgba(255,255,255,0.2) inset',
  goldSm:       '0 0 18px rgba(245,197,66,0.35), 0 2px 8px rgba(0,0,0,0.5)',
  plasmaSm:     '0 0 18px rgba(168,85,247,0.35), 0 2px 8px rgba(0,0,0,0.5)',
} as const
