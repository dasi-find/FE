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
          ●
          {unreadNotificationCount > 0 && (
            <b>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</b>
          )}
        </span>
        알림
      </Link>
    </nav>
  )
}
