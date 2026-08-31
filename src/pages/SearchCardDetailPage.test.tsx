import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  closeSearchCard,
  getSearchCard,
  type SearchCardDetail,
} from '../features/searchCard/api/searchCardApi'
import { SearchCardDetailPage } from './SearchCardDetailPage'

vi.mock('../features/searchCard/api/searchCardApi', () => ({
  closeSearchCard: vi.fn(),
  getSearchCard: vi.fn(),
}))

const mockedCloseSearchCard = vi.mocked(closeSearchCard)
const mockedGetSearchCard = vi.mocked(getSearchCard)

const searchCard: SearchCardDetail = {
  id: 12,
  itemName: '남색 카드지갑',
  status: 'ACTIVE',
  imageUrls: ['/wallet.jpg'],
  category: '지갑',
  colors: ['남색', '검정'],
  brand: '다시찾음',
  material: '가죽',
  featureDescription: '모서리에 작은 흠집이 있어요.',
  lostDate: '2026-08-17',
  lostStartTime: '14:00:00',
  lostEndTime: '15:30:00',
  lostLocation: {
    placeName: '판교역 인근',
    address: '경기도 성남시 분당구 판교역로',
    latitude: 37.3947,
    longitude: 127.1112,
    description: '1번 출구에서 카페로 이동했어요.',
  },
  analysis: {
    analysisId: 3,
    category: '지갑',
    itemName: '카드지갑',
    colors: ['남색'],
    brand: null,
    materials: ['가죽'],
    ocrText: null,
    features: ['사각형', '버튼 잠금'],
    modelVersion: 'v1',
  },
  searchExpiresAt: '2026-09-16T23:59:59',
  unreadCandidateCount: 2,
  bestCandidateScore: 82.4,
}

describe('SearchCardDetailPage', () => {
  beforeEach(() => {
    mockedCloseSearchCard.mockReset()
    mockedGetSearchCard.mockReset()
  })

  it('수색카드 상세 정보와 후보 목록 링크를 표시한다', async () => {
    mockedGetSearchCard.mockResolvedValue(searchCard)
    renderPage('/search-cards/12')

    expect(await screen.findByRole('heading', { name: '남색 카드지갑' })).toBeInTheDocument()
    expect(mockedGetSearchCard).toHaveBeenCalledWith(12)
    expect(screen.getByText('82점')).toBeInTheDocument()
    expect(screen.getByText('모서리에 작은 흠집이 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /후보 목록 확인하기/ })).toHaveAttribute(
      'href',
      '/search-cards/12/candidates',
    )
    expect(screen.getByRole('link', { name: '수색카드 수정' })).toHaveAttribute(
      'href',
      '/search-cards/12/edit',
    )
    expect(screen.getByRole('button', { name: '수색 종료' })).toBeInTheDocument()
  })

  it('확인 후 수색을 종료하고 상세 상태를 갱신한다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard.mockResolvedValue(searchCard)
    mockedCloseSearchCard.mockResolvedValue({
      searchCardId: 12,
      status: 'CLOSED',
      closedAt: '2026-08-31T16:20:00',
    })
    renderPage('/search-cards/12')

    await user.click(await screen.findByRole('button', { name: '수색 종료' }))
    expect(screen.getByRole('dialog', { name: '수색을 종료할까요?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '종료하기' }))

    expect(await screen.findByText('종료')).toBeInTheDocument()
    expect(mockedCloseSearchCard).toHaveBeenCalledWith(12)
    expect(screen.queryByRole('button', { name: '수색 종료' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '수색카드 수정' })).not.toBeInTheDocument()
  })

  it('수색 종료 실패를 알리고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard.mockResolvedValue(searchCard)
    mockedCloseSearchCard.mockRejectedValueOnce(new Error('종료 실패')).mockResolvedValueOnce({
      searchCardId: 12,
      status: 'CLOSED',
      closedAt: '2026-08-31T16:20:00',
    })
    renderPage('/search-cards/12')

    await user.click(await screen.findByRole('button', { name: '수색 종료' }))
    await user.click(screen.getByRole('button', { name: '종료하기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('수색을 종료하지 못했어요.')

    await user.click(screen.getByRole('button', { name: '종료하기' }))
    expect(await screen.findByText('종료')).toBeInTheDocument()
    expect(mockedCloseSearchCard).toHaveBeenCalledTimes(2)
  })

  it('잘못된 수색카드 ID는 API를 호출하지 않고 목록 이동을 안내한다', () => {
    renderPage('/search-cards/not-a-number')

    expect(screen.getByRole('alert')).toHaveTextContent('잘못된 수색카드예요.')
    expect(screen.getByRole('link', { name: '목록으로 돌아가기' })).toHaveAttribute(
      'href',
      '/search-cards',
    )
    expect(mockedGetSearchCard).not.toHaveBeenCalled()
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard
      .mockRejectedValueOnce(new Error('조회 실패'))
      .mockResolvedValueOnce(searchCard)
    renderPage('/search-cards/12')

    expect(await screen.findByRole('alert')).toHaveTextContent('수색카드를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByRole('heading', { name: '남색 카드지갑' })).toBeInTheDocument()
    expect(mockedGetSearchCard).toHaveBeenCalledTimes(2)
  })
})

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/search-cards/:searchCardId" element={<SearchCardDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
