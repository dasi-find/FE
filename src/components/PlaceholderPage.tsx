import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PlaceholderPageProps = {
  title: string
  description: string
  action?: ReactNode
}

export function PlaceholderPage({ title, description, action }: PlaceholderPageProps) {
  return (
    <main className="page-shell">
      <section className="placeholder-card">
        <Link className="brand-link" to="/">
          다시찾음
        </Link>
        <h1>{title}</h1>
        <p>{description}</p>
        {action}
      </section>
    </main>
  )
}
