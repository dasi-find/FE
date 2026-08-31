import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  getSearchCard,
  type SearchCardDetail,
  type SearchCardStatus,
} from '../features/searchCard/api/searchCardApi'

const statusLabels: Record<SearchCardStatus, string> = {
  DRAFT: '작성 중',
  ANALYZING: '분석 중',
  ACTIVE: '수색 중',
  FOUND: '찾음',
  CLOSED: '종료',
  EXPIRED: '기간 만료',
}

export function SearchCardDetailPage() {
  const { searchCardId } = useParams()
  const parsedSearchCardId = Number(searchCardId)
  const isValidId = Number.isSafeInteger(parsedSearchCardId) && parsedSearchCardId > 0
  const searchCardQuery = useQuery({
    queryKey: ['search-card', parsedSearchCardId],
    queryFn: () => getSearchCard(parsedSearchCardId),
    enabled: isValidId,
  })

  return (
    <main className="candidate-shell">
      <section className="candidate-screen">
        <header className="candidate-header">
          <Link to="/search-cards" aria-label="수색카드 목록으로 돌아가기">
            ‹
          </Link>
          <strong>수색카드 상세</strong>
          {isValidId && searchCardQuery.data?.status === 'ACTIVE' ? (
            <Link
              className="search-card-detail-edit-link"
              to={`/search-cards/${parsedSearchCardId}/edit`}
              aria-label="수색카드 수정"
            >
              수정
            </Link>
          ) : (
            <span />
          )}
        </header>

        <div className="candidate-page-content search-card-detail-content">
          {!isValidId && (
            <SearchCardDetailState
              title="잘못된 수색카드예요."
              description="수색카드 목록에서 다시 선택해 주세요."
              listLink
            />
          )}

          {isValidId && searchCardQuery.isPending && (
            <div
              className="search-card-detail-loading"
              aria-label="수색카드 상세를 불러오는 중"
              aria-busy="true"
            >
              <span />
              <span />
              <span />
            </div>
          )}

          {isValidId && searchCardQuery.isError && (
            <SearchCardDetailState
              title="수색카드를 불러오지 못했어요."
              description="잠시 후 다시 시도해 주세요."
              isRetrying={searchCardQuery.isFetching}
              onRetry={() => searchCardQuery.refetch()}
            />
          )}

          {searchCardQuery.data && <SearchCardDetailContent searchCard={searchCardQuery.data} />}
        </div>
      </section>
    </main>
  )
}

function SearchCardDetailContent({ searchCard }: { searchCard: SearchCardDetail }) {
  return (
    <>
      <article className="search-card-detail-hero">
        <div className="search-card-detail-image">
          {searchCard.imageUrls[0] ? (
            <img src={searchCard.imageUrls[0]} alt={`${searchCard.itemName} 대표 사진`} />
          ) : (
            <span aria-hidden="true">⌕</span>
          )}
        </div>
        <div className="search-card-detail-title">
          <span>{statusLabels[searchCard.status]}</span>
          <h1>{searchCard.itemName}</h1>
          <p>
            {formatDate(searchCard.lostDate)} · {searchCard.lostLocation.placeName}
          </p>
        </div>
        <div className="search-card-detail-score">
          <span>최고 적합도</span>
          <strong>
            {searchCard.bestCandidateScore === null
              ? '—'
              : `${Math.round(searchCard.bestCandidateScore)}점`}
          </strong>
        </div>
      </article>

      <div className="search-card-detail-summary">
        <div>
          <span>미확인 후보</span>
          <strong>{searchCard.unreadCandidateCount}개</strong>
        </div>
        <div>
          <span>수색 만료일</span>
          <strong>{formatExpiration(searchCard.searchExpiresAt)}</strong>
        </div>
      </div>

      <Link className="search-card-candidate-link" to={`/search-cards/${searchCard.id}/candidates`}>
        후보 목록 확인하기
        <span aria-hidden="true">›</span>
      </Link>

      <DetailSection number="01" title="기본정보">
        <dl className="search-card-detail-grid">
          <DetailRow label="카테고리" value={searchCard.category} />
          <DetailRow label="색상" value={searchCard.colors.join(' · ') || '정보 없음'} />
          <DetailRow label="브랜드" value={searchCard.brand || '정보 없음'} />
          <DetailRow label="재질" value={searchCard.material || '정보 없음'} />
        </dl>
      </DetailSection>

      <DetailSection number="02" title="분실 정보">
        <dl className="search-card-detail-grid">
          <DetailRow label="날짜" value={formatDate(searchCard.lostDate)} />
          <DetailRow
            label="시간"
            value={formatLostTime(searchCard.lostStartTime, searchCard.lostEndTime)}
          />
          <DetailRow label="장소" value={searchCard.lostLocation.placeName} />
          <DetailRow label="주소" value={searchCard.lostLocation.address} />
        </dl>
        {searchCard.lostLocation.description && (
          <p className="search-card-detail-description">{searchCard.lostLocation.description}</p>
        )}
      </DetailSection>

      <DetailSection number="03" title="기억나는 특징">
        <p className="search-card-detail-description">
          {searchCard.featureDescription || '입력된 특징이 없어요.'}
        </p>
      </DetailSection>

      <DetailSection number="04" title="AI 분석 결과">
        {searchCard.analysis ? (
          <dl className="search-card-detail-grid">
            <DetailRow label="분석 종류" value={searchCard.analysis.itemName} />
            <DetailRow
              label="분석 색상"
              value={searchCard.analysis.colors.join(' · ') || '정보 없음'}
            />
            <DetailRow
              label="추출 특징"
              value={searchCard.analysis.features.join(' · ') || '정보 없음'}
            />
            <DetailRow label="추출 문자" value={searchCard.analysis.ocrText || '정보 없음'} />
          </dl>
        ) : (
          <p className="search-card-detail-description">저장된 AI 분석 결과가 없어요.</p>
        )}
      </DetailSection>
    </>
  )
}

function DetailSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="search-card-detail-section">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function SearchCardDetailState({
  title,
  description,
  isRetrying = false,
  onRetry,
  listLink = false,
}: {
  title: string
  description: string
  isRetrying?: boolean
  onRetry?: () => void
  listLink?: boolean
}) {
  return (
    <div className="search-card-detail-state" role="alert">
      <span aria-hidden="true">!</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {onRetry && (
        <button type="button" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? '불러오는 중...' : '다시 시도'}
        </button>
      )}
      {listLink && <Link to="/search-cards">목록으로 돌아가기</Link>}
    </div>
  )
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return `${year}년 ${month}월 ${day}일`
}

function formatLostTime(start: string | null, end: string | null) {
  if (!start && !end) return '시간 미상'
  if (start && end) return `${start.slice(0, 5)} ~ ${end.slice(0, 5)}`
  return (start ?? end)?.slice(0, 5) ?? '시간 미상'
}

function formatExpiration(searchExpiresAt: string | null) {
  if (!searchExpiresAt) return '없음'
  return searchExpiresAt.slice(0, 10).replaceAll('-', '.')
}
