import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">AI 기반 분실물 후보 매칭</span>
        <h1>다시찾음</h1>
        <p>새롭게 등록되는 경찰 습득물 중 현재까지 가장 유사한 후보를 지속적으로 찾아드려요.</p>
        <div className="button-row">
          <Link className="primary-button" to="/login">
            로그인
          </Link>
          <Link className="secondary-button" to="/signup">
            회원가입
          </Link>
        </div>
        <small>후보 적합도는 참고 점수이며, 소유권을 확정하지 않습니다.</small>
      </section>
    </main>
  )
}
