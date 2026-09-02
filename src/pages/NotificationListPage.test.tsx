import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/notification/api/notificationApi'
import { NotificationListPage } from './NotificationListPage'

vi.mock('../features/notification/api/notificationApi', () => ({
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}))

const mockedGetNotifications = vi.mocked(getNotifications)
const mockedMarkAllNotificationsRead = vi.mocked(markAllNotificationsRead)
const mockedMarkNotificationRead = vi.mocked(markNotificationRead)

describe('NotificationListPage', () => {
  beforeEach(() => {
    mockedGetNotifications.mockReset()
    mockedMarkAllNotificationsRead.mockReset()
    mockedMarkNotificationRead.mockReset()
  })

  it('알림과 안 읽은 개수를 표시하고 관련 화면으로 연결한다', async () => {
    mockedGetNotifications.mockImplementation(async (request) =>
      request?.size === 1 ? unreadCountPage(3) : populatedPage(),
    )
    renderPage()

    expect(
      await screen.findByRole('heading', { name: '새로운 후보가 있어요.' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('안 읽은 알림 3개')).toHaveTextContent('3')
    expect(screen.getByLabelText('안 읽은 알림')).toBeInTheDocument()
    expect(screen.getByText('새로운 후보가 있어요.').closest('a')).toHaveAttribute(
      'href',
      '/candidates/301',
    )
    expect(screen.getByRole('link', { name: '알림' })).toHaveAttribute('aria-current', 'page')
  })

  it('안 읽음 필터와 다음 페이지 이동을 지원한다', async () => {
    const user = userEvent.setup()
    mockedGetNotifications.mockImplementation(async (request) =>
      request?.size === 1 ? unreadCountPage(3) : populatedPage(),
    )
    renderPage()

    await screen.findByText('새로운 후보가 있어요.')
    await user.click(screen.getByRole('button', { name: '안 읽음' }))
    await waitFor(() =>
      expect(mockedGetNotifications).toHaveBeenCalledWith({ filter: 'UNREAD', page: 0 }),
    )

    await user.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() =>
      expect(mockedGetNotifications).toHaveBeenCalledWith({ filter: 'UNREAD', page: 1 }),
    )
    expect(screen.getByText('2페이지')).toBeInTheDocument()
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    let listRequestCount = 0
    mockedGetNotifications.mockImplementation(async (request) => {
      if (request?.size === 1) return unreadCountPage(0)
      listRequestCount += 1
      if (listRequestCount === 1) throw new Error('조회 실패')
      return populatedPage()
    })
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('알림을 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('새로운 후보가 있어요.')).toBeInTheDocument()
  })

  it('안 읽은 알림을 읽음 처리한 뒤 관련 후보로 이동한다', async () => {
    const user = userEvent.setup()
    mockedGetNotifications.mockImplementation(async (request) =>
      request?.size === 1 ? unreadCountPage(1) : populatedPage(),
    )
    mockedMarkNotificationRead.mockResolvedValue({
      notificationId: 7,
      isRead: true,
      readAt: '2026-09-02T10:00:00',
    })
    renderPage()

    await user.click(await screen.findByRole('link', { name: /새로운 후보가 있어요/ }))

    expect(mockedMarkNotificationRead).toHaveBeenCalledWith(7)
    expect(await screen.findByText('후보 상세 화면')).toBeInTheDocument()
  })

  it('개별 읽음 처리 실패 후 알림을 다시 눌러 재시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetNotifications.mockImplementation(async (request) =>
      request?.size === 1 ? unreadCountPage(1) : populatedPage(),
    )
    mockedMarkNotificationRead.mockRejectedValueOnce(new Error('읽음 실패')).mockResolvedValueOnce({
      notificationId: 7,
      isRead: true,
      readAt: '2026-09-02T10:00:00',
    })
    renderPage()

    const notificationLink = await screen.findByRole('link', { name: /새로운 후보가 있어요/ })
    await user.click(notificationLink)
    expect(await screen.findByRole('alert')).toHaveTextContent('읽음 처리에 실패했어요.')

    await user.click(notificationLink)
    expect(await screen.findByText('후보 상세 화면')).toBeInTheDocument()
    expect(mockedMarkNotificationRead).toHaveBeenCalledTimes(2)
  })

  it('전체 알림을 읽음 처리하고 배지를 갱신한다', async () => {
    const user = userEvent.setup()
    let hasUnread = true
    mockedGetNotifications.mockImplementation(async (request) => {
      if (request?.size === 1) return unreadCountPage(hasUnread ? 3 : 0)
      return hasUnread ? populatedPage() : { ...populatedPage(), content: [] }
    })
    mockedMarkAllNotificationsRead.mockImplementation(async () => {
      hasUnread = false
      return { readCount: 3, readAt: '2026-09-02T10:00:00' }
    })
    renderPage()

    await screen.findByText('새로운 후보가 있어요.')
    await user.click(screen.getByRole('button', { name: '모두 읽음' }))

    expect(await screen.findByText('알림 3개를 읽음 처리했어요.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('안 읽은 알림 0개')).toHaveTextContent('0'))
    expect(mockedMarkAllNotificationsRead).toHaveBeenCalledTimes(1)
  })
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/candidates/:candidateId" element={<p>후보 상세 화면</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function populatedPage() {
  return {
    content: [
      {
        notificationId: 7,
        type: 'NEW_CANDIDATE' as const,
        title: '새로운 후보가 있어요.',
        message: '남색 카드지갑과 비슷한 습득물이 등록됐어요.',
        isRead: false,
        createdAt: '2026-09-02T09:30:00',
        searchCardId: 12,
        candidateId: 301,
      },
    ],
    page: 0,
    size: 10,
    totalElements: 11,
    hasNext: true,
  }
}

function unreadCountPage(totalElements: number) {
  return {
    content: [],
    page: 0,
    size: 1,
    totalElements,
    hasNext: totalElements > 1,
  }
}
