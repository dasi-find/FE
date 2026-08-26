import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSearchCard,
  requestSearchCardAnalysis,
  uploadSearchCardImage,
} from '../features/searchCard/api/searchCardApi'
import { NewSearchCardPage } from './NewSearchCardPage'

vi.mock('../features/searchCard/api/searchCardApi', () => ({
  uploadSearchCardImage: vi.fn(),
  requestSearchCardAnalysis: vi.fn(),
  createSearchCard: vi.fn(),
}))

const mockedUpload = vi.mocked(uploadSearchCardImage)
const mockedAnalysis = vi.mocked(requestSearchCardAnalysis)
const mockedCreate = vi.mocked(createSearchCard)

describe('NewSearchCardPage', () => {
  beforeEach(() => {
    mockedUpload.mockReset()
    mockedAnalysis.mockReset()
    mockedCreate.mockReset()
  })

  it('1단계 필수 기본정보를 검증한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByText('카테고리를 선택해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('물품명을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('대표 색상을 입력해 주세요.')).toBeInTheDocument()
  })

  it('세 단계 입력을 유지하고 분석 후 수색을 시작한다', async () => {
    const user = userEvent.setup()
    mockedAnalysis.mockResolvedValue({
      analysisId: 801,
      category: 'WALLET',
      itemName: '카드지갑',
      colors: ['남색', '검정'],
      brand: null,
      materials: ['가죽'],
      ocrText: null,
      features: ['은색 로고', '모서리 긁힘'],
      modelVersion: 'v1',
    })
    mockedCreate.mockResolvedValue({
      searchCardId: 12,
      status: 'ACTIVE',
      searchExpiresAt: '2026-09-16T23:59:59',
      initialCandidateCount: 3,
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: '지갑' }))
    await user.type(screen.getByLabelText('물품명'), '남색 카드지갑')
    await user.type(screen.getByLabelText(/대표 색상/), '남색, 검정')
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('heading', { name: /눈에 띄는 특징이.*있었나요/ })).toBeInTheDocument()

    await user.type(screen.getByLabelText('기억나는 특징'), '은색 로고와 모서리 긁힘')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.type(screen.getByLabelText('날짜'), '2026-08-17')
    await user.type(screen.getByLabelText('장소명'), '판교역 스타벅스')
    await user.type(screen.getByLabelText('주소'), '경기도 성남시 분당구 판교역로 166')
    await user.click(screen.getByRole('button', { name: 'AI로 분석하기' }))

    expect(await screen.findByRole('heading', { name: '특징을 정리했어요.' })).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
    expect(mockedAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'WALLET',
        itemName: '남색 카드지갑',
        color: ['남색', '검정'],
        imageIds: [],
        lostStartTime: null,
        lostEndTime: null,
        lostLocation: expect.objectContaining({ placeName: '판교역 스타벅스' }),
      }),
    )

    await user.click(screen.getByRole('button', { name: '이 내용으로 수색 시작' }))
    expect(await screen.findByRole('heading', { name: '수색을 시작했어요.' })).toBeInTheDocument()
    expect(screen.getByText('현재 확인할 후보 3개')).toBeInTheDocument()
  })
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/search-cards/new']}>
      <NewSearchCardPage />
    </MemoryRouter>,
  )
}
