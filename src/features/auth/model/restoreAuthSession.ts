import { setAccessToken } from '../../../api/accessTokenStore'
import { fetchCurrentUser, refreshAccessToken } from '../api/authApi'
import { clearAuthSession, getAuthSessionStatus, saveRestoredAuthSession } from './authSessionStore'

let restoreRequest: Promise<void> | null = null

export function restoreAuthSession() {
  restoreRequest ??= requestSessionRestore().finally(() => {
    restoreRequest = null
  })

  return restoreRequest
}

async function requestSessionRestore() {
  try {
    const tokenResult = await refreshAccessToken()
    if (getAuthSessionStatus() !== 'checking') return

    setAccessToken(tokenResult.accessToken)
    const user = await fetchCurrentUser()
    if (getAuthSessionStatus() !== 'checking') return

    saveRestoredAuthSession(user, tokenResult.accessToken)
  } catch {
    if (getAuthSessionStatus() === 'checking') {
      clearAuthSession()
    }
  }
}
