import { httpClient } from '../../../api/httpClient'
import type { ApiResponse, PageResult } from '../../../api/types'

export type CandidateFeedback = 'VERY_SIMILAR' | 'UNSURE' | 'NOT_MINE' | null

export type CandidateSummary = {
  candidateId: number
  rank: number
  itemName: string
  color: string | null
  foundDate: string
  storagePlace: string
  imageUrl: string | null
  totalScore: number
  isNew: boolean
  feedback: CandidateFeedback
  reasons: string[]
}

export type CandidateDetail = {
  candidateId: number
  searchCardId: number
  totalScore: number
  rank: number
  feedback: CandidateFeedback
  isExcluded: boolean
  policeItem: {
    itemName: string
    category: string
    color: string | null
    foundDate: string
    storagePlace: string
    policeManagementNo: string
    imageUrl: string | null
    originalUrl: string
  }
  scores: {
    imageScore: number | null
    textScore: number | null
    attributeScore: number | null
    timeScore: number | null
    stationProximityScore: number | null
  }
  reasons: string[]
}

export type CandidateViewResult = {
  candidateId: number
  viewedAt: string
}

export async function getCandidates(searchCardId: number) {
  const candidates: CandidateSummary[] = []
  let page = 0
  let hasNext = true

  while (hasNext) {
    const { data } = await httpClient.get<ApiResponse<PageResult<CandidateSummary>>>(
      `/v1/search-cards/${searchCardId}/candidates`,
      {
        params: { minScore: 50, includeExcluded: false, page, size: 100 },
      },
    )
    candidates.push(...data.result.content)
    hasNext = data.result.hasNext
    page += 1
  }

  return candidates.sort(
    (left, right) => left.totalScore - right.totalScore || left.rank - right.rank,
  )
}

export async function getCandidateDetail(candidateId: number) {
  const { data } = await httpClient.get<ApiResponse<CandidateDetail>>(
    `/v1/candidates/${candidateId}`,
  )
  return data.result
}

export async function markCandidateViewed(candidateId: number) {
  const { data } = await httpClient.post<ApiResponse<CandidateViewResult>>(
    `/v1/candidates/${candidateId}/view`,
    {},
  )
  return data.result
}
