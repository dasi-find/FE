import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getSearchCard,
  updateSearchCard,
  type SearchCardDetail,
} from '../features/searchCard/api/searchCardApi'
import { SearchCardEditPage } from './SearchCardEditPage'

vi.mock('../features/searchCard/api/searchCardApi', () => ({
  getSearchCard: vi.fn(),
  updateSearchCard: vi.fn(),
}))
vi.mock('../features/searchCard/components/KakaoPlacePicker', () => ({
  KakaoPlacePicker: ({
    query,
    onSelect,
  }: {
    query: string
    onSelect: (place: {
      placeName: string
      address: string
      latitude: number
      longitude: number
    }) => void
  }) => (
    <div data-testid="place-picker">
      <button
        type="button"
        onClick={() =>
          onSelect({
            placeName: query,
            address: '서울특별시 중구 세종대로 110',
            latitude: 37.5666,
            longitude: 126.9784,
          })
        }
      >
        테스트 장소 선택
      </button>
    </div>
  ),
}))

const mockedGetSearchCard = vi.mocked(getSearchCard)
const mockedUpdateSearchCard = vi.mocked(updateSearchCard)

const searchCard: SearchCardDetail = {
  id: 12,
  itemName: '남색 카드지갑',
  status: 'ACTIVE',
  imageUrls: ['/wallet.jpg'],
  category: 'WALLET',
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
  analysis: null,
  searchExpiresAt: '2026-09-16T23:59:59',
  unreadCandidateCount: 2,
  bestCandidateScore: 82.4,
}

describe('SearchCardEditPage', () => {
  beforeEach(() => {
    mockedGetSearchCard.mockReset()
    mockedUpdateSearchCard.mockReset()
  })

  it('기존 정보를 불러와 수정하고 상세 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard.mockResolvedValue(searchCard)
    mockedUpdateSearchCard.mockImplementation(async (_, request) => ({
      ...searchCard,
      itemName: request.itemName,
      colors: request.color,
    }))
    renderPage('/search-cards/12/edit')

    const itemNameInput = await screen.findByRole('textbox', { name: '물품명' })
    expect(itemNameInput).toHaveValue('남색 카드지갑')
    expect(screen.getByRole('textbox', { name: /대표 색상/ })).toHaveValue('남색, 검정')
    expect(screen.getByRole('button', { name: '대략적인 시간' })).toHaveClass('is-selected')
    expect(screen.getByTestId('place-picker')).toBeInTheDocument()

    await user.clear(itemNameInput)
    await user.type(itemNameInput, '검정 카드지갑')
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    await waitFor(() => expect(mockedUpdateSearchCard).toHaveBeenCalledTimes(1))
    expect(mockedUpdateSearchCard).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        category: 'WALLET',
        itemName: '검정 카드지갑',
        color: ['남색', '검정'],
        lostStartTime: '14:00',
        lostEndTime: '15:30',
      }),
    )
    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('필수 정보를 지우면 API를 호출하지 않고 오류를 표시한다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard.mockResolvedValue(searchCard)
    renderPage('/search-cards/12/edit')

    const itemNameInput = await screen.findByRole('textbox', { name: '물품명' })
    await user.clear(itemNameInput)
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(screen.getByText('물품명을 입력해 주세요.')).toBeInTheDocument()
    expect(mockedUpdateSearchCard).not.toHaveBeenCalled()
  })

  it('장소명을 직접 바꾸면 지도 위치를 다시 선택하도록 안내한다', async () => {
    const user = userEvent.setup()
    mockedGetSearchCard.mockResolvedValue(searchCard)
    mockedUpdateSearchCard.mockResolvedValue(searchCard)
    renderPage('/search-cards/12/edit')

    const placeNameInput = await screen.findByRole('textbox', { name: '장소명' })
    await user.clear(placeNameInput)
    await user.type(placeNameInput, '서울시청')
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(screen.getByText('카카오맵 검색 결과에서 장소를 선택해 주세요.')).toBeInTheDocument()
    expect(mockedUpdateSearchCard).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '테스트 장소 선택' }))
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    await waitFor(() => expect(mockedUpdateSearchCard).toHaveBeenCalledTimes(1))
    expect(mockedUpdateSearchCard).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        lostLocation: expect.objectContaining({
          placeName: '서울시청',
          latitude: 37.5666,
          longitude: 126.9784,
        }),
      }),
    )
  })

  it('잘못된 ID는 조회하지 않고 목록 이동을 안내한다', () => {
    renderPage('/search-cards/wrong/edit')

    expect(screen.getByRole('alert')).toHaveTextContent('잘못된 수색카드예요.')
    expect(screen.getByRole('link', { name: '목록으로 돌아가기' })).toHaveAttribute(
      'href',
      '/search-cards',
    )
    expect(mockedGetSearchCard).not.toHaveBeenCalled()
  })

  it('수색 중이 아닌 카드는 수정 화면을 열지 않는다', async () => {
    mockedGetSearchCard.mockResolvedValue({ ...searchCard, status: 'CLOSED' })
    renderPage('/search-cards/12/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('수정할 수 없는 수색카드예요.')
    expect(screen.getByRole('link', { name: '상세로 돌아가기' })).toHaveAttribute(
      'href',
      '/search-cards/12',
    )
    expect(screen.queryByRole('button', { name: '변경사항 저장' })).not.toBeInTheDocument()
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
          <Route path="/search-cards/:searchCardId/edit" element={<SearchCardEditPage />} />
          <Route path="/search-cards/:searchCardId" element={<p>상세 화면</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
