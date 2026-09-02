import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notificationApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)
const mockedPost = vi.mocked(httpClient.post)

describe('notificationApi', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

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

  it('개별 알림 읽음을 요청한다', async () => {
    const result = { notificationId: 7, isRead: true as const, readAt: '2026-09-02T10:00:00' }
    mockedPost.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result },
    })

    await expect(markNotificationRead(7)).resolves.toEqual(result)

    expect(mockedPost).toHaveBeenCalledWith('/v1/notifications/7/read', {})
  })

  it('전체 알림 읽음을 요청한다', async () => {
    const result = { readCount: 3, readAt: '2026-09-02T10:00:00' }
    mockedPost.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result },
    })

    await expect(markAllNotificationsRead()).resolves.toEqual(result)

    expect(mockedPost).toHaveBeenCalledWith('/v1/notifications/read-all', {})
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
