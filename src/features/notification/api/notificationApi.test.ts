import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { getNotifications } from './notificationApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)

describe('notificationApi', () => {
  beforeEach(() => mockedGet.mockReset())

  it('전체 알림을 페이지 조건으로 조회한다', async () => {
    const page = notificationPage()
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: page },
    })

    await expect(getNotifications({ filter: 'ALL', page: 1, size: 20 })).resolves.toEqual(page)

    expect(mockedGet).toHaveBeenCalledWith('/v1/notifications', {
      params: { page: 1, size: 20 },
    })
  })

  it('안 읽은 알림만 조회한다', async () => {
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: notificationPage() },
    })

    await getNotifications({ filter: 'UNREAD', page: 0 })

    expect(mockedGet).toHaveBeenCalledWith('/v1/notifications', {
      params: { isRead: false, page: 0, size: 10 },
    })
  })
})

function notificationPage() {
  return {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    hasNext: false,
  }
}
