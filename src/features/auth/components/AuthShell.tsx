import type { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthShellProps = PropsWithChildren<{
  eyebrow: string
  title: ReactNode
  description: string
}>

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-screen">
        <header className="auth-topbar">
          <Link className="auth-back" to="/" aria-label="랜딩으로 돌아가기">
            ‹
          </Link>
          <Link className="auth-brand" to="/" aria-label="다시찾음 홈">
            <span className="landing-logo auth-logo" aria-hidden="true">
              <i />
              <b />
              <span />
            </span>
            <strong>다시찾음</strong>
          </Link>
          <span className="auth-topbar-spacer" />
        </header>

        <div className="auth-intro">
          <p className="landing-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {children}
      </section>
    </main>
  )
}
