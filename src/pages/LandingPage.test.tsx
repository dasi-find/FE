import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('서비스의 핵심 안내를 표시한다', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /찾는 건 AI가.*확인은 당신이/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '시작하기' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: '이메일로 회원가입' })).toHaveAttribute(
      'href',
      '/signup',
    )
    expect(screen.getByText(/소유권을 확정하지 않습니다/)).toBeInTheDocument()
  })
})
