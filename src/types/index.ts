export interface Team {
  code: string
  name: string
  region: string
}

export interface Sticker {
  id: string
  name: string
  team?: string
  flag?: string
  type: 'regular' | 'intro' | 'special'
  foil: boolean
}

export interface StickerState {
  id: string
  session_id: string
  sticker_key: string
  status: 'missing' | 'owned' | 'repeated'
  repeat_count: number
  updated_at: string
}

export interface Session {
  id: string
  display_name: string
  created_at: string
  last_seen: string
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
  requested_sticker_key: string
  offered_sticker_key: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  updated_at: string
}
