import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNotifications } from '../features/notification/api/notificationApi'
import { NotificationListPage } from './NotificationListPage'

vi.mock('../features/notification/api/notificationApi', () => ({ getNotifications: vi.fn() }))

const mockedGetNotifications = vi.mocked(getNotifications)

describe('NotificationListPage', () => {
  beforeEach(() => mockedGetNotifications.mockReset())

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
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationListPage />
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
