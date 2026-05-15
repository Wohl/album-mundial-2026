import { useState, useEffect, useMemo } from 'react'
import {
  fetchUserCounts, fetchAllProfiles, fetchRecentTrades,
  fetchPacksPerUser, fetchTradesPerUser,
  fetchMostWanted, fetchMostAvailable,
  UserCount, RankEntry, GlobalStats, StickerHeat, FeedItem,
} from '@/services/dashboardService'

export type { RankEntry, GlobalStats, StickerHeat, FeedItem }

const TOTAL = 994

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
  const [userCounts, setUserCounts] = useState<UserCount[]>([])
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, number>>({})
  const [tradesMap, setTradesMap] = useState<Record<string, number>>({})
  const [mostWanted, setMostWanted] = useState<StickerHeat[]>([])
  const [mostAvailable, setMostAvailable] = useState<StickerHeat[]>([])

  useEffect(() => {
    let dead = false
    setLoading(true)
    Promise.all([
      fetchUserCounts(),
      fetchAllProfiles(),
      fetchRecentTrades(15),
      fetchPacksPerUser(),
      fetchTradesPerUser(),
      fetchMostWanted(6),
      fetchMostAvailable(6),
    ]).then(([counts, p, f, packs, trades, wanted, available]) => {
      if (dead) return
      setUserCounts(counts)
      setProfiles(p)
      setFeed(f)
      setPacksMap(packs)
      setTradesMap(trades)
      setMostWanted(wanted)
      setMostAvailable(available)
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
    return userCounts
      .map(({ user_id, owned_count, extra_count }) => ({
        userId: user_id,
        displayName: nameMap.get(user_id) ?? 'Usuario',
        ownedCount: owned_count,
        extraCount: extra_count,
        tradesCount: tradesMap[user_id] ?? 0,
        packsCount: packsMap[user_id] ?? 0,
        pct: Math.round((owned_count / TOTAL) * 1000) / 10,
      }))
      .sort((a, b) => b.ownedCount - a.ownedCount)
  }, [userCounts, nameMap, tradesMap, packsMap])

  const globalStats = useMemo((): GlobalStats => {
    const totalOwned = userCounts.reduce((sum, u) => sum + u.owned_count, 0)
    const trades = Math.floor(Object.values(tradesMap).reduce((a, v) => a + v, 0) / 2)
    const packs = Object.values(packsMap).reduce((a, v) => a + v, 0)
    return {
      totalUsers: userCounts.length,
      totalOwned,
      totalTrades: trades,
      totalPacks: packs,
    }
  }, [userCounts, tradesMap, packsMap])

  const myRank = useMemo(() => {
    if (!myUserId) return null
    const i = ranking.findIndex(r => r.userId === myUserId)
    return i === -1 ? null : i + 1
  }, [ranking, myUserId])

  return { loading, ranking, globalStats, mostWanted, mostAvailable, feed, myRank }
}
