import axios from 'axios'

import type { ApiErrorCode, ApiErrorResponse } from './types'

const fallbackMessages: Record<ApiErrorCode, string> = {
  COMMON4001: '요청값이 올바르지 않습니다.',
  COMMON4004: '필수 입력값을 확인해 주세요.',
  COMMON4011: '로그인이 필요합니다.',
  COMMON4031: '접근 권한이 없습니다.',
  COMMON4041: '요청한 정보를 찾을 수 없습니다.',
  COMMON4091: '이미 처리 중이거나 완료된 요청입니다.',
  COMMON4291: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  COMMON5001: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  AUTH4001: '이메일 인증번호가 일치하지 않습니다.',
  AUTH4011: '이메일 또는 비밀번호가 일치하지 않습니다.',
  AUTH4012: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.',
  AUTH4091: '이미 가입된 이메일입니다.',
  AUTH4101: '이메일 인증 시간이 만료되었습니다. 다시 요청해 주세요.',
  SEARCH4091: '현재 수색카드 상태에서는 요청을 처리할 수 없습니다.',
  IMAGE4131: '이미지 파일 용량이 너무 큽니다.',
  IMAGE4151: '지원하지 않는 이미지 형식입니다.',
  AI5021: 'AI 분석에 실패했습니다. 다시 시도해 주세요.',
  AI5031: 'AI 분석 서비스를 잠시 사용할 수 없습니다.',
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number | null

  constructor(
    message: string,
    code = 'UNKNOWN',
    status: number | null = null,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object') return false

  const response = value as Partial<ApiErrorResponse>
  return (
    response.isSuccess === false &&
    typeof response.code === 'string' &&
    typeof response.message === 'string'
  )
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null
    const data: unknown = error.response?.data

    if (isApiErrorResponse(data)) {
      const message = fallbackMessages[data.code as ApiErrorCode] ?? data.message
      return new ApiError(message, data.code, status, { cause: error })
    }

    if (!error.response) {
      return new ApiError(
        '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
        'NETWORK_ERROR',
        null,
        {
          cause: error,
        },
      )
    }

    return new ApiError(
      '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      'HTTP_ERROR',
      status,
      {
        cause: error,
      },
    )
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'UNKNOWN', null, { cause: error })
  }

  return new ApiError('알 수 없는 오류가 발생했습니다.')
}
