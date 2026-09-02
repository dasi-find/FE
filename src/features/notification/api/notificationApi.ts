import { httpClient } from '../../../api/httpClient'
import type { ApiResponse, PageResult } from '../../../api/types'

export type NotificationType = 'NEW_CANDIDATE' | 'SEARCH_EXPIRED' | 'SEARCH_FOUND' | 'SEARCH_CLOSED'

export type NotificationSummary = {
  notificationId: number
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  searchCardId: number | null
  candidateId: number | null
}

export type NotificationListFilter = 'ALL' | 'UNREAD'

export type NotificationReadResult = {
  notificationId: number
  isRead: true
  readAt: string
}

export type NotificationReadAllResult = {
  readCount: number
  readAt: string
}

export async function getNotifications({
  filter,
  page,
  size = 10,
}: {
  filter: NotificationListFilter
  page: number
  size?: number
}) {
  const { data } = await httpClient.get<ApiResponse<PageResult<NotificationSummary>>>(
    '/v1/notifications',
    {
      params: {
        ...(filter === 'UNREAD' ? { isRead: false } : {}),
        page,
        size,
      },
    },
  )
  return data.result
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await httpClient.post<ApiResponse<NotificationReadResult>>(
    `/v1/notifications/${notificationId}/read`,
    {},
  )
  return data.result
}

export async function markAllNotificationsRead() {
  const { data } = await httpClient.post<ApiResponse<NotificationReadAllResult>>(
    '/v1/notifications/read-all',
    {},
  )
  return data.result
}
