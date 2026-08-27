import axios, { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'

import { clearAccessToken, getAccessToken, setAccessToken } from './accessTokenStore'
import { toApiError } from './apiError'
import type { ApiResponse } from './types'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  hasRetriedAfterRefresh?: boolean
  skipAuthRefresh?: boolean
}

type RefreshAccessTokenResult = {
  accessToken: string
  accessTokenExpiresInSeconds: number
}

type CreateHttpClientOptions = {
  baseURL?: string
  adapter?: AxiosAdapter
  readAccessToken?: () => string | null
  saveAccessToken?: (accessToken: string) => void
  removeAccessToken?: () => void
}

const defaultBaseURL = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL ?? '/api') : '/api'

export function createHttpClient({
  baseURL = defaultBaseURL,
  adapter,
  readAccessToken = getAccessToken,
  saveAccessToken = setAccessToken,
  removeAccessToken = clearAccessToken,
}: CreateHttpClientOptions = {}) {
  const commonConfig = {
    baseURL,
    timeout: 10_000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    ...(adapter ? { adapter } : {}),
  }
  const client = axios.create(commonConfig)
  const refreshClient = axios.create(commonConfig)
  let refreshRequest: Promise<string> | null = null

  client.interceptors.request.use((config) => {
    const accessToken = readAccessToken()

    if (accessToken) {
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)
      config.headers = headers
    }

    return config
  })

  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const config = error.config as RetryableRequestConfig
    const canRefresh =
      error.response?.status === 401 &&
      Boolean(readAccessToken()) &&
      !config.hasRetriedAfterRefresh &&
      !config.skipAuthRefresh &&
      !config.url?.includes('/auth/token/refresh')

    if (!canRefresh) return Promise.reject(error)

    config.hasRetriedAfterRefresh = true

    try {
      refreshRequest ??= refreshClient
        .post<ApiResponse<RefreshAccessTokenResult>>('/v1/auth/token/refresh', {})
        .then(({ data }) => {
          saveAccessToken(data.result.accessToken)
          return data.result.accessToken
        })
        .finally(() => {
          refreshRequest = null
        })

      const accessToken = await refreshRequest
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)
      config.headers = headers

      return client(config)
    } catch (refreshError) {
      removeAccessToken()
      return Promise.reject(refreshError)
    }
  })

  client.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)))

  return client
}

export const httpClient = createHttpClient()
