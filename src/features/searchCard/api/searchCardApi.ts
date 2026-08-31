import type { ApiResponse } from '../../../api/types'
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
