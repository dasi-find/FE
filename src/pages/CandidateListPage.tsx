import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { getCandidates } from '../features/candidate/api/candidateApi'

export function CandidateListPage() {
  const { searchCardId } = useParams()
  const parsedSearchCardId = Number(searchCardId)
  const candidateQuery = useQuery({
    queryKey: ['candidates', parsedSearchCardId],
    queryFn: () => getCandidates(parsedSearchCardId),
    enabled: Number.isSafeInteger(parsedSearchCardId) && parsedSearchCardId > 0,
  })

  if (!Number.isSafeInteger(parsedSearchCardId) || parsedSearchCardId <= 0) {
    return <CandidateState title="잘못된 수색카드예요." description="홈에서 다시 선택해 주세요." />
  }

  return (
    <main className="candidate-shell">
      <section className="candidate-screen">
        <CandidateHeader backTo="/home" title="후보 목록" />
        <div className="candidate-page-content">
          <div className="candidate-page-intro">
            <p>MATCH CANDIDATES</p>
            <h1>
              발견한 후보를
              <br />
              확인해 보세요.
            </h1>
            <span>낮은 적합도부터 차례로 보여드려요.</span>
          </div>

          {candidateQuery.isPending && <CandidateLoading />}
          {candidateQuery.isError && (
            <CandidateState
              title="후보를 불러오지 못했어요."
              description={getErrorMessage(candidateQuery.error)}
              actionLabel={candidateQuery.isFetching ? '불러오는 중...' : '다시 시도'}
              onAction={() => candidateQuery.refetch()}
              disabled={candidateQuery.isFetching}
            />
          )}
          {candidateQuery.data?.length === 0 && (
            <CandidateState
              title="아직 찾은 후보가 없어요."
              description="새로운 경찰 습득물이 등록되면 다시 비교해서 알려드릴게요."
            />
          )}
          {candidateQuery.data && candidateQuery.data.length > 0 && (
            <div className="candidate-list" aria-label="후보 목록">
              {candidateQuery.data.map((candidate) => (
                <Link
                  className="candidate-list-card"
                  key={candidate.candidateId}
                  to={`/candidates/${candidate.candidateId}`}
                >
                  <CandidateImage imageUrl={candidate.imageUrl} itemName={candidate.itemName} />
                  <div className="candidate-list-copy">
                    <div className="candidate-list-badges">
                      {candidate.isNew && <span className="candidate-new-badge">!</span>}
                      <span>#{candidate.rank}</span>
                    </div>
                    <h2>{candidate.itemName}</h2>
                    <p>{candidate.storagePlace}</p>
                    <small>{formatDate(candidate.foundDate)} 습득</small>
                    {candidate.reasons[0] && <strong>{candidate.reasons[0]}</strong>}
                  </div>
                  <ScoreRing score={candidate.totalScore} />
                </Link>
              ))}
            </div>
          )}
          <p className="candidate-score-notice">
            적합도는 입력 정보와 경찰 습득물의 유사성을 나타내는 비교 점수이며, 소유권을 확정하는
            확률이 아니에요.
          </p>
        </div>
      </section>
    </main>
  )
}

export function CandidateHeader({ backTo, title }: { backTo: string; title: string }) {
  return (
    <header className="candidate-header">
      <Link to={backTo} aria-label="이전 화면">
        ‹
      </Link>
      <strong>{title}</strong>
      <span />
    </header>
  )
}

export function CandidateImage({
  imageUrl,
  itemName,
}: {
  imageUrl: string | null
  itemName: string
}) {
  return imageUrl ? (
    <img className="candidate-item-image" src={imageUrl} alt={`${itemName} 습득물`} />
  ) : (
    <span className="candidate-item-image is-empty" aria-label="등록된 사진 없음">
      ⌕
    </span>
  )
}

export function ScoreRing({ score }: { score: number }) {
  return (
    <span className="candidate-score-ring" aria-label={`적합도 ${formatScore(score)}점`}>
      <strong>{formatScore(score)}</strong>
      <small>점</small>
    </span>
  )
}

export function CandidateState({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  disabled?: boolean
}) {
  return (
    <div className="candidate-state" role={onAction ? 'alert' : undefined}>
      <span aria-hidden="true">!</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} disabled={disabled}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function CandidateLoading() {
  return (
    <div className="candidate-page-loading" aria-label="후보를 불러오는 중" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  )
}

function formatScore(score: number) {
  return Math.round(score)
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'
}
