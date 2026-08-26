import { httpClient } from '../../../api/httpClient'
import type { ApiResponse } from '../../../api/types'

export type ActiveSearchCardSummary = {
  id: number
  itemName: string
  status: 'ACTIVE' | string
  daysRemaining: number
  lostDate: string
  lostPlaceName: string
  bestCandidateScore: number | null
}

export type NewCandidateSummary = {
  id: number
  searchCardId: number
  itemName: string
  storagePlace: string
  totalScore: number
  isNew: boolean
}

export type HomeSummary = {
  activeSearchCards: ActiveSearchCardSummary[]
  newCandidates: NewCandidateSummary[]
  unreadNotificationCount: number
}

export async function getHomeSummary() {
  const { data } = await httpClient.get<ApiResponse<HomeSummary>>('/v1/home')
  return data.result
}
