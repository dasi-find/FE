import { Link } from 'react-router-dom'

type HomeBottomNavigationProps = {
  active?: 'home' | 'search' | 'settings'
}

export function HomeBottomNavigation({ active }: HomeBottomNavigationProps) {
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
        className={`home-nav-item ${active === 'settings' ? 'is-active' : ''}`}
        to="/settings"
        aria-current={active === 'settings' ? 'page' : undefined}
      >
        <span aria-hidden="true">⚙</span>
        설정
      </Link>
    </nav>
  )
}
