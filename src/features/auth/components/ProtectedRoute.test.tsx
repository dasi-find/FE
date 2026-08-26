import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearAccessToken, setAccessToken } from '../../../api/accessTokenStore'
import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => clearAccessToken())

  it('비로그인 사용자를 로그인 화면으로 보내고 원래 경로를 보존한다', () => {
    renderRoute('/home?from=mail')

    expect(screen.getByText('로그인 필요')).toBeInTheDocument()
    expect(screen.getByTestId('from')).toHaveTextContent('/home?from=mail')
  })

  it('Access Token이 있으면 보호 화면을 표시한다', () => {
    setAccessToken('access-token')
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
