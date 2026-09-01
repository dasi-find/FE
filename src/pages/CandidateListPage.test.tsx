import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCandidates } from '../features/candidate/api/candidateApi'
import { CandidateListPage } from './CandidateListPage'

vi.mock('../features/candidate/api/candidateApi', () => ({ getCandidates: vi.fn() }))

const mockedGetCandidates = vi.mocked(getCandidates)

describe('CandidateListPage', () => {
  beforeEach(() => mockedGetCandidates.mockReset())

  it('수색카드 후보를 적합도와 신규 표시와 함께 보여준다', async () => {
    mockedGetCandidates.mockResolvedValue([
      {
        candidateId: 302,
        rank: 2,
        itemName: '남색 지갑',
        color: 'NAVY',
        foundDate: '2026-08-19',
        storagePlace: '판교파출소',
        imageUrl: null,
        totalScore: 61,
        isNew: false,
        feedback: 'UNSURE',
        reasons: ['색상이 유사합니다.'],
      },
      {
        candidateId: 301,
        rank: 1,
        itemName: '검정색 반지갑',
        color: 'BLACK',
        foundDate: '2026-08-18',
        storagePlace: '분당경찰서',
        imageUrl: 'https://example.com/wallet.jpg',
        totalScore: 82,
        isNew: true,
        feedback: null,
        reasons: ['물품 종류가 유사합니다.'],
      },
    ])

    renderPage('/search-cards/12/candidates')

    expect(await screen.findByText('남색 지갑')).toBeInTheDocument()
    expect(screen.getByText('검정색 반지갑').closest('a')).toHaveAttribute(
      'href',
      '/candidates/301',
    )
    expect(screen.getByLabelText('적합도 61점')).toBeInTheDocument()
    expect(screen.getByLabelText('적합도 82점')).toBeInTheDocument()
    expect(screen.getByText('!')).toBeInTheDocument()
    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(mockedGetCandidates).toHaveBeenCalledWith(12)
  })

  it('후보가 없으면 재검색 안내를 보여준다', async () => {
    mockedGetCandidates.mockResolvedValue([])
    renderPage('/search-cards/12/candidates')

    expect(await screen.findByText('아직 찾은 후보가 없어요.')).toBeInTheDocument()
  })
})

function renderPage(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/search-cards/:searchCardId/candidates" element={<CandidateListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
