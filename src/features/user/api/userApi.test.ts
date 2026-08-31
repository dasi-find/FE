import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '../../../api/httpClient'
import { getMyProfile, updateMyProfile, type UserProfile } from './userApi'

vi.mock('../../../api/httpClient', () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}))

const mockedGet = vi.mocked(httpClient.get)
const mockedPatch = vi.mocked(httpClient.patch)

const profile: UserProfile = {
  id: 7,
  email: 'hello@example.com',
  name: '민준',
  emailNotificationEnabled: true,
}

describe('userApi', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPatch.mockReset()
  })

  it('현재 사용자 정보를 조회한다', async () => {
    mockedGet.mockResolvedValue({
      data: { isSuccess: true, code: 'COMMON2001', message: '성공', result: profile },
    })

    await expect(getMyProfile()).resolves.toEqual(profile)
    expect(mockedGet).toHaveBeenCalledWith('/v1/users/me')
  })

  it('표시명과 이메일 알림 설정을 수정한다', async () => {
    const request = { name: '새 이름', emailNotificationEnabled: false }
    mockedPatch.mockResolvedValue({
      data: {
        isSuccess: true,
        code: 'COMMON2001',
        message: '성공',
        result: { ...profile, ...request },
      },
    })

    await expect(updateMyProfile(request)).resolves.toMatchObject(request)
    expect(mockedPatch).toHaveBeenCalledWith('/v1/users/me', request)
  })
})
