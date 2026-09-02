import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getAccessToken, setAccessToken } from '../api/accessTokenStore'
import { logout } from '../features/auth/api/authApi'
import { SettingsPage } from './SettingsPage'

vi.mock('../features/auth/api/authApi', () => ({ logout: vi.fn() }))

const mockedLogout = vi.mocked(logout)

describe('SettingsPage', () => {
  beforeEach(() => {
    clearAccessToken()
    setAccessToken('access-token')
    mockedLogout.mockReset()
  })

  it('계정과 알림 관리 메뉴를 표시한다', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /마이페이지/ })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: /알림 설정/ })).toHaveAttribute(
      'href',
      '/profile#notification-settings',
    )
    expect(screen.getByRole('link', { name: /알림함/ })).toHaveAttribute('href', '/notifications')
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('aria-current', 'page')
  })

  it('로그아웃 성공 시 세션을 제거하고 로그인 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    mockedLogout.mockResolvedValue(null)
    renderPage()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
    expect(mockedLogout).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
  })

  it('로그아웃 실패 시 오류를 안내하고 세션을 유지한다', async () => {
    const user = userEvent.setup()
    mockedLogout.mockRejectedValue(new Error('서버 오류'))
    renderPage()

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('로그아웃하지 못했어요.')
    expect(getAccessToken()).toBe('access-token')
  })
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
