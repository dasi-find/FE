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
          <div className="home-header-actions">
            <Link className="home-profile" to="/profile" aria-label="마이페이지">
              {currentUser?.name.trim().charAt(0) || '나'}
            </Link>
          </div>
        </header>

        <div className="home-content">
          <div className="home-intro">
            <p>안녕하세요, {currentUser?.name ?? '사용자'}님</p>
            <h1>확인할 소식부터 볼게요.</h1>
          </div>

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
              {homeQuery.data.newCandidates.some((candidate) => candidate.isNew) ? (
                <section className="home-section" aria-labelledby="new-candidate-title">
                  <div className="home-section-heading">
                    <h2 id="new-candidate-title">먼저 확인해 보세요</h2>
                  </div>
                  {homeQuery.data.newCandidates
                    .filter((candidate) => candidate.isNew)
                    .slice(0, 1)
                    .map((candidate) => (
                      <Link
                        className="home-featured-candidate"
                        key={candidate.id}
                        to={`/candidates/${candidate.id}`}
                      >
                        <span>새 후보</span>
                        <h3>{candidate.itemName}</h3>
                        <p>{candidate.storagePlace}에서 보관 중이에요.</p>
                        <div>
                          <small>적합도</small>
                          <strong>{formatScore(candidate.totalScore)}점</strong>
                        </div>
                        <b>후보 확인하기</b>
                      </Link>
                    ))}
                </section>
              ) : (
                homeQuery.data.activeSearchCards.length > 0 && (
                  <div className="home-monitoring-card">
                    <span aria-hidden="true">⌕</span>
                    <div>
                      <h2>새로운 후보를 확인하고 있어요.</h2>
                      <p>후보가 발견되면 알림으로 바로 알려드릴게요.</p>
                    </div>
                  </div>
                )
              )}

              <section className="home-section" aria-labelledby="active-search-title">
                <div className="home-section-heading">
                  <h2 id="active-search-title">진행 중인 수색</h2>
                  <Link to="/search-cards">전체보기</Link>
                </div>

                {homeQuery.data.activeSearchCards.length === 0 ? (
                  <HomeEmpty
                    title="진행 중인 수색이 없어요."
                    description="수색 탭에서 잃어버린 물건을 등록하면 이곳에 진행 상황이 표시돼요."
                  />
                ) : (
                  <div className="home-card-list">
                    {homeQuery.data.activeSearchCards.slice(0, 2).map((searchCard) => {
                      const newCandidateCount = homeQuery.data.newCandidates.filter(
                        (candidate) => candidate.searchCardId === searchCard.id && candidate.isNew,
                      ).length

                      return (
                        <Link
                          className="search-summary-card"
                          key={searchCard.id}
                          to={`/search-cards/${searchCard.id}/candidates`}
                        >
                          <div className="search-summary-top">
                            <span className="home-badge">
                              수색 중 · {formatDaysRemaining(searchCard.daysRemaining)}
                            </span>
                            <span className="search-summary-action">
                              {newCandidateCount > 0 && (
                                <b aria-label={`새 후보 ${newCandidateCount}개`}>!</b>
                              )}
                              <i aria-hidden="true">›</i>
                            </span>
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
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <HomeBottomNavigation
          active="home"
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

function HomeEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="home-empty-card">
      <span aria-hidden="true">⌕</span>
      <h3>{title}</h3>
      <p>{description}</p>
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'
}
