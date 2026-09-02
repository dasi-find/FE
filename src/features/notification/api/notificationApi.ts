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
