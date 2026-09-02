import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import {
  closeSearchCard,
  createSearchCard,
  deleteSearchCard,
  deleteSearchCardImage,
  getSearchCardAnalysis,
  getSearchCard,
  getSearchCards,
  markSearchCardFound,
  requestSearchCardAnalysis,
  updateSearchCard,
  uploadSearchCardImage,
  type SearchCardAnalysisRequest,
} from './searchCardApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { delete: vi.fn(), get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}))

const mockedDelete = vi.mocked(httpClient.delete)
const mockedGet = vi.mocked(httpClient.get)
const mockedPatch = vi.mocked(httpClient.patch)
const mockedPost = vi.mocked(httpClient.post)

const analysisPayload: SearchCardAnalysisRequest = {
  category: 'WALLET',
  itemName: '남색 카드지갑',
  color: ['남색'],
  brand: null,
  featureDescription: null,
  imageIds: [],
  lostDate: '2026-08-17',
  lostStartTime: null,
  lostEndTime: null,
  lostLocation: {
    placeName: '판교역',
    address: '경기도 성남시 분당구 판교역로 160',
    latitude: 37.3947,
    longitude: 127.1112,
    description: null,
  },
}

describe('searchCardApi', () => {
  beforeEach(() => {
    mockedDelete.mockReset()
    mockedGet.mockReset()
    mockedPatch.mockReset()
    mockedPost.mockReset()
  })

  it('이미지를 multipart 형식으로 업로드한다', async () => {
    const result = { imageId: 501, imageUrl: '/image.jpg', imageType: 'ACTUAL' as const }
    mockedPost.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result },
    })
    const file = new File(['image'], 'wallet.png', { type: 'image/png' })

    await expect(uploadSearchCardImage(file, 'ACTUAL')).resolves.toEqual(result)
    const formData = mockedPost.mock.calls[0]?.[1] as FormData
    expect(mockedPost).toHaveBeenCalledWith('/v1/search-card-images', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    expect(formData.get('file')).toBe(file)
    expect(formData.get('imageType')).toBe('ACTUAL')
  })

  it('업로드된 이미지를 명세 경로로 삭제한다', async () => {
    mockedDelete.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: null },
    })

    await expect(deleteSearchCardImage(501)).resolves.toBeNull()

    expect(mockedDelete).toHaveBeenCalledWith('/v1/search-card-images/501')
  })

  it('AI 분석과 수색카드 생성을 명세 경로로 요청한다', async () => {
    const analysis = {
      analysisId: 801,
      category: 'WALLET',
      itemName: 'CARD_WALLET',
      colors: ['NAVY'],
      brand: null,
      materials: ['LEATHER'],
      ocrText: null,
      features: ['은색 로고'],
      modelVersion: 'v1',
    }
    const card = {
      searchCardId: 12,
      status: 'ACTIVE' as const,
      searchExpiresAt: '2026-09-16T23:59:59',
      initialCandidateCount: 3,
    }
    mockedPost
      .mockResolvedValueOnce({
        data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: analysis },
      })
      .mockResolvedValueOnce({
        data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: card },
      })

    await expect(requestSearchCardAnalysis(analysisPayload)).resolves.toEqual(analysis)
    await expect(
      createSearchCard({ ...analysisPayload, analysisId: 801, material: 'LEATHER' }),
    ).resolves.toEqual(card)

    expect(mockedPost).toHaveBeenNthCalledWith(1, '/v1/search-card-analyses', analysisPayload)
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/v1/search-cards', {
      ...analysisPayload,
      analysisId: 801,
      material: 'LEATHER',
    })
  })

  it('분석 ID로 최신 AI 분석 결과를 조회한다', async () => {
    const analysis = {
      analysisId: 801,
      category: 'WALLET',
      itemName: 'CARD_WALLET',
      colors: ['NAVY'],
      brand: null,
      materials: ['LEATHER'],
      ocrText: null,
      features: ['은색 로고'],
      modelVersion: 'v2',
    }
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: analysis },
    })

    await expect(getSearchCardAnalysis(801)).resolves.toEqual(analysis)

    expect(mockedGet).toHaveBeenCalledWith('/v1/search-card-analyses/801')
  })

  it('상태와 페이지 조건으로 내 수색카드 목록을 조회한다', async () => {
    const pageResult = {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      hasNext: false,
    }
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: pageResult },
    })

    await expect(getSearchCards({ status: 'ACTIVE', page: 0 })).resolves.toEqual(pageResult)
    expect(mockedGet).toHaveBeenCalledWith('/v1/search-cards', {
      params: { status: 'ACTIVE', page: 0, size: 10 },
    })

    await getSearchCards({ status: 'ALL', page: 1, size: 20 })
    expect(mockedGet).toHaveBeenLastCalledWith('/v1/search-cards', {
      params: { page: 1, size: 20 },
    })
  })

  it('수색카드 ID로 상세 정보를 조회한다', async () => {
    const detail = {
      id: 12,
      itemName: '남색 카드지갑',
      status: 'ACTIVE' as const,
      imageUrls: ['/wallet.jpg'],
      category: 'WALLET',
      colors: ['남색'],
      brand: null,
      material: '가죽',
      featureDescription: '은색 로고',
      lostDate: '2026-08-17',
      lostStartTime: null,
      lostEndTime: null,
      lostLocation: analysisPayload.lostLocation,
      analysis: null,
      searchExpiresAt: '2026-09-16T23:59:59',
      unreadCandidateCount: 2,
      bestCandidateScore: 82,
    }
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: detail },
    })

    await expect(getSearchCard(12)).resolves.toEqual(detail)

    expect(mockedGet).toHaveBeenCalledWith('/v1/search-cards/12')
  })

  it('수색카드 수정 내용을 전달한다', async () => {
    const request = {
      category: 'WALLET',
      itemName: '남색 카드지갑',
      color: ['남색'],
      brand: null,
      material: '가죽',
      featureDescription: '은색 로고',
      lostDate: '2026-08-17',
      lostStartTime: null,
      lostEndTime: null,
      lostLocation: analysisPayload.lostLocation,
    }
    const detail = {
      id: 12,
      ...request,
      colors: request.color,
      status: 'ACTIVE' as const,
      imageUrls: [],
      analysis: null,
      searchExpiresAt: '2026-09-16T23:59:59',
      unreadCandidateCount: 0,
      bestCandidateScore: null,
    }
    mockedPatch.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: detail },
    })

    await expect(updateSearchCard(12, request)).resolves.toEqual(detail)

    expect(mockedPatch).toHaveBeenCalledWith('/v1/search-cards/12', request)
  })

  it('수색카드 수색 종료를 요청한다', async () => {
    const closed = {
      searchCardId: 12,
      status: 'CLOSED' as const,
      closedAt: '2026-08-31T16:20:00',
    }
    mockedPatch.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: closed },
    })

    await expect(closeSearchCard(12)).resolves.toEqual(closed)

    expect(mockedPatch).toHaveBeenCalledWith('/v1/search-cards/12/close')
  })

  it('수색카드 찾음 완료를 요청한다', async () => {
    const found = {
      searchCardId: 12,
      status: 'FOUND' as const,
      foundAt: '2026-09-02T10:20:00',
    }
    mockedPatch.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: found },
    })

    await expect(markSearchCardFound(12)).resolves.toEqual(found)

    expect(mockedPatch).toHaveBeenCalledWith('/v1/search-cards/12/found')
  })

  it('수색카드 삭제를 요청한다', async () => {
    mockedDelete.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: null },
    })

    await expect(deleteSearchCard(12)).resolves.toBeNull()

    expect(mockedDelete).toHaveBeenCalledWith('/v1/search-cards/12')
  })
})
