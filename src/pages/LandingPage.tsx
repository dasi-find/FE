import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <main className="landing-shell">
      <section className="landing-screen">
        <header className="landing-brand" aria-label="다시찾음">
          <LogoMark />
          <strong>다시찾음</strong>
        </header>

        <div className="landing-hero">
          <div className="landing-symbol" aria-hidden="true">
            <span className="landing-radar radar-one" />
            <span className="landing-radar radar-two" />
            <span className="landing-object">▰</span>
            <span className="landing-match">82</span>
          </div>
          <p className="landing-eyebrow">AI LOST &amp; FOUND</p>
          <h1>
            찾는 건 AI가.
            <br />
            확인은 당신이.
          </h1>
          <p className="landing-description">
            잃어버린 물건의 특징을 한 번 등록하면 새롭게 접수되는 경찰 습득물과 계속 비교해 드려요.
          </p>
        </div>

        <footer className="landing-actions">
          <Link className="landing-button landing-button-primary" to="/login">
            시작하기
          </Link>
          <Link className="landing-button landing-button-secondary" to="/signup">
            이메일로 회원가입
          </Link>
          <p className="landing-notice">
            후보 적합도는 확인 가치를 나타내는 참고 점수이며, 소유권을 확정하지 않습니다.
          </p>
        </footer>
      </section>
    </main>
  )
}

function LogoMark() {
  return (
    <span className="landing-logo" aria-hidden="true">
      <i />
      <b />
      <span />
    </span>
  )
}
