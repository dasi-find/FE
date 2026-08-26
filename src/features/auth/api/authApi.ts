import { httpClient } from '../../../api/httpClient'
import type { ApiResponse } from '../../../api/types'

export type AuthUser = {
  id: number
  email: string
  name: string
}

export type AuthResult = {
  user: AuthUser
  accessToken: string
  accessTokenExpiresInSeconds: number
  refreshToken?: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = LoginRequest & {
  verificationToken: string
  name: string
  agreements: {
    terms: boolean
    privacy: boolean
    emailNotification: boolean
  }
}

export type EmailVerificationSendResult = {
  verificationId: string
  expiresInSeconds: number
}

export type EmailVerificationConfirmResult = {
  verificationToken: string
  verifiedEmail: string
}

export async function login(request: LoginRequest) {
  const { data } = await httpClient.post<ApiResponse<AuthResult>>('/v1/auth/login', request)
  return data.result
}

export async function signup(request: SignupRequest) {
  const { data } = await httpClient.post<ApiResponse<AuthResult>>('/v1/auth/signup', request)
  return data.result
}

export async function sendEmailVerification(email: string) {
  const { data } = await httpClient.post<ApiResponse<EmailVerificationSendResult>>(
    '/v1/auth/email-verifications',
    { email },
  )
  return data.result
}

export async function confirmEmailVerification(verificationId: string, verificationCode: string) {
  const { data } = await httpClient.post<ApiResponse<EmailVerificationConfirmResult>>(
    `/v1/auth/email-verifications/${encodeURIComponent(verificationId)}/confirm`,
    { verificationCode },
  )
  return data.result
}
