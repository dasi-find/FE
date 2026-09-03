import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSearchCard,
  deleteSearchCardImage,
  getSearchCardAnalysis,
  requestSearchCardAnalysis,
  uploadSearchCardImage,
} from '../features/searchCard/api/searchCardApi'
import { NewSearchCardPage } from './NewSearchCardPage'

vi.mock('../features/searchCard/api/searchCardApi', () => ({
  uploadSearchCardImage: vi.fn(),
  deleteSearchCardImage: vi.fn(),
  getSearchCardAnalysis: vi.fn(),
  requestSearchCardAnalysis: vi.fn(),
  createSearchCard: vi.fn(),
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
    <button
      type="button"
      onClick={() =>
        onSelect({
          placeName: query,
          address: '경기도 성남시 분당구 판교역로 160',
          latitude: 37.3947,
          longitude: 127.1112,
        })
      }
    >
      테스트 장소 선택
    </button>
  ),
}))

const mockedUpload = vi.mocked(uploadSearchCardImage)
const mockedDeleteImage = vi.mocked(deleteSearchCardImage)
const mockedGetAnalysis = vi.mocked(getSearchCardAnalysis)
const mockedAnalysis = vi.mocked(requestSearchCardAnalysis)
const mockedCreate = vi.mocked(createSearchCard)

describe('NewSearchCardPage', () => {
  beforeEach(() => {
    mockedUpload.mockReset()
    mockedDeleteImage.mockReset()
    mockedGetAnalysis.mockReset()
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
    await user.click(screen.getByRole('button', { name: '테스트 장소 선택' }))
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

    mockedGetAnalysis.mockResolvedValueOnce({
      analysisId: 801,
      category: 'WALLET',
      itemName: '카드지갑',
      colors: ['남색'],
      brand: null,
      materials: ['가죽'],
      ocrText: null,
      features: ['최신 분석 특징'],
      modelVersion: 'v2',
    })
    await user.click(screen.getByRole('button', { name: '최신 분석 결과 불러오기' }))

    expect(await screen.findByText('최신 분석 특징')).toBeInTheDocument()
    expect(mockedGetAnalysis).toHaveBeenCalledWith(801)

    mockedGetAnalysis.mockRejectedValueOnce(new Error('최신 결과를 불러오지 못했어요.'))
    await user.click(screen.getByRole('button', { name: '최신 분석 결과 불러오기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('최신 결과를 불러오지 못했어요.')
    expect(screen.getByText('최신 분석 특징')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이 내용으로 수색 시작' }))
    expect(await screen.findByRole('heading', { name: '수색을 시작했어요.' })).toBeInTheDocument()
    expect(screen.getByText('현재 확인할 후보 3개')).toBeInTheDocument()
  })

  it('이미지 업로드 후 분석이 실패하면 업로드된 이미지를 정리한다', async () => {
    const user = userEvent.setup()
    mockedUpload.mockResolvedValue({
      imageId: 501,
      imageUrl: '/wallet.jpg',
      imageType: 'ACTUAL',
    })
    mockedAnalysis.mockRejectedValue(new Error('분석 서버에 연결하지 못했어요.'))
    mockedDeleteImage.mockResolvedValue(null)
    renderPage()

    await user.click(screen.getByRole('button', { name: '지갑' }))
    await user.type(screen.getByLabelText('물품명'), '남색 카드지갑')
    await user.type(screen.getByLabelText(/대표 색상/), '남색')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.upload(
      screen.getByLabelText(/사진 추가/),
      new File(['wallet'], 'wallet.png', { type: 'image/png' }),
    )
    await user.type(screen.getByLabelText('기억나는 특징'), '앞면에 은색 로고가 있어요')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.type(screen.getByLabelText('날짜'), '2026-08-17')
    await user.type(screen.getByLabelText('장소명'), '판교역')
    await user.type(screen.getByLabelText('주소'), '경기도 성남시 분당구 판교역로 160')
    await user.click(screen.getByRole('button', { name: '테스트 장소 선택' }))
    await user.click(screen.getByRole('button', { name: 'AI로 분석하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('분석 서버에 연결하지 못했어요.')
    expect(mockedDeleteImage).toHaveBeenCalledWith(501)
  })

  it('여러 이미지 중 일부 업로드가 실패하면 성공한 이미지만 정리한다', async () => {
    const user = userEvent.setup()
    mockedUpload
      .mockResolvedValueOnce({
        imageId: 501,
        imageUrl: '/wallet-front.jpg',
        imageType: 'ACTUAL',
      })
      .mockRejectedValueOnce(new Error('두 번째 사진을 올리지 못했어요.'))
    mockedDeleteImage.mockResolvedValue(null)
    renderPage()

    await user.click(screen.getByRole('button', { name: '지갑' }))
    await user.type(screen.getByLabelText('물품명'), '남색 카드지갑')
    await user.type(screen.getByLabelText(/대표 색상/), '남색')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.upload(screen.getByLabelText(/사진 추가/), [
      new File(['front'], 'wallet-front.png', { type: 'image/png' }),
      new File(['back'], 'wallet-back.png', { type: 'image/png' }),
    ])
    await user.type(screen.getByLabelText('기억나는 특징'), '모서리에 긁힌 자국이 있어요')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.type(screen.getByLabelText('날짜'), '2026-08-17')
    await user.type(screen.getByLabelText('장소명'), '판교역')
    await user.type(screen.getByLabelText('주소'), '경기도 성남시 분당구 판교역로 160')
    await user.click(screen.getByRole('button', { name: '테스트 장소 선택' }))
    await user.click(screen.getByRole('button', { name: 'AI로 분석하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('두 번째 사진을 올리지 못했어요.')
    expect(mockedDeleteImage).toHaveBeenCalledTimes(1)
    expect(mockedDeleteImage).toHaveBeenCalledWith(501)
    expect(mockedAnalysis).not.toHaveBeenCalled()
  })

  it('특징과 사진 개수를 분석 API 계약에 맞게 검증한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '지갑' }))
    await user.type(screen.getByLabelText('물품명'), '카드지갑')
    await user.type(screen.getByLabelText(/대표 색상/), '검정')
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByRole('alert')).toHaveTextContent('기억나는 특징을 입력해 주세요.')

    await user.upload(
      screen.getByLabelText(/사진 추가/),
      Array.from(
        { length: 6 },
        (_, index) => new File(['image'], `wallet-${index}.png`, { type: 'image/png' }),
      ),
    )

    expect(screen.getByText('사진은 최대 5장까지 올릴 수 있어요.')).toBeInTheDocument()
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/search-cards/new']}>
      <NewSearchCardPage />
    </MemoryRouter>,
  )
}
