import type { LiveMatch, FetchMatchesOptions } from '../types'

// All data source implementations must satisfy this interface.
// Swap providers without touching the service or UI layers.
export interface LiveDataProvider {
  readonly id: string
  readonly name: string
  readonly description: string
  fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]>
  fetchMatchById(id: string): Promise<LiveMatch | null>
}
