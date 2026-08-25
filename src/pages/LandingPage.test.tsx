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

    expect(screen.getByRole('heading', { name: '다시찾음' })).toBeInTheDocument()
    expect(screen.getByText(/소유권을 확정하지 않습니다/)).toBeInTheDocument()
  })
})
