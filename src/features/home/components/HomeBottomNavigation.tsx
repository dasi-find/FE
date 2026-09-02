import { Link } from 'react-router-dom'

type HomeBottomNavigationProps = {
  active?: 'home' | 'search' | 'notifications'
  unreadNotificationCount?: number
}

export function HomeBottomNavigation({
  active,
  unreadNotificationCount = 0,
}: HomeBottomNavigationProps) {
  return (
    <nav className="home-bottom-nav" aria-label="주요 메뉴">
      <Link
        className={`home-nav-item ${active === 'home' ? 'is-active' : ''}`}
        to="/home"
        aria-current={active === 'home' ? 'page' : undefined}
      >
        <span aria-hidden="true">⌂</span>홈
      </Link>
      <Link
        className={`home-nav-item ${active === 'search' ? 'is-active' : ''}`}
        to="/search-cards"
        aria-current={active === 'search' ? 'page' : undefined}
      >
        <span aria-hidden="true">＋</span>
        수색
      </Link>
      <Link
        className={`home-nav-item ${active === 'notifications' ? 'is-active' : ''}`}
        to="/notifications"
        aria-current={active === 'notifications' ? 'page' : undefined}
      >
        <span className="home-nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6.5 10.5c0-3.4 2.1-5.8 5.5-5.8s5.5 2.4 5.5 5.8v3.1l1.4 2.4H5.1l1.4-2.4v-3.1Z" />
            <path d="M9.8 18.2c.5.8 1.2 1.2 2.2 1.2s1.7-.4 2.2-1.2" />
          </svg>
          {unreadNotificationCount > 0 && (
            <b>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</b>
          )}
        </span>
        알림
      </Link>
    </nav>
  )
}
