import { useSyncExternalStore, type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getAuthSessionStatus, subscribeAuthSession } from '../model/authSessionStore'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const authSessionStatus = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionStatus,
    getAuthSessionStatus,
  )
  const location = useLocation()

  if (authSessionStatus === 'checking') {
    return (
      <main className="auth-session-loading" role="status">
        <span aria-hidden="true" />
        <p>로그인 상태를 확인하고 있어요.</p>
      </main>
    )
  }

  if (authSessionStatus === 'anonymous') {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return children
}
