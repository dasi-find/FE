import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAccessToken } from '../../../api/accessTokenStore'
import { fetchCurrentUser, refreshAccessToken } from '../api/authApi'
import {
  beginAuthSessionRestore,
  getAuthSessionStatus,
  getCurrentUser,
  saveAuthSession,
} from './authSessionStore'
import { restoreAuthSession } from './restoreAuthSession'

vi.mock('../api/authApi', () => ({
  fetchCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser)
const mockedRefreshAccessToken = vi.mocked(refreshAccessToken)

describe('restoreAuthSession', () => {
  beforeEach(() => {
    beginAuthSessionRestore()
    mockedFetchCurrentUser.mockReset()
    mockedRefreshAccessToken.mockReset()
  })

  it('Refresh Token으로 Access Token과 사용자 정보를 복구한다', async () => {
    mockedRefreshAccessToken.mockResolvedValue({
      accessToken: 'renewed-token',
      accessTokenExpiresInSeconds: 1800,
    })
    mockedFetchCurrentUser.mockImplementation(async () => {
      expect(getAccessToken()).toBe('renewed-token')
      return {
        id: 7,
        email: 'hello@example.com',
        name: '민준',
      }
    })

    await restoreAuthSession()

    expect(getAuthSessionStatus()).toBe('authenticated')
    expect(getAccessToken()).toBe('renewed-token')
    expect(getCurrentUser()).toMatchObject({ id: 7, name: '민준' })
  })

  it('여러 초기화 요청이 겹쳐도 토큰 재발급을 한 번만 요청한다', async () => {
    mockedRefreshAccessToken.mockResolvedValue({
      accessToken: 'renewed-token',
      accessTokenExpiresInSeconds: 1800,
    })
    mockedFetchCurrentUser.mockResolvedValue({
      id: 7,
      email: 'hello@example.com',
      name: '민준',
    })

    await Promise.all([restoreAuthSession(), restoreAuthSession()])

    expect(mockedRefreshAccessToken).toHaveBeenCalledOnce()
    expect(mockedFetchCurrentUser).toHaveBeenCalledOnce()
  })

  it('재발급에 실패하면 기존 세션을 제거하고 비로그인 상태로 확정한다', async () => {
    mockedRefreshAccessToken.mockRejectedValue(new Error('만료된 Refresh Token'))

    await restoreAuthSession()

    expect(getAuthSessionStatus()).toBe('anonymous')
    expect(getAccessToken()).toBeNull()
    expect(getCurrentUser()).toBeNull()
    expect(mockedFetchCurrentUser).not.toHaveBeenCalled()
  })

  it('초기 복구 중 새 로그인이 완료되면 새 세션을 덮어쓰지 않는다', async () => {
    let finishRefresh: (value: {
      accessToken: string
      accessTokenExpiresInSeconds: number
    }) => void = () => undefined
    mockedRefreshAccessToken.mockReturnValue(
      new Promise((resolve) => {
        finishRefresh = resolve
      }),
    )

    const restoring = restoreAuthSession()
    saveAuthSession({
      user: { id: 8, email: 'new@example.com', name: '새 사용자' },
      accessToken: 'new-login-token',
      accessTokenExpiresInSeconds: 1800,
    })
    finishRefresh({ accessToken: 'old-cookie-token', accessTokenExpiresInSeconds: 1800 })
    await restoring

    expect(getAccessToken()).toBe('new-login-token')
    expect(getCurrentUser()).toMatchObject({ id: 8, name: '새 사용자' })
    expect(mockedFetchCurrentUser).not.toHaveBeenCalled()
  })
})
