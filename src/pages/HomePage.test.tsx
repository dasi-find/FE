import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken } from '../api/accessTokenStore'
import { saveAuthSession } from '../features/auth/model/authSessionStore'
import { getHomeSummary, type HomeSummary } from '../features/home/api/homeApi'
import { HomePage } from './HomePage'

vi.mock('../features/home/api/homeApi', () => ({ getHomeSummary: vi.fn() }))

const mockedGetHomeSummary = vi.mocked(getHomeSummary)

const populatedHome: HomeSummary = {
  activeSearchCards: [
    {
      id: 12,
      itemName: '남색 카드지갑',
      status: 'ACTIVE',
      daysRemaining: 21,
      lostDate: '2026-08-17',
      lostPlaceName: '판교역 인근',
      bestCandidateScore: 82,
    },
  ],
  newCandidates: [
    {
      id: 301,
      searchCardId: 12,
      itemName: '검정색 반지갑',
      storagePlace: '분당경찰서',
      totalScore: 82,
      isNew: true,
    },
  ],
  unreadNotificationCount: 2,
}

describe('HomePage', () => {
  beforeEach(() => {
    clearAccessToken()
    mockedGetHomeSummary.mockReset()
    saveAuthSession({
      user: { id: 7, email: 'hello@example.com', name: '민준' },
      accessToken: 'access-token',
      accessTokenExpiresInSeconds: 1800,
    })
  })

  it('사용자와 진행 중인 수색 및 새로운 후보를 표시한다', async () => {
    mockedGetHomeSummary.mockResolvedValue(populatedHome)
    renderHome()

    expect(screen.getByText('안녕하세요, 민준님')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '오늘도 찾고 있어요.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /새 수색 시작하기/ })).toHaveAttribute(
      'href',
      '/search-cards/new',
    )
    expect((await screen.findByText('남색 카드지갑')).closest('a')).toHaveAttribute(
      'href',
      '/search-cards/12',
    )
    expect(screen.getByText('8월 17일 · 판교역 인근')).toBeInTheDocument()
    expect(screen.getByText('검정색 반지갑').closest('a')).toHaveAttribute(
      'href',
      '/candidates/301',
    )
    expect(screen.getByLabelText('적합도 82점')).toBeInTheDocument()
  })

  it('수색과 후보가 없을 때 다음 행동을 안내한다', async () => {
    mockedGetHomeSummary.mockResolvedValue({
      activeSearchCards: [],
      newCandidates: [],
      unreadNotificationCount: 0,
    })
    renderHome()

    expect(await screen.findByText('진행 중인 수색이 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '첫 수색 시작하기' })).toHaveAttribute(
      'href',
      '/search-cards/new',
    )
    expect(screen.getByText('새 후보를 계속 찾고 있어요.')).toBeInTheDocument()
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetHomeSummary
      .mockRejectedValueOnce(new Error('서버에 연결할 수 없습니다.'))
      .mockResolvedValueOnce(populatedHome)
    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결할 수 없습니다.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('남색 카드지갑')).toBeInTheDocument()
    expect(mockedGetHomeSummary).toHaveBeenCalledTimes(2)
  })
})

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
