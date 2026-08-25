import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeAccessToken,
} from './accessTokenStore'

describe('accessTokenStore', () => {
  beforeEach(() => clearAccessToken())

  it('Access Token을 메모리에 저장하고 제거한다', () => {
    setAccessToken('access-token')
    expect(getAccessToken()).toBe('access-token')

    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  it('Token 변경을 구독자에게 알린다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeAccessToken(listener)

    setAccessToken('next-token')
    clearAccessToken()
    unsubscribe()
    setAccessToken('ignored-token')

    expect(listener).toHaveBeenNthCalledWith(1, 'next-token')
    expect(listener).toHaveBeenNthCalledWith(2, null)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
