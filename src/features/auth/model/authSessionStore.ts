import { setAccessToken, subscribeAccessToken } from '../../../api/accessTokenStore'
import type { AuthResult, AuthUser } from '../api/authApi'

type UserListener = () => void

let currentUser: AuthUser | null = null
const listeners = new Set<UserListener>()

subscribeAccessToken((accessToken) => {
  if (!accessToken && currentUser) {
    currentUser = null
    notify()
  }
})

export function getCurrentUser() {
  return currentUser
}

export function saveAuthSession(result: AuthResult) {
  currentUser = result.user
  setAccessToken(result.accessToken)
  notify()
}

export function subscribeCurrentUser(listener: UserListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}
