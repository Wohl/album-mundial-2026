import { Sticker } from '@/types'
import { INTRO_STICKERS, TEAMS } from '@/stickers'

const DEFAULT_STICKERS: Sticker[] = INTRO_STICKERS.map((s) => ({
  id: s.id,
  name: s.name,
  type: 'intro',
  foil: s.foil,
}))

const TEAM_STICKERS: Sticker[] = TEAMS.flatMap((team) =>
  Array.from({ length: 20 }, (_, i) => {
    const isFoilSticker = i === 0
    return {
      id: `${team.code}_${i}`,
      name: `${team.name} - ${team.players[i]}`,
      team: team.name,
      type: 'regular' as const,
      foil: isFoilSticker,
    }
  })
)

export const getAllStickers = (): Sticker[] => {
  return [...DEFAULT_STICKERS, ...TEAM_STICKERS]
}

export const getTotalStickers = (): number => {
  return DEFAULT_STICKERS.length + TEAM_STICKERS.length
}

export const getCountByType = (type: string): number => {
  return getAllStickers().filter((s) => s.type === type).length
}

export const getStickersByType = (type: string): Sticker[] => {
  return getAllStickers().filter((s) => s.type === type)
}

export const getTeamStickers = (teamCode: string): Sticker[] => {
  return TEAM_STICKERS.filter((s) => s.id.startsWith(teamCode))
}

let stickerNameCache: Map<string, string> | null = null

export const getStickerName = (key: string): string => {
  if (!stickerNameCache) {
    stickerNameCache = new Map(getAllStickers().map((s) => [s.id, s.name]))
  }
  return stickerNameCache.get(key) ?? key
}
