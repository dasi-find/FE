import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { AppRouter } from './AppRouter'

describe('AppRouter', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))

  it('동적으로 불러온 랜딩 화면을 표시한다', async () => {
    render(<AppRouter />)

    expect(
      await screen.findByRole('heading', { name: /찾는 건 AI가.*확인은 당신이/ }),
    ).toBeInTheDocument()
  })
})
