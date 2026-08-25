import axios, { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, toApiError } from './apiError'

describe('toApiError', () => {
  it('서비스 오류 코드를 사용자 메시지로 변환한다', () => {
    const config = { headers: new AxiosHeaders() }
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      data: {
        isSuccess: false,
        code: 'AUTH4011',
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        result: null,
      },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
    })

    const result = toApiError(error)

    expect(result).toBeInstanceOf(ApiError)
    expect(result.code).toBe('AUTH4011')
    expect(result.status).toBe(401)
    expect(result.message).toBe('이메일 또는 비밀번호가 일치하지 않습니다.')
  })

  it('응답이 없는 Axios 오류를 네트워크 오류로 변환한다', () => {
    const result = toApiError(new axios.AxiosError('Network Error'))

    expect(result.code).toBe('NETWORK_ERROR')
    expect(result.message).toMatch(/네트워크/)
  })
})
