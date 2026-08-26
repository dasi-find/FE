import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'

import { getHomeSummary } from '../features/home/api/homeApi'
import { HomeBottomNavigation } from '../features/home/components/HomeBottomNavigation'
import { getCurrentUser, subscribeCurrentUser } from '../features/auth/model/authSessionStore'

export function HomePage() {
  const currentUser = useSyncExternalStore(subscribeCurrentUser, getCurrentUser, getCurrentUser)
  const homeQuery = useQuery({ queryKey: ['home-summary'], queryFn: getHomeSummary })

  return (
    <main className="home-shell">
      <section className="home-screen">
        <header className="home-header">
          <Link className="home-brand" to="/home" aria-label="다시찾음 홈">
            <span className="landing-logo home-logo" aria-hidden="true">
              <i />
              <b />
              <span />
            </span>
            <strong>다시찾음</strong>
          </Link>
          <Link className="home-notification" to="/notifications" aria-label="알림 목록">
            ♢
            {(homeQuery.data?.unreadNotificationCount ?? 0) > 0 && (
              <span>{formatBadge(homeQuery.data?.unreadNotificationCount ?? 0)}</span>
            )}
          </Link>
        </header>

        <div className="home-content">
          <div className="home-intro">
            <p>안녕하세요, {currentUser?.name ?? '사용자'}님</p>
            <h1>오늘도 찾고 있어요.</h1>
          </div>

          <Link className="home-start-button" to="/search-cards/new">
            <span aria-hidden="true">＋</span>새 수색 시작하기
          </Link>

          {homeQuery.isPending && <HomeLoading />}
          {homeQuery.isError && (
            <HomeError
              message={getErrorMessage(homeQuery.error)}
              isRetrying={homeQuery.isFetching}
              onRetry={() => homeQuery.refetch()}
            />
          )}
          {homeQuery.data && (
            <>
              <section className="home-section" aria-labelledby="active-search-title">
                <div className="home-section-heading">
                  <h2 id="active-search-title">진행 중인 수색</h2>
                  {homeQuery.data.activeSearchCards.length > 0 && (
                    <Link to="/search-cards">전체보기</Link>
                  )}
                </div>

                {homeQuery.data.activeSearchCards.length === 0 ? (
                  <HomeEmpty
                    title="진행 중인 수색이 없어요."
                    description="잃어버린 물건을 등록하면 새로운 경찰 습득물과 계속 비교해 드려요."
                    actionLabel="첫 수색 시작하기"
                    actionTo="/search-cards/new"
                  />
                ) : (
                  <div className="home-card-list">
                    {homeQuery.data.activeSearchCards.map((searchCard) => (
                      <Link
                        className="search-summary-card"
                        key={searchCard.id}
                        to={`/search-cards/${searchCard.id}`}
                      >
                        <div className="search-summary-top">
                          <span className="home-badge">
                            수색 중 · {formatDaysRemaining(searchCard.daysRemaining)}
                          </span>
                          <span aria-hidden="true">›</span>
                        </div>
                        <h3>{searchCard.itemName}</h3>
                        <p>
                          {formatLostDate(searchCard.lostDate)} · {searchCard.lostPlaceName}
                        </p>
                        <div className="search-summary-score">
                          <span>최고 적합도</span>
                          <strong>
                            {searchCard.bestCandidateScore === null
                              ? '아직 없음'
                              : `${formatScore(searchCard.bestCandidateScore)}점`}
                          </strong>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="home-section" aria-labelledby="new-candidate-title">
                <div className="home-section-heading">
                  <h2 id="new-candidate-title">새로운 후보</h2>
                  {homeQuery.data.newCandidates.length > 0 && (
                    <Link to="/candidates">{homeQuery.data.newCandidates.length}개 보기</Link>
                  )}
                </div>

                {homeQuery.data.newCandidates.length === 0 ? (
                  <HomeEmpty
                    title="새 후보를 계속 찾고 있어요."
                    description="조건에 맞는 경찰 습득물이 들어오면 바로 알려드릴게요."
                  />
                ) : (
                  <div className="home-card-list">
                    {homeQuery.data.newCandidates.map((candidate) => (
                      <Link
                        className="candidate-summary-card"
                        key={candidate.id}
                        to={`/candidates/${candidate.id}`}
                      >
                        <span className="candidate-thumbnail" aria-hidden="true">
                          ▰
                        </span>
                        <span className="candidate-copy">
                          {candidate.isNew && <span className="home-badge is-dark">NEW</span>}
                          <strong>{candidate.itemName}</strong>
                          <small>{candidate.storagePlace}</small>
                        </span>
                        <span
                          className="candidate-score"
                          aria-label={`적합도 ${formatScore(candidate.totalScore)}점`}
                        >
                          {formatScore(candidate.totalScore)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <HomeBottomNavigation
          unreadNotificationCount={homeQuery.data?.unreadNotificationCount ?? 0}
        />
      </section>
    </main>
  )
}

function HomeLoading() {
  return (
    <div className="home-loading" aria-label="홈 정보를 불러오는 중" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function HomeError({
  message,
  isRetrying,
  onRetry,
}: {
  message: string
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <div className="home-state-card" role="alert">
      <span className="home-state-symbol" aria-hidden="true">
        !
      </span>
      <h2>홈 정보를 불러오지 못했어요.</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? '다시 불러오는 중...' : '다시 시도'}
      </button>
    </div>
  )
}

function HomeEmpty({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="home-empty-card">
      <span aria-hidden="true">⌕</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo && <Link to={actionTo}>{actionLabel}</Link>}
    </div>
  )
}

function formatDaysRemaining(daysRemaining: number) {
  if (daysRemaining <= 0) return 'D-DAY'
  return `D-${daysRemaining}`
}

function formatLostDate(date: string) {
  const [, month, day] = date.split('-').map(Number)
  if (!month || !day) return date
  return `${month}월 ${day}일`
}

function formatScore(score: number) {
  return Math.round(score)
}

function formatBadge(count: number) {
  return count > 99 ? '99+' : count
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'
}
