import { useEffect, type PropsWithChildren } from 'react'

import { restoreAuthSession } from '../model/restoreAuthSession'

export function AuthSessionProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void restoreAuthSession()
  }, [])

  return children
}
