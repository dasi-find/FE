import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  beginAuthSessionRestore,
  clearAuthSession,
  saveAuthSession,
} from '../model/authSessionStore'
import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => clearAuthSession())

  it('인증 세션을 복구하는 동안 현재 화면에서 기다린다', () => {
    beginAuthSessionRestore()
    renderRoute('/home')

    expect(screen.getByRole('status')).toHaveTextContent('로그인 상태를 확인하고 있어요.')
    expect(screen.queryByText('로그인 필요')).not.toBeInTheDocument()
  })

  it('비로그인 사용자를 로그인 화면으로 보내고 원래 경로를 보존한다', () => {
    renderRoute('/home?from=mail')

    expect(screen.getByText('로그인 필요')).toBeInTheDocument()
    expect(screen.getByTestId('from')).toHaveTextContent('/home?from=mail')
  })

  it('Access Token이 있으면 보호 화면을 표시한다', () => {
    saveAuthSession({
      user: { id: 7, email: 'hello@example.com', name: '민준' },
      accessToken: 'access-token',
      accessTokenExpiresInSeconds: 1800,
    })
    renderRoute('/home')

    expect(screen.getByText('보호된 화면')).toBeInTheDocument()
  })
})

function LoginTarget() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ''
  return (
    <>
      <p>로그인 필요</p>
      <span data-testid="from">{from}</span>
    </>
  )
}

function renderRoute(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginTarget />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <p>보호된 화면</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}
