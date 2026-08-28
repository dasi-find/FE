import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { getCandidateDetail, getCandidates, markCandidateViewed } from './candidateApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)
const mockedPost = vi.mocked(httpClient.post)

describe('candidateApi', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

  it('모든 후보 페이지를 조회한 뒤 적합도 오름차순으로 정렬한다', async () => {
    mockedGet
      .mockResolvedValueOnce({
        data: {
          isSuccess: true,
          code: 'COMMON2001',
          message: '성공',
          result: {
            content: [candidate(301, 82)],
            page: 0,
            size: 100,
            totalElements: 2,
            hasNext: true,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          isSuccess: true,
          code: 'COMMON2001',
          message: '성공',
          result: {
            content: [candidate(302, 61)],
            page: 1,
            size: 100,
            totalElements: 2,
            hasNext: false,
          },
        },
      })

    await expect(getCandidates(12)).resolves.toEqual([candidate(302, 61), candidate(301, 82)])
    expect(mockedGet).toHaveBeenNthCalledWith(1, '/v1/search-cards/12/candidates', {
      params: { minScore: 50, includeExcluded: false, page: 0, size: 100 },
    })
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/v1/search-cards/12/candidates', {
      params: { minScore: 50, includeExcluded: false, page: 1, size: 100 },
    })
  })

  it('후보 상세를 조회하고 읽음 처리한다', async () => {
    const detail = { candidateId: 301, searchCardId: 12 }
    const viewed = { candidateId: 301, viewedAt: '2026-08-27T15:00:00' }
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: detail },
    })
    mockedPost.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: viewed },
    })

    await expect(getCandidateDetail(301)).resolves.toEqual(detail)
    await expect(markCandidateViewed(301)).resolves.toEqual(viewed)
    expect(mockedGet).toHaveBeenCalledWith('/v1/candidates/301')
    expect(mockedPost).toHaveBeenCalledWith('/v1/candidates/301/view', {})
  })
})

function candidate(candidateId: number, totalScore: number) {
  return {
    candidateId,
    rank: candidateId,
    itemName: '반지갑',
    color: 'BLACK',
    foundDate: '2026-08-18',
    storagePlace: '분당경찰서',
    imageUrl: null,
    totalScore,
    isNew: true,
    feedback: null,
    reasons: ['종류가 유사합니다.'],
  }
}
