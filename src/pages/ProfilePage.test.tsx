import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getAccessToken } from '../api/accessTokenStore'
import { logout } from '../features/auth/api/authApi'
import { getCurrentUser, saveAuthSession } from '../features/auth/model/authSessionStore'
import { getMyProfile, updateMyProfile, type UserProfile } from '../features/user/api/userApi'
import { ProfilePage } from './ProfilePage'

vi.mock('../features/user/api/userApi', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))
vi.mock('../features/auth/api/authApi', () => ({ logout: vi.fn() }))

const mockedGetMyProfile = vi.mocked(getMyProfile)
const mockedUpdateMyProfile = vi.mocked(updateMyProfile)
const mockedLogout = vi.mocked(logout)

const profile: UserProfile = {
  id: 7,
  email: 'hello@example.com',
  name: '민준',
  emailNotificationEnabled: true,
}

describe('ProfilePage', () => {
  beforeEach(() => {
    clearAccessToken()
    mockedGetMyProfile.mockReset()
    mockedUpdateMyProfile.mockReset()
    mockedLogout.mockReset()
    saveAuthSession({
      user: { id: 7, email: 'hello@example.com', name: '민준' },
      accessToken: 'access-token',
      accessTokenExpiresInSeconds: 1800,
    })
  })

  it('내 정보를 조회하고 변경사항을 저장한다', async () => {
    const user = userEvent.setup()
    mockedGetMyProfile.mockResolvedValue(profile)
    mockedUpdateMyProfile.mockResolvedValue({
      ...profile,
      name: '다시찾음',
      emailNotificationEnabled: false,
    })
    renderProfile()

    const nameInput = await screen.findByDisplayValue('민준')
    expect(screen.getByDisplayValue('hello@example.com')).toHaveAttribute('readonly')
    await user.clear(nameInput)
    await user.type(nameInput, '다시찾음')
    await user.click(screen.getByRole('checkbox', { name: /이메일 알림/ }))
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(mockedUpdateMyProfile).toHaveBeenCalledWith({
      name: '다시찾음',
      emailNotificationEnabled: false,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('내 정보를 저장했어요.')
    expect(getCurrentUser()?.name).toBe('다시찾음')
  })

  it('표시명 길이를 검증하고 잘못된 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    mockedGetMyProfile.mockResolvedValue(profile)
    renderProfile()

    const nameInput = await screen.findByDisplayValue('민준')
    await user.clear(nameInput)
    await user.type(nameInput, '가')
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(screen.getByText('표시명은 2자 이상 50자 이하로 입력해 주세요.')).toBeInTheDocument()
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled()
  })

  it('조회 실패 후 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    mockedGetMyProfile.mockRejectedValueOnce(new Error('조회 실패')).mockResolvedValueOnce(profile)
    renderProfile()

    expect(await screen.findByRole('alert')).toHaveTextContent('내 정보를 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByDisplayValue('민준')).toBeInTheDocument()
    expect(mockedGetMyProfile).toHaveBeenCalledTimes(2)
  })

  it('로그아웃 성공 시 세션을 제거하고 로그인 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    mockedGetMyProfile.mockResolvedValue(profile)
    mockedLogout.mockResolvedValue(null)
    renderProfile()

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
    expect(mockedLogout).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
  })

  it('로그아웃 실패 시 세션을 유지한다', async () => {
    const user = userEvent.setup()
    mockedGetMyProfile.mockResolvedValue(profile)
    mockedLogout.mockRejectedValue(new Error('서버 오류'))
    renderProfile()

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('로그아웃하지 못했어요.')
    expect(getAccessToken()).toBe('access-token')
  })
})

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
