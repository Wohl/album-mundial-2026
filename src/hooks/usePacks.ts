'use client'

import { useState, useEffect, useCallback } from 'react'
import { packService, PackItem } from '@/services/packService'
import { supabase, isOfflineMode } from '@/lib/supabase'

export const usePacks = (userId: string | null) => {
  const [packItems, setPackItems] = useState<PackItem[]>([])

  const loadItems = useCallback(async () => {
    if (!userId) return
    const items = await packService.getUnopenedItems(userId)
    setPackItems(items)
  }, [userId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Escuchar nuevos items en tiempo real
  useEffect(() => {
    if (!userId || isOfflineMode) return
    const channel = supabase
      .channel(`packs:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pack_items', filter: `owner_id=eq.${userId}` },
        () => loadItems()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, loadItems])

  const openPack = useCallback(async () => {
    if (packItems.length === 0) return
    const ids = packItems.map((i) => i.id)
    await packService.markOpened(ids)
    setPackItems([])
  }, [packItems])

  return { packItems, openPack, refetch: loadItems }
}
