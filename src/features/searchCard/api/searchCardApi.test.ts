import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import {
  createSearchCard,
  requestSearchCardAnalysis,
  uploadSearchCardImage,
  type SearchCardAnalysisRequest,
} from './searchCardApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { post: vi.fn() },
}))

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
  beforeEach(() => mockedPost.mockReset())

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
})
