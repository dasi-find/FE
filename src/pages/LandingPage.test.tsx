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
    expect(screen.getByRole('list', { name: '이용 방법' })).toHaveTextContent('잃어버린 물건 등록')
    expect(screen.getByText('경찰 습득물과 비교')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '시작하기' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: '이메일로 회원가입' })).toHaveAttribute(
      'href',
      '/signup',
    )
    expect(screen.getByText(/경찰청 습득물 정보를 바탕으로/)).toBeInTheDocument()
  })
})
