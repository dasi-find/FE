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
          <p className="landing-eyebrow">잃어버린 물건을 다시 만나는 방법</p>
          <h1>
            찾는 건 AI가.
            <br />
            확인은 당신이.
          </h1>
          <p className="landing-description">
            잃어버린 물건의 특징을 한 번 등록하면 새롭게 접수되는 경찰 습득물과 계속 비교해 드려요.
          </p>

          <ol className="landing-steps" aria-label="이용 방법">
            <li>
              <b>1</b>
              <span>잃어버린 물건 등록</span>
            </li>
            <li>
              <b>2</b>
              <span>경찰 습득물과 비교</span>
            </li>
            <li>
              <b>3</b>
              <span>가능성 높은 후보 확인</span>
            </li>
          </ol>
        </div>

        <footer className="landing-actions">
          <Link className="landing-button landing-button-primary" to="/login">
            시작하기
          </Link>
          <Link className="landing-button landing-button-secondary" to="/signup">
            이메일로 회원가입
          </Link>
          <p className="landing-notice">
            경찰청 습득물 정보를 바탕으로 확인할 후보를 정리해 드려요.
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
