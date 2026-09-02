import type { ApiResponse, PageResult } from '../../../api/types'
import { httpClient } from '../../../api/httpClient'

export type SearchCardImageType = 'ACTUAL' | 'REFERENCE'

export type UploadedSearchCardImage = {
  imageId: number
  imageUrl: string
  imageType: SearchCardImageType
}

export type LostLocationPayload = {
  placeName: string
  address: string
  latitude: number | null
  longitude: number | null
  description: string | null
}

export type SearchCardAnalysisRequest = {
  category: string
  itemName: string
  color: string[]
  brand: string | null
  featureDescription: string | null
  imageIds: number[]
  lostDate: string
  lostStartTime: string | null
  lostEndTime: string | null
  lostLocation: LostLocationPayload
}

export type SearchCardAnalysis = {
  analysisId: number
  category: string
  itemName: string
  colors: string[]
  brand: string | null
  materials: string[]
  ocrText: string | null
  features: string[]
  modelVersion: string
}

export type CreateSearchCardRequest = SearchCardAnalysisRequest & {
  analysisId: number
  material: string | null
}

export type CreatedSearchCard = {
  searchCardId: number
  status: 'ACTIVE'
  searchExpiresAt: string
  initialCandidateCount: number
}

export type SearchCardStatus = 'DRAFT' | 'ANALYZING' | 'ACTIVE' | 'FOUND' | 'CLOSED' | 'EXPIRED'

export type SearchCardSummary = {
  id: number
  itemName: string
  status: SearchCardStatus
  imageUrl: string | null
  lostDate: string
  lostPlaceName: string
  unreadCandidateCount: number
  bestCandidateScore: number | null
  searchExpiresAt: string | null
}

export type SearchCardDetail = {
  id: number
  itemName: string
  status: SearchCardStatus
  imageUrls: string[]
  category: string
  colors: string[]
  brand: string | null
  material: string | null
  featureDescription: string | null
  lostDate: string
  lostStartTime: string | null
  lostEndTime: string | null
  lostLocation: LostLocationPayload
  analysis: SearchCardAnalysis | null
  searchExpiresAt: string | null
  unreadCandidateCount: number
  bestCandidateScore: number | null
}

export type UpdateSearchCardRequest = {
  category: string
  itemName: string
  color: string[]
  brand: string | null
  material: string | null
  featureDescription: string | null
  lostDate: string
  lostStartTime: string | null
  lostEndTime: string | null
  lostLocation: LostLocationPayload
}

export type ClosedSearchCard = {
  searchCardId: number
  status: 'CLOSED'
  closedAt: string
}

export type FoundSearchCard = {
  searchCardId: number
  status: 'FOUND'
  foundAt: string
}

export type SearchCardListFilter = 'ALL' | 'ACTIVE' | 'FOUND' | 'CLOSED' | 'EXPIRED'

export async function uploadSearchCardImage(file: File, imageType: SearchCardImageType) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('imageType', imageType)
  const { data } = await httpClient.post<ApiResponse<UploadedSearchCardImage>>(
    '/v1/search-card-images',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.result
}

export async function deleteSearchCardImage(imageId: number) {
  const { data } = await httpClient.delete<ApiResponse<null>>(`/v1/search-card-images/${imageId}`)
  return data.result
}

export async function requestSearchCardAnalysis(payload: SearchCardAnalysisRequest) {
  const { data } = await httpClient.post<ApiResponse<SearchCardAnalysis>>(
    '/v1/search-card-analyses',
    payload,
  )
  return data.result
}

export async function getSearchCardAnalysis(analysisId: number) {
  const { data } = await httpClient.get<ApiResponse<SearchCardAnalysis>>(
    `/v1/search-card-analyses/${analysisId}`,
  )
  return data.result
}

export async function createSearchCard(payload: CreateSearchCardRequest) {
  const { data } = await httpClient.post<ApiResponse<CreatedSearchCard>>(
    '/v1/search-cards',
    payload,
  )
  return data.result
}

export async function getSearchCards({
  status,
  page,
  size = 10,
}: {
  status: SearchCardListFilter
  page: number
  size?: number
}) {
  const { data } = await httpClient.get<ApiResponse<PageResult<SearchCardSummary>>>(
    '/v1/search-cards',
    {
      params: {
        ...(status === 'ALL' ? {} : { status }),
        page,
        size,
      },
    },
  )
  return data.result
}

export async function getSearchCard(searchCardId: number) {
  const { data } = await httpClient.get<ApiResponse<SearchCardDetail>>(
    `/v1/search-cards/${searchCardId}`,
  )
  return data.result
}

export async function updateSearchCard(searchCardId: number, request: UpdateSearchCardRequest) {
  const { data } = await httpClient.patch<ApiResponse<SearchCardDetail>>(
    `/v1/search-cards/${searchCardId}`,
    request,
  )
  return data.result
}

export async function closeSearchCard(searchCardId: number) {
  const { data } = await httpClient.patch<ApiResponse<ClosedSearchCard>>(
    `/v1/search-cards/${searchCardId}/close`,
  )
  return data.result
}

export async function markSearchCardFound(searchCardId: number) {
  const { data } = await httpClient.patch<ApiResponse<FoundSearchCard>>(
    `/v1/search-cards/${searchCardId}/found`,
  )
  return data.result
}

export async function deleteSearchCard(searchCardId: number) {
  const { data } = await httpClient.delete<ApiResponse<null>>(`/v1/search-cards/${searchCardId}`)
  return data.result
}
