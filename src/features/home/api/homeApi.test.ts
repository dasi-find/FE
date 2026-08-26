import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { getHomeSummary, type HomeSummary } from './homeApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)

describe('getHomeSummary', () => {
  beforeEach(() => mockedGet.mockReset())

  it('명세된 홈 API에서 요약 결과를 반환한다', async () => {
    const result: HomeSummary = {
      activeSearchCards: [],
      newCandidates: [],
      unreadNotificationCount: 2,
    }
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result },
    })

    await expect(getHomeSummary()).resolves.toEqual(result)
    expect(mockedGet).toHaveBeenCalledWith('/v1/home')
  })
})
