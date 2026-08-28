import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { logout } from './authApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { post: vi.fn() },
}))

const mockedPost = vi.mocked(httpClient.post)

describe('authApi', () => {
  beforeEach(() => mockedPost.mockReset())

  it('HttpOnly Refresh Token 쿠키 만료를 위해 로그아웃 API를 호출한다', async () => {
    mockedPost.mockResolvedValue({
      data: {
        isSuccess: true,
        code: 'COMMON2001',
        message: '요청에 성공하였습니다.',
        result: null,
      },
    })

    await expect(logout()).resolves.toBeNull()

    expect(mockedPost).toHaveBeenCalledWith('/v1/auth/logout', {})
  })
})
