import { Sticker } from '@/types'
import { INTRO_FWC_STICKERS, FINAL_FWC_STICKERS, COCA_COLA_STICKERS, TEAMS } from '@/stickers'

const INTRO_LIST: Sticker[] = INTRO_FWC_STICKERS.map((s) => ({
  id: s.id,
  name: s.name,
  type: 'intro',
  foil: s.foil,
}))

const FINAL_LIST: Sticker[] = FINAL_FWC_STICKERS.map((s) => ({
  id: s.id,
  name: s.name,
  type: 'final',
  foil: s.foil,
}))

const CC_LIST: Sticker[] = COCA_COLA_STICKERS.map((s) => ({
  id: s.id,
  name: s.name,
  type: 'cocacola',
  foil: s.foil,
}))

const TEAM_STICKERS: Sticker[] = TEAMS.flatMap((team) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `${team.code}_${i}`,
    name: `${team.name} - ${team.players[i]}`,
    team: team.name,
    type: 'regular' as const,
    foil: i === 0,
  }))
)

export const getIntroFWCStickers = (): Sticker[] => INTRO_LIST
export const getFinalFWCStickers = (): Sticker[] => FINAL_LIST
export const getCocaColaStickers = (): Sticker[] => CC_LIST

export const getAllStickers = (): Sticker[] => [
  ...INTRO_LIST,
  ...TEAM_STICKERS,
  ...FINAL_LIST,
  ...CC_LIST,
]

export const getTotalStickers = (): number =>
  INTRO_LIST.length + TEAM_STICKERS.length + FINAL_LIST.length + CC_LIST.length

export const getTeamStickers = (teamCode: string): Sticker[] =>
  TEAM_STICKERS.filter((s) => s.id.startsWith(teamCode + '_'))

let stickerNameCache: Map<string, string> | null = null

export const getStickerName = (key: string): string => {
  if (!stickerNameCache) {
    stickerNameCache = new Map(getAllStickers().map((s) => [s.id, s.name]))
  }
  return stickerNameCache.get(key) ?? key
}
