import {
  clearAccessToken,
  setAccessToken,
  subscribeAccessToken,
} from '../../../api/accessTokenStore'
import type { AuthResult, AuthUser } from '../api/authApi'

type UserListener = () => void
export type AuthSessionStatus = 'checking' | 'authenticated' | 'anonymous'

let currentUser: AuthUser | null = null
let authSessionStatus: AuthSessionStatus = 'checking'
const listeners = new Set<UserListener>()

subscribeAccessToken((accessToken) => {
  if (!accessToken && authSessionStatus === 'authenticated') {
    currentUser = null
    authSessionStatus = 'anonymous'
    notify()
  }
})

export function getCurrentUser() {
  return currentUser
}

export function getAuthSessionStatus() {
  return authSessionStatus
}

export function beginAuthSessionRestore() {
  currentUser = null
  authSessionStatus = 'checking'
  clearAccessToken()
  notify()
}

export function saveAuthSession(result: AuthResult) {
  currentUser = result.user
  setAccessToken(result.accessToken)
  authSessionStatus = 'authenticated'
  notify()
}

export function saveRestoredAuthSession(user: AuthUser, accessToken: string) {
  currentUser = user
  setAccessToken(accessToken)
  authSessionStatus = 'authenticated'
  notify()
}

export function updateCurrentUser(user: AuthUser) {
  currentUser = user
  notify()
}

export function clearAuthSession() {
  currentUser = null
  authSessionStatus = 'anonymous'
  clearAccessToken()
  notify()
}

export function subscribeCurrentUser(listener: UserListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const subscribeAuthSession = subscribeCurrentUser

function notify() {
  listeners.forEach((listener) => listener())
}
