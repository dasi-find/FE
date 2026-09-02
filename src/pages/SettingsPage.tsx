import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { clearAccessToken } from '../api/accessTokenStore'
import { logout } from '../features/auth/api/authApi'
import { HomeBottomNavigation } from '../features/home/components/HomeBottomNavigation'

export function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAccessToken()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return (
    <main className="settings-shell">
      <section className="settings-screen">
        <header className="settings-header">
          <strong>설정</strong>
        </header>

        <div className="settings-content">
          <div className="settings-intro">
            <p>ACCOUNT &amp; APP</p>
            <h1>내 계정과 알림을 관리해요.</h1>
          </div>

          <section className="settings-section" aria-labelledby="settings-account-title">
            <h2 id="settings-account-title">계정</h2>
            <div className="settings-list">
              <Link to="/profile">
                <span aria-hidden="true">나</span>
                <strong>마이페이지</strong>
                <small>이름과 이메일 정보 관리</small>
                <i aria-hidden="true">›</i>
              </Link>
              <Link to="/profile#notification-settings">
                <span aria-hidden="true">!</span>
                <strong>알림 설정</strong>
                <small>이메일 알림 수신 여부 변경</small>
                <i aria-hidden="true">›</i>
              </Link>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="settings-service-title">
            <h2 id="settings-service-title">서비스</h2>
            <div className="settings-list">
              <Link to="/notifications">
                <span aria-hidden="true">●</span>
                <strong>알림함</strong>
                <small>새 후보와 수색 소식 확인</small>
                <i aria-hidden="true">›</i>
              </Link>
            </div>
          </section>

          {logoutMutation.isError && (
            <p className="settings-error" role="alert">
              로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}
          <button
            className="settings-logout"
            type="button"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>

        <HomeBottomNavigation active="settings" />
      </section>
    </main>
  )
}
