import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from './apiError'
import { createHttpClient } from './httpClient'
import type { ApiResponse } from './types'

function response(config: AxiosResponse['config'], data: unknown, status = 200): AxiosResponse {
  return { data, status, statusText: status === 200 ? 'OK' : 'Unauthorized', headers: {}, config }
}

function unauthorized(config: AxiosResponse['config']) {
  const apiResponse = {
    isSuccess: false,
    code: 'AUTH4012',
    message: '인증 토큰이 유효하지 않습니다.',
    result: null,
  }
  return new AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    undefined,
    response(config, apiResponse, 401),
  )
}

describe('httpClient', () => {
  it('보호 API 요청에 Access Token을 첨부한다', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      expect(AxiosHeaders.from(config.headers).get('Authorization')).toBe('Bearer access-token')
      return response(config, { isSuccess: true, code: 'COMMON2001', message: '성공', result: {} })
    })
    const client = createHttpClient({ adapter, readAccessToken: () => 'access-token' })

    await client.get('/v1/home')

    expect(adapter).toHaveBeenCalledOnce()
  })

  it('401 응답에서 Token을 재발급하고 원 요청을 한 번 재시도한다', async () => {
    let protectedRequestCount = 0
    let token = 'expired-token'
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/v1/auth/token/refresh') {
        const refreshResponse: ApiResponse<{
          accessToken: string
          accessTokenExpiresInSeconds: number
        }> = {
          isSuccess: true,
          code: 'COMMON2001',
          message: '성공',
          result: { accessToken: 'renewed-token', accessTokenExpiresInSeconds: 1800 },
        }
        return response(config, refreshResponse)
      }

      protectedRequestCount += 1
      if (protectedRequestCount === 1) throw unauthorized(config)

      expect(AxiosHeaders.from(config.headers).get('Authorization')).toBe('Bearer renewed-token')
      return response(config, {
        isSuccess: true,
        code: 'COMMON2001',
        message: '성공',
        result: { id: 7 },
      })
    }
    const client = createHttpClient({
      adapter,
      readAccessToken: () => token,
      saveAccessToken: (nextToken) => {
        token = nextToken
      },
    })

    const result = await client.get<ApiResponse<{ id: number }>>('/v1/users/me')

    expect(result.data.result.id).toBe(7)
    expect(protectedRequestCount).toBe(2)
    expect(token).toBe('renewed-token')
  })

  it('여러 요청이 동시에 401을 받아도 Token은 한 번만 재발급한다', async () => {
    let refreshRequestCount = 0
    const protectedRequestCounts = new Map<string, number>()
    let token = 'expired-token'
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/v1/auth/token/refresh') {
        refreshRequestCount += 1
        await Promise.resolve()
        return response(config, {
          isSuccess: true,
          code: 'COMMON2001',
          message: '성공',
          result: { accessToken: 'renewed-token', accessTokenExpiresInSeconds: 1800 },
        })
      }

      const requestCount = (protectedRequestCounts.get(config.url ?? '') ?? 0) + 1
      protectedRequestCounts.set(config.url ?? '', requestCount)
      if (requestCount === 1) throw unauthorized(config)

      return response(config, { isSuccess: true, code: 'COMMON2001', message: '성공', result: {} })
    }
    const client = createHttpClient({
      adapter,
      readAccessToken: () => token,
      saveAccessToken: (nextToken) => {
        token = nextToken
      },
    })

    await Promise.all([client.get('/v1/home'), client.get('/v1/users/me')])

    expect(refreshRequestCount).toBe(1)
    expect(protectedRequestCounts.get('/v1/home')).toBe(2)
    expect(protectedRequestCounts.get('/v1/users/me')).toBe(2)
  })

  it('Access Token이 없는 인증 실패에서는 재발급을 시도하지 않는다', async () => {
    let requestCount = 0
    const adapter: AxiosAdapter = async (config) => {
      requestCount += 1
      throw unauthorized(config)
    }
    const client = createHttpClient({ adapter, readAccessToken: () => null })

    await expect(client.post('/v1/auth/login')).rejects.toMatchObject({ code: 'AUTH4012' })
    expect(requestCount).toBe(1)
  })

  it('재발급 실패 시 Token을 제거하고 무한 재시도하지 않는다', async () => {
    let requestCount = 0
    const removeAccessToken = vi.fn()
    const adapter: AxiosAdapter = async (config) => {
      requestCount += 1
      throw unauthorized(config)
    }
    const client = createHttpClient({
      adapter,
      readAccessToken: () => 'expired-token',
      removeAccessToken,
    })

    await expect(client.get('/v1/home')).rejects.toBeInstanceOf(ApiError)
    expect(removeAccessToken).toHaveBeenCalledOnce()
    expect(requestCount).toBe(2)
  })
})
