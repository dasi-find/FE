import { httpClient } from '../../../api/httpClient'
import type { ApiResponse } from '../../../api/types'

export type UserProfile = {
  id: number
  email: string
  name: string
  emailNotificationEnabled: boolean
}

export type UpdateUserProfileRequest = {
  name: string
  emailNotificationEnabled: boolean
}

export async function getMyProfile() {
  const { data } = await httpClient.get<ApiResponse<UserProfile>>('/v1/users/me')
  return data.result
}

export async function updateMyProfile(request: UpdateUserProfileRequest) {
  const { data } = await httpClient.patch<ApiResponse<UserProfile>>('/v1/users/me', request)
  return data.result
}
