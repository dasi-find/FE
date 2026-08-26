import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getAccessToken } from '../api/accessTokenStore'
import { login } from '../features/auth/api/authApi'
import { LoginPage } from './LoginPage'

vi.mock('../features/auth/api/authApi', () => ({ login: vi.fn() }))

const mockedLogin = vi.mocked(login)

describe('LoginPage', () => {
  beforeEach(() => {
    clearAccessToken()
    mockedLogin.mockReset()
  })

  it('필수 입력값을 검증한다', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('이메일을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument()
    expect(mockedLogin).not.toHaveBeenCalled()
  })

  it('로그인 성공 시 토큰을 저장하고 원래 경로로 이동한다', async () => {
    const user = userEvent.setup()
    mockedLogin.mockResolvedValue({
      user: { id: 7, email: 'hello@example.com', name: '민준' },
      accessToken: 'access-token',
      accessTokenExpiresInSeconds: 1800,
    })
    renderLogin('/login', { from: '/home?from=mail' })

    await user.type(screen.getByLabelText('이메일'), 'hello@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('보호된 홈')).toBeInTheDocument()
    expect(mockedLogin).toHaveBeenCalledWith({
      email: 'hello@example.com',
      password: 'password123',
    })
    expect(getAccessToken()).toBe('access-token')
  })
})

function renderLogin(initialEntry = '/login', state?: { from: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: initialEntry, state }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<p>보호된 홈</p>} />
      </Routes>
    </MemoryRouter>,
  )
}
