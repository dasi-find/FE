import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { HomeBottomNavigation } from '../features/home/components/HomeBottomNavigation'
import {
  getSearchCards,
  type SearchCardListFilter,
  type SearchCardStatus,
} from '../features/searchCard/api/searchCardApi'

const filters: Array<{ value: SearchCardListFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '수색 중' },
  { value: 'FOUND', label: '찾음' },
  { value: 'CLOSED', label: '종료' },
  { value: 'EXPIRED', label: '기간 만료' },
]

const statusLabels: Record<SearchCardStatus, string> = {
  DRAFT: '작성 중',
  ANALYZING: '분석 중',
  ACTIVE: '수색 중',
  FOUND: '찾음',
  CLOSED: '종료',
  EXPIRED: '기간 만료',
}

export function SearchCardListPage() {
  const [filter, setFilter] = useState<SearchCardListFilter>('ALL')
  const [page, setPage] = useState(0)
  const searchCardsQuery = useQuery({
    queryKey: ['search-cards', filter, page],
    queryFn: () => getSearchCards({ status: filter, page }),
  })

  const selectFilter = (nextFilter: SearchCardListFilter) => {
    setFilter(nextFilter)
    setPage(0)
  }

  return (
    <main className="search-card-list-shell">
      <section className="search-card-list-screen">
        <header className="search-card-list-header">
          <Link to="/home" aria-label="홈으로 돌아가기">
            ‹
          </Link>
          <strong>내 수색</strong>
          <Link to="/search-cards/new" aria-label="새 수색 추가">
            ＋
          </Link>
        </header>

        <div className="search-card-list-content">
          <div className="search-card-list-intro">
            <p>SEARCH ARCHIVE</p>
            <h1>내 수색카드</h1>
            <span>등록한 분실물과 수색 상태를 한눈에 확인해요.</span>
          </div>

          <div className="search-card-filters" aria-label="수색 상태 필터">
            {filters.map(({ value, label }) => (
              <button
                className={filter === value ? 'is-active' : ''}
                type="button"
                key={value}
                aria-pressed={filter === value}
                onClick={() => selectFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {searchCardsQuery.isPending && (
            <div className="search-card-list-loading" aria-label="수색카드를 불러오는 중">
              <span />
              <span />
              <span />
            </div>
          )}

          {searchCardsQuery.isError && (
            <div className="search-card-list-state" role="alert">
              <strong>수색카드를 불러오지 못했어요.</strong>
              <p>잠시 후 다시 시도해 주세요.</p>
              <button
                type="button"
                disabled={searchCardsQuery.isFetching}
                onClick={() => searchCardsQuery.refetch()}
              >
                {searchCardsQuery.isFetching ? '불러오는 중...' : '다시 시도'}
              </button>
            </div>
          )}

          {searchCardsQuery.data && searchCardsQuery.data.content.length === 0 && (
            <div className="search-card-list-state is-empty">
              <span aria-hidden="true">⌕</span>
              <strong>해당하는 수색카드가 없어요.</strong>
              <p>새 수색을 시작하면 이곳에서 진행 상태를 확인할 수 있어요.</p>
              <Link to="/search-cards/new">새 수색 시작하기</Link>
            </div>
          )}

          {searchCardsQuery.data && searchCardsQuery.data.content.length > 0 && (
            <>
              <div className="search-card-list">
                {searchCardsQuery.data.content.map((searchCard) => (
                  <Link
                    className="search-card-list-item"
                    key={searchCard.id}
                    to={`/search-cards/${searchCard.id}/candidates`}
                  >
                    <div className="search-card-list-image">
                      {searchCard.imageUrl ? (
                        <img src={searchCard.imageUrl} alt="" />
                      ) : (
                        <span aria-hidden="true">⌕</span>
                      )}
                      {searchCard.unreadCandidateCount > 0 && (
                        <b aria-label={`미확인 후보 ${searchCard.unreadCandidateCount}개`}>
                          {searchCard.unreadCandidateCount > 99
                            ? '99+'
                            : searchCard.unreadCandidateCount}
                        </b>
                      )}
                    </div>
                    <div className="search-card-list-copy">
                      <span>{statusLabels[searchCard.status]}</span>
                      <h2>{searchCard.itemName}</h2>
                      <p>
                        {formatDate(searchCard.lostDate)} · {searchCard.lostPlaceName}
                      </p>
                      <small>{formatExpiration(searchCard.searchExpiresAt)}</small>
                    </div>
                    <div className="search-card-list-score">
                      <span>최고 적합도</span>
                      <strong>
                        {searchCard.bestCandidateScore === null
                          ? '—'
                          : `${Math.round(searchCard.bestCandidateScore)}점`}
                      </strong>
                      <i aria-hidden="true">›</i>
                    </div>
                  </Link>
                ))}
              </div>

              <nav className="search-card-pagination" aria-label="수색카드 페이지">
                <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  이전
                </button>
                <span>{page + 1}페이지</span>
                <button
                  type="button"
                  disabled={!searchCardsQuery.data.hasNext}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </button>
              </nav>
            </>
          )}
        </div>

        <HomeBottomNavigation active="search" />
      </section>
    </main>
  )
}

function formatDate(date: string) {
  const [, month, day] = date.split('-').map(Number)
  if (!month || !day) return date
  return `${month}월 ${day}일`
}

function formatExpiration(searchExpiresAt: string | null) {
  if (!searchExpiresAt) return '수색 만료일 없음'
  const date = searchExpiresAt.slice(0, 10)
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return `만료 ${searchExpiresAt}`
  return `만료 ${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}
