import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchCards } from '../features/searchCard/api/searchCardApi'
import { SearchCardListPage } from './SearchCardListPage'

vi.mock('../features/searchCard/api/searchCardApi', () => ({ getSearchCards: vi.fn() }))

const mockedGetSearchCards = vi.mocked(getSearchCards)

const populatedPage = {
  content: [
    {
      id: 12,
      itemName: '남색 카드지갑',
      status: 'ACTIVE' as const,
      imageUrl: '/wallet.jpg',
      lostDate: '2026-08-17',
      lostPlaceName: '판교역 인근',
      unreadCandidateCount: 2,
      bestCandidateScore: 82,
      searchExpiresAt: '2026-09-16T23:59:59',
    },
  ],
  page: 0,
  size: 10,
  totalElements: 11,
  hasNext: true,
}

describe('SearchCardListPage', () => {
  beforeEach(() => mockedGetSearchCards.mockReset())

  it('수색카드를 표시하고 상태 필터와 페이지 이동을 지원한다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCards.mockResolvedValue(populatedPage)
    renderPage()

    expect(await screen.findByText('남색 카드지갑')).toBeInTheDocument()
    expect(screen.getByText('8월 17일 · 판교역 인근')).toBeInTheDocument()
    expect(screen.getByLabelText('미확인 후보 2개')).toHaveTextContent('2')
    expect(screen.getByText('82점')).toBeInTheDocument()
    expect(screen.getByText('남색 카드지갑').closest('a')).toHaveAttribute(
      'href',
      '/search-cards/12/candidates',
    )
    expect(screen.getByRole('link', { name: '새 수색 추가' })).toHaveAttribute(
      'href',
      '/search-cards/new',
    )

    await user.click(screen.getByRole('button', { name: '수색 중' }))
    await waitFor(() =>
      expect(mockedGetSearchCards).toHaveBeenLastCalledWith({ status: 'ACTIVE', page: 0 }),
    )

    await user.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() =>
      expect(mockedGetSearchCards).toHaveBeenLastCalledWith({ status: 'ACTIVE', page: 1 }),
    )
    expect(screen.getByText('2페이지')).toBeInTheDocument()
  })

  it('수색카드가 없으면 새 수색 시작을 안내한다', async () => {
    mockedGetSearchCards.mockResolvedValue({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      hasNext: false,
    })
    renderPage()

    expect(await screen.findByText('해당하는 수색카드가 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '새 수색 시작하기' })).toHaveAttribute(
      'href',
      '/search-cards/new',
    )
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCards
      .mockRejectedValueOnce(new Error('조회 실패'))
      .mockResolvedValueOnce(populatedPage)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('수색카드를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('남색 카드지갑')).toBeInTheDocument()
    expect(mockedGetSearchCards).toHaveBeenCalledTimes(2)
  })
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchCardListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
