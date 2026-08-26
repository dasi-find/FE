import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getAccessToken } from '../api/accessTokenStore'
import {
  confirmEmailVerification,
  sendEmailVerification,
  signup,
} from '../features/auth/api/authApi'
import { SignupPage } from './SignupPage'

vi.mock('../features/auth/api/authApi', () => ({
  confirmEmailVerification: vi.fn(),
  sendEmailVerification: vi.fn(),
  signup: vi.fn(),
}))

const mockedConfirmEmailVerification = vi.mocked(confirmEmailVerification)
const mockedSendEmailVerification = vi.mocked(sendEmailVerification)
const mockedSignup = vi.mocked(signup)

describe('SignupPage', () => {
  beforeEach(() => {
    clearAccessToken()
    mockedConfirmEmailVerification.mockReset()
    mockedSendEmailVerification.mockReset()
    mockedSignup.mockReset()
  })

  it('이메일 인증을 완료한 뒤 명세 형식으로 회원가입한다', async () => {
    const user = userEvent.setup()
    mockedSendEmailVerification.mockResolvedValue({
      verificationId: 'ev_request',
      expiresInSeconds: 300,
    })
    mockedConfirmEmailVerification.mockResolvedValue({
      verificationToken: 'evt_token',
      verifiedEmail: 'hello@example.com',
    })
    mockedSignup.mockResolvedValue({
      user: { id: 7, email: 'hello@example.com', name: '민준' },
      accessToken: 'signup-access-token',
      accessTokenExpiresInSeconds: 1800,
    })
    renderSignup()

    await user.type(screen.getByLabelText('이메일'), 'hello@example.com')
    await user.click(screen.getByRole('button', { name: '인증 요청' }))

    expect(
      await screen.findByText('인증번호를 보냈습니다. 메일함을 확인해 주세요.'),
    ).toBeInTheDocument()
    expect(screen.getByText('5:00')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/인증번호/), '123456')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByText('이메일 인증이 완료되었습니다.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('표시명'), '민준')
    await user.type(screen.getByLabelText('비밀번호', { selector: 'input' }), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByLabelText('[필수] 이용약관에 동의합니다.'))
    await user.click(screen.getByLabelText('[필수] 개인정보 처리방침에 동의합니다.'))
    await user.click(screen.getByRole('button', { name: '회원가입 완료' }))

    expect(await screen.findByText('가입 후 홈')).toBeInTheDocument()
    expect(mockedSignup).toHaveBeenCalledWith({
      email: 'hello@example.com',
      verificationToken: 'evt_token',
      password: 'password123',
      name: '민준',
      agreements: { terms: true, privacy: true, emailNotification: true },
    })
    expect(getAccessToken()).toBe('signup-access-token')
  })
})

function renderSignup() {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<p>가입 후 홈</p>} />
      </Routes>
    </MemoryRouter>,
  )
}
