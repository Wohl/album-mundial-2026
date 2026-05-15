import { useState, useEffect, useMemo } from 'react'
import {
  fetchAllStates, fetchAllProfiles, fetchRecentTrades,
  fetchPacksPerUser, fetchTradesPerUser,
  RankEntry, GlobalStats, StickerHeat, FeedItem,
} from '@/services/dashboardService'

export type { RankEntry, GlobalStats, StickerHeat, FeedItem }

const TOTAL = 994

type RawState = { user_id: string; sticker_key: string; status: string; repeat_count: number | null }

export interface DashboardData {
  loading: boolean
  ranking: RankEntry[]
  globalStats: GlobalStats
  mostWanted: StickerHeat[]
  mostAvailable: StickerHeat[]
  feed: FeedItem[]
  myRank: number | null
}

export function useDashboard(myUserId: string | null): DashboardData {
  const [loading, setLoading] = useState(true)
  const [states, setStates] = useState<RawState[]>([])
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, number>>({})
  const [tradesMap, setTradesMap] = useState<Record<string, number>>({})

  useEffect(() => {
    let dead = false
    setLoading(true)
    Promise.all([
      fetchAllStates(),
      fetchAllProfiles(),
      fetchRecentTrades(15),
      fetchPacksPerUser(),
      fetchTradesPerUser(),
    ]).then(([s, p, f, packs, trades]) => {
      if (dead) return
      setStates(s)
      setProfiles(p)
      setFeed(f)
      setPacksMap(packs)
      setTradesMap(trades)
      setLoading(false)
    })
    return () => { dead = true }
  }, [])

  const nameMap = useMemo(() => {
    const m = new Map<string, string>()
    profiles.forEach(p => m.set(p.id, p.name))
    return m
  }, [profiles])

  const ranking = useMemo((): RankEntry[] => {
    const byUser = new Map<string, { owned: number; extras: number }>()
    states.forEach(s => {
      if (s.status === 'owned' || s.status === 'repeated') {
        const cur = byUser.get(s.user_id) ?? { owned: 0, extras: 0 }
        cur.owned += 1
        if (s.status === 'repeated') cur.extras += s.repeat_count ?? 0
        byUser.set(s.user_id, cur)
      }
    })
    return Array.from(byUser.entries())
      .map(([uid, { owned, extras }]) => ({
        userId: uid,
        displayName: nameMap.get(uid) ?? 'Usuario',
        ownedCount: owned,
        extraCount: extras,
        tradesCount: tradesMap[uid] ?? 0,
        packsCount: packsMap[uid] ?? 0,
        pct: Math.round((owned / TOTAL) * 1000) / 10,
      }))
      .sort((a, b) => b.ownedCount - a.ownedCount)
  }, [states, nameMap, tradesMap, packsMap])

  const globalStats = useMemo((): GlobalStats => {
    const users = new Set(states.map(s => s.user_id)).size
    const owned = states.filter(s => s.status === 'owned' || s.status === 'repeated').length
    const trades = Math.floor(Object.values(tradesMap).reduce((a, v) => a + v, 0) / 2)
    const packs = Object.values(packsMap).reduce((a, v) => a + v, 0)
    return { totalUsers: users, totalOwned: owned, totalTrades: trades, totalPacks: packs }
  }, [states, tradesMap, packsMap])

  const mostWanted = useMemo((): StickerHeat[] => {
    const m = new Map<string, number>()
    states.filter(s => s.status === 'missing').forEach(s => {
      m.set(s.sticker_key, (m.get(s.sticker_key) ?? 0) + 1)
    })
    return Array.from(m.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [states])

  const mostAvailable = useMemo((): StickerHeat[] => {
    const m = new Map<string, number>()
    states.filter(s => s.status === 'repeated').forEach(s => {
      m.set(s.sticker_key, (m.get(s.sticker_key) ?? 0) + (s.repeat_count ?? 1))
    })
    return Array.from(m.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [states])

  const myRank = useMemo(() => {
    if (!myUserId) return null
    const i = ranking.findIndex(r => r.userId === myUserId)
    return i === -1 ? null : i + 1
  }, [ranking, myUserId])

  return { loading, ranking, globalStats, mostWanted, mostAvailable, feed, myRank }
}
