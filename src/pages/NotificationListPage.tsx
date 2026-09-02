import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { HomeBottomNavigation } from '../features/home/components/HomeBottomNavigation'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListFilter,
  type NotificationSummary,
  type NotificationType,
} from '../features/notification/api/notificationApi'

const filterOptions: Array<{ value: NotificationListFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'UNREAD', label: '안 읽음' },
]

export function NotificationListPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<NotificationListFilter>('ALL')
  const [page, setPage] = useState(0)
  const notificationQuery = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: () => getNotifications({ filter, page }),
  })
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getNotifications({ filter: 'UNREAD', page: 0, size: 1 }),
  })
  const unreadCount = unreadCountQuery.data?.totalElements ?? 0
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => refreshNotificationQueries(queryClient),
  })

  return (
    <main className="notification-shell">
      <section className="notification-screen">
        <header className="candidate-header notification-header">
          <Link to="/home" aria-label="홈으로 돌아가기">
            ‹
          </Link>
          <strong>알림</strong>
          <span className="notification-header-count" aria-label={`안 읽은 알림 ${unreadCount}개`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </header>

        <div className="notification-content">
          <div className="notification-intro">
            <p>NOTIFICATIONS</p>
            <h1>
              새로운 소식을
              <br />
              확인해 보세요.
            </h1>
          </div>

          <div className="notification-toolbar">
            <div className="notification-filters" aria-label="알림 필터">
              {filterOptions.map((option) => (
                <button
                  className={filter === option.value ? 'is-selected' : ''}
                  type="button"
                  key={option.value}
                  aria-pressed={filter === option.value}
                  onClick={() => {
                    setFilter(option.value)
                    setPage(0)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="notification-read-all"
              type="button"
              disabled={unreadCount === 0 || readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
            >
              {readAllMutation.isPending ? '처리 중...' : '모두 읽음'}
            </button>
          </div>

          {readAllMutation.isError && (
            <p className="notification-action-message is-error" role="alert">
              전체 읽음 처리에 실패했어요. 다시 시도해 주세요.
            </p>
          )}
          {readAllMutation.isSuccess && (
            <p className="notification-action-message" role="status">
              알림 {readAllMutation.data.readCount}개를 읽음 처리했어요.
            </p>
          )}

          {notificationQuery.isPending && <NotificationLoading />}
          {notificationQuery.isError && (
            <NotificationState
              title="알림을 불러오지 못했어요."
              description="잠시 후 다시 시도해 주세요."
              actionLabel={notificationQuery.isFetching ? '불러오는 중...' : '다시 시도'}
              disabled={notificationQuery.isFetching}
              onAction={() => notificationQuery.refetch()}
            />
          )}
          {notificationQuery.data?.content.length === 0 && (
            <NotificationState
              title={filter === 'UNREAD' ? '안 읽은 알림이 없어요.' : '아직 알림이 없어요.'}
              description="새로운 후보나 수색 상태 변경이 생기면 여기에서 알려드릴게요."
            />
          )}
          {notificationQuery.data && notificationQuery.data.content.length > 0 && (
            <div className="notification-list" aria-label="알림 목록">
              {notificationQuery.data.content.map((notification) => (
                <NotificationItem key={notification.notificationId} notification={notification} />
              ))}
            </div>
          )}

          {notificationQuery.data && notificationQuery.data.totalElements > 0 && (
            <nav
              className="search-card-pagination notification-pagination"
              aria-label="알림 페이지"
            >
              <button
                type="button"
                disabled={page === 0 || notificationQuery.isFetching}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                이전
              </button>
              <span>{page + 1}페이지</span>
              <button
                type="button"
                disabled={!notificationQuery.data.hasNext || notificationQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                다음
              </button>
            </nav>
          )}
        </div>

        <HomeBottomNavigation active="notifications" unreadNotificationCount={unreadCount} />
      </section>
    </main>
  )
}

function NotificationItem({ notification }: { notification: NotificationSummary }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const target = getNotificationTarget(notification)
  const readMutation = useMutation({
    mutationFn: () => markNotificationRead(notification.notificationId),
    onSuccess: () => {
      void refreshNotificationQueries(queryClient)
      if (target) navigate(target)
    },
  })
  const content = (
    <>
      <span className="notification-item-icon" aria-hidden="true">
        {getNotificationSymbol(notification.type)}
      </span>
      <div>
        <span>{getNotificationTypeLabel(notification.type)}</span>
        <h2>{notification.title}</h2>
        <p>{notification.message}</p>
        <time dateTime={notification.createdAt}>{formatCreatedAt(notification.createdAt)}</time>
      </div>
      {!notification.isRead && <b aria-label="안 읽은 알림" />}
    </>
  )

  const openUnreadNotification = (event?: MouseEvent<HTMLAnchorElement>) => {
    if (readMutation.isPending) {
      event?.preventDefault()
      return
    }
    if (notification.isRead) return
    event?.preventDefault()
    readMutation.mutate()
  }

  return (
    <div className="notification-item-wrapper">
      {target ? (
        <Link
          className={`notification-item ${notification.isRead ? '' : 'is-unread'}`}
          to={target}
          aria-busy={readMutation.isPending}
          onClick={openUnreadNotification}
        >
          {content}
        </Link>
      ) : notification.isRead ? (
        <article className="notification-item">{content}</article>
      ) : (
        <button
          className="notification-item is-unread"
          type="button"
          disabled={readMutation.isPending}
          onClick={() => readMutation.mutate()}
        >
          {content}
        </button>
      )}
      {readMutation.isError && (
        <p className="notification-item-error" role="alert">
          읽음 처리에 실패했어요. 알림을 다시 눌러 주세요.
        </p>
      )}
    </div>
  )
}

function NotificationLoading() {
  return (
    <div className="notification-loading" aria-label="알림을 불러오는 중" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function NotificationState({
  title,
  description,
  actionLabel,
  disabled,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  disabled?: boolean
  onAction?: () => void
}) {
  return (
    <div className="notification-state" role={onAction ? 'alert' : undefined}>
      <span aria-hidden="true">!</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" disabled={disabled} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function getNotificationTarget(notification: NotificationSummary) {
  if (notification.candidateId) return `/candidates/${notification.candidateId}`
  if (notification.searchCardId) return `/search-cards/${notification.searchCardId}`
  return null
}

function getNotificationSymbol(type: NotificationType) {
  if (type === 'NEW_CANDIDATE') return '!'
  if (type === 'SEARCH_FOUND') return '✓'
  if (type === 'SEARCH_EXPIRED') return '⌛'
  return '·'
}

function getNotificationTypeLabel(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    NEW_CANDIDATE: '새 후보',
    SEARCH_EXPIRED: '수색 만료',
    SEARCH_FOUND: '찾음',
    SEARCH_CLOSED: '수색 종료',
  }
  return labels[type]
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function refreshNotificationQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['home-summary'] }),
  ])
}
