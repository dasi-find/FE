import { Link } from 'react-router-dom'

type HomeBottomNavigationProps = {
  unreadNotificationCount: number
}

export function HomeBottomNavigation({ unreadNotificationCount }: HomeBottomNavigationProps) {
  return (
    <nav className="home-bottom-nav" aria-label="주요 메뉴">
      <Link className="home-nav-item is-active" to="/home" aria-current="page">
        <span aria-hidden="true">⌂</span>홈
      </Link>
      <Link className="home-nav-item" to="/search-cards/new">
        <span aria-hidden="true">＋</span>
        수색
      </Link>
      <Link className="home-nav-item" to="/home#active-search-title">
        <span aria-hidden="true">≋</span>
        후보
      </Link>
      <Link className="home-nav-item" to="/notifications">
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
