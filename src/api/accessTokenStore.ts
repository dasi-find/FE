type TokenListener = (accessToken: string | null) => void

let accessToken: string | null = null
const listeners = new Set<TokenListener>()

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(nextAccessToken: string) {
  accessToken = nextAccessToken
  notify()
}

export function clearAccessToken() {
  accessToken = null
  notify()
}

export function subscribeAccessToken(listener: TokenListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  listeners.forEach((listener) => listener(accessToken))
}
