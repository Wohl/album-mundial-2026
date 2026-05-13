export interface Team {
  code: string
  name: string
  region: string
}

export interface Sticker {
  id: string
  name: string
  team?: string
  type: 'regular' | 'intro' | 'final' | 'cocacola'
  foil: boolean
}

export interface Profile {
  id: string
  display_name: string
  created_at: string
}

export interface StickerState {
  id: string
  user_id: string
  sticker_key: string
  status: 'missing' | 'owned' | 'repeated'
  repeat_count: number
  updated_at: string
}

export interface UserProgress {
  total: number
  owned: number
  missing: number
  repeated: number
  percentComplete: number
}

export interface TradeRequest {
  id: string
  requester_id: string
  requester_name: string
  owner_id: string
  owner_name: string
  // Legacy single-key fields (backward compat with existing rows)
  requested_sticker_key: string
  offered_sticker_key: string
  // N:N arrays (all new trades use these)
  requested_sticker_keys: string[]
  offered_sticker_keys: string[]
  // Counter-offer
  counter_requested_keys?: string[] | null
  counter_offered_keys?: string[] | null
  counter_by?: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'countered'
  created_at: string
  updated_at: string
}

export interface TradeMatch {
  userId: string
  userName: string
  theyHave: string[]       // their repeated stickers I'm missing (they give me)
  iHave: string[]          // all my repeated sticker keys
  iHaveForThem: string[]   // my repeated stickers they actually need (mutual)
  score: number            // theyHave.length * 2 + iHaveForThem.length
}
