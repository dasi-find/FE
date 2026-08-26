import { useSyncExternalStore, type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getAccessToken, subscribeAccessToken } from '../../../api/accessTokenStore'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const accessToken = useSyncExternalStore(subscribeAccessToken, getAccessToken, getAccessToken)
  const location = useLocation()

  if (!accessToken) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return children
}
