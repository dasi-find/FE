import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCandidateDetail,
  markCandidateViewed,
  submitCandidateFeedback,
  type CandidateDetail,
} from '../features/candidate/api/candidateApi'
import { CandidateDetailPage } from './CandidateDetailPage'

vi.mock('../features/candidate/api/candidateApi', () => ({
  getCandidateDetail: vi.fn(),
  markCandidateViewed: vi.fn(),
  submitCandidateFeedback: vi.fn(),
}))

const mockedGetCandidateDetail = vi.mocked(getCandidateDetail)
const mockedMarkCandidateViewed = vi.mocked(markCandidateViewed)
const mockedSubmitCandidateFeedback = vi.mocked(submitCandidateFeedback)

const candidateDetail: CandidateDetail = {
  candidateId: 301,
  searchCardId: 12,
  totalScore: 82,
  rank: 1,
  feedback: null,
  isExcluded: false,
  policeItem: {
    itemName: '검정색 반지갑',
    category: 'WALLET',
    color: 'BLACK',
    foundDate: '2026-08-18',
    storagePlace: '분당경찰서',
    policeManagementNo: 'F20260818-0142',
    imageUrl: null,
    originalUrl: 'https://www.lost112.go.kr/example',
  },
  scores: {
    imageScore: 88,
    textScore: 80,
    attributeScore: 84,
    timeScore: 90,
    stationProximityScore: 65,
  },
  reasons: ['물품 종류가 지갑으로 유사합니다.', '분실일과 습득일이 가깝습니다.'],
}

describe('CandidateDetailPage', () => {
  beforeEach(() => {
    mockedGetCandidateDetail.mockReset()
    mockedMarkCandidateViewed.mockReset()
    mockedSubmitCandidateFeedback.mockReset()
  })

  it('추천 근거와 경찰 습득물 정보를 표시하고 읽음 처리한다', async () => {
    mockedGetCandidateDetail.mockResolvedValue(candidateDetail)
    mockedMarkCandidateViewed.mockResolvedValue({
      candidateId: 301,
      viewedAt: '2026-08-27T15:00:00',
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: '검정색 반지갑' })).toBeInTheDocument()
    expect(screen.getByText('F20260818-0142')).toBeInTheDocument()
    expect(screen.getByText('물품 종류가 지갑으로 유사합니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /경찰민원24에서 원문 확인/ })).toHaveAttribute(
      'href',
      'https://www.lost112.go.kr/example',
    )
    await waitFor(() => expect(mockedMarkCandidateViewed).toHaveBeenCalledWith(301))
  })

  it('후보 피드백을 저장하고 선택 상태를 갱신한다', async () => {
    const user = userEvent.setup()
    mockedGetCandidateDetail.mockResolvedValue(candidateDetail)
    mockedMarkCandidateViewed.mockResolvedValue({
      candidateId: 301,
      viewedAt: '2026-09-01T10:00:00',
    })
    mockedSubmitCandidateFeedback.mockResolvedValue({
      candidateId: 301,
      feedback: 'NOT_MINE',
      isExcluded: true,
      updatedAt: '2026-09-01T10:01:00',
    })
    renderPage()

    const notMineButton = await screen.findByRole('button', { name: /제 물건이 아니에요/ })
    await user.click(notMineButton)

    expect(await screen.findByText('피드백을 저장했어요.')).toBeInTheDocument()
    expect(mockedSubmitCandidateFeedback).toHaveBeenCalledWith(301, 'NOT_MINE')
    expect(notMineButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('제외한 후보')).toBeInTheDocument()
  })

  it('피드백 저장 실패 후 다시 선택해 재시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetCandidateDetail.mockResolvedValue(candidateDetail)
    mockedMarkCandidateViewed.mockResolvedValue({
      candidateId: 301,
      viewedAt: '2026-09-01T10:00:00',
    })
    mockedSubmitCandidateFeedback
      .mockRejectedValueOnce(new Error('저장 실패'))
      .mockResolvedValueOnce({
        candidateId: 301,
        feedback: 'UNSURE',
        isExcluded: false,
        updatedAt: '2026-09-01T10:01:00',
      })
    renderPage()

    const unsureButton = await screen.findByRole('button', { name: /잘 모르겠어요/ })
    await user.click(unsureButton)
    expect(await screen.findByRole('alert')).toHaveTextContent('피드백을 저장하지 못했어요.')

    await user.click(unsureButton)
    expect(await screen.findByText('피드백을 저장했어요.')).toBeInTheDocument()
    expect(mockedSubmitCandidateFeedback).toHaveBeenCalledTimes(2)
  })
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/candidates/301']}>
        <Routes>
          <Route path="/candidates/:candidateId" element={<CandidateDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
