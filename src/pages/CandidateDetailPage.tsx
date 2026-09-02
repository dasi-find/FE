import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import {
  getCandidateDetail,
  markCandidateViewed,
  submitCandidateFeedback,
  type CandidateDetail,
  type CandidateFeedbackValue,
} from '../features/candidate/api/candidateApi'
import { CandidateHeader, CandidateImage, CandidateState, ScoreRing } from './CandidateListPage'

const scoreLabels: Array<[keyof CandidateDetail['scores'], string]> = [
  ['imageScore', '이미지'],
  ['textScore', '특징 설명'],
  ['attributeScore', '색상·속성'],
  ['timeScore', '분실·습득 시점'],
  ['stationProximityScore', '보관기관 근접도'],
]

const feedbackOptions: Array<{
  value: CandidateFeedbackValue
  label: string
  description: string
}> = [
  { value: 'VERY_SIMILAR', label: '많이 비슷해요', description: '우선 확인할 후보로 표시해요.' },
  { value: 'UNSURE', label: '잘 모르겠어요', description: '후보 목록에 그대로 유지해요.' },
  { value: 'NOT_MINE', label: '제 물건이 아니에요', description: '후보 목록에서 제외해요.' },
]

export function CandidateDetailPage() {
  const queryClient = useQueryClient()
  const { candidateId } = useParams()
  const parsedCandidateId = Number(candidateId)
  const candidateQuery = useQuery({
    queryKey: ['candidate', parsedCandidateId],
    queryFn: () => getCandidateDetail(parsedCandidateId),
    enabled: Number.isSafeInteger(parsedCandidateId) && parsedCandidateId > 0,
  })
  const feedbackMutation = useMutation({
    mutationFn: (feedback: CandidateFeedbackValue) =>
      submitCandidateFeedback(parsedCandidateId, feedback),
    onSuccess: async (result) => {
      queryClient.setQueryData<CandidateDetail>(['candidate', parsedCandidateId], (current) =>
        current
          ? { ...current, feedback: result.feedback, isExcluded: result.isExcluded }
          : current,
      )
      if (!candidateQuery.data) return
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['candidates', candidateQuery.data.searchCardId],
        }),
        queryClient.invalidateQueries({ queryKey: ['home-summary'] }),
      ])
    },
  })

  useEffect(() => {
    if (!candidateQuery.data) return
    void markCandidateViewed(parsedCandidateId)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ['home-summary'] }),
          queryClient.invalidateQueries({
            queryKey: ['candidates', candidateQuery.data.searchCardId],
          }),
        ]),
      )
      .catch(() => undefined)
  }, [candidateQuery.data, parsedCandidateId, queryClient])

  if (!Number.isSafeInteger(parsedCandidateId) || parsedCandidateId <= 0) {
    return (
      <CandidateState title="잘못된 후보예요." description="후보 목록에서 다시 선택해 주세요." />
    )
  }

  const candidate = candidateQuery.data

  return (
    <main className="candidate-shell">
      <section className="candidate-screen">
        <CandidateHeader
          backTo={candidate ? `/search-cards/${candidate.searchCardId}/candidates` : '/home'}
          title="후보 상세"
        />
        <div className="candidate-page-content candidate-detail-content">
          {candidateQuery.isPending && (
            <div
              className="candidate-detail-loading"
              aria-label="후보 상세를 불러오는 중"
              aria-busy="true"
            />
          )}
          {candidateQuery.isError && (
            <CandidateState
              title="후보 정보를 불러오지 못했어요."
              description={getErrorMessage(candidateQuery.error)}
              actionLabel={candidateQuery.isFetching ? '불러오는 중...' : '다시 시도'}
              onAction={() => candidateQuery.refetch()}
              disabled={candidateQuery.isFetching}
            />
          )}
          {candidate && (
            <>
              <div className="candidate-detail-hero">
                {candidate.isExcluded && (
                  <span className="candidate-excluded-badge">제외한 후보</span>
                )}
                <CandidateImage
                  imageUrl={candidate.policeItem.imageUrl}
                  itemName={candidate.policeItem.itemName}
                />
                <div>
                  <p>RANK #{candidate.rank}</p>
                  <h1>{candidate.policeItem.itemName}</h1>
                  <span>{candidate.policeItem.storagePlace}</span>
                </div>
                <ScoreRing score={candidate.totalScore} />
              </div>

              <p className="candidate-score-notice">
                이 점수는 소유권 확률이 아니라 입력 정보와 습득물을 비교한 적합도예요.
              </p>

              <DetailSection number="01" title="습득물 정보">
                <dl className="candidate-info-grid">
                  <InfoRow label="습득일" value={formatDate(candidate.policeItem.foundDate)} />
                  <InfoRow label="색상" value={candidate.policeItem.color || '정보 없음'} />
                  <InfoRow label="보관기관" value={candidate.policeItem.storagePlace} />
                  <InfoRow label="관리번호" value={candidate.policeItem.policeManagementNo} />
                </dl>
              </DetailSection>

              <DetailSection number="02" title="추천 근거">
                <ol className="candidate-reason-list">
                  {candidate.reasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>
                      <span>{index + 1}</span>
                      {reason}
                    </li>
                  ))}
                </ol>
              </DetailSection>

              <DetailSection number="03" title="항목별 비교 점수">
                <div className="candidate-score-list">
                  {scoreLabels.map(([key, label]) => (
                    <ScoreBar key={key} label={label} score={candidate.scores[key]} />
                  ))}
                </div>
              </DetailSection>

              <DetailSection number="04" title="이 후보는 어떤가요?">
                <p className="candidate-feedback-description">
                  선택한 피드백은 후보 정리와 추천 개선에 사용돼요.
                </p>
                <div className="candidate-feedback-options">
                  {feedbackOptions.map((option) => (
                    <button
                      className={candidate.feedback === option.value ? 'is-selected' : ''}
                      type="button"
                      key={option.value}
                      aria-pressed={candidate.feedback === option.value}
                      disabled={feedbackMutation.isPending}
                      onClick={() => feedbackMutation.mutate(option.value)}
                    >
                      <span aria-hidden="true" />
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </button>
                  ))}
                </div>
                {feedbackMutation.isPending && (
                  <p className="candidate-feedback-message" role="status">
                    피드백을 저장하고 있어요...
                  </p>
                )}
                {feedbackMutation.isError && (
                  <p className="candidate-feedback-message is-error" role="alert">
                    피드백을 저장하지 못했어요. 다시 선택해 주세요.
                  </p>
                )}
                {feedbackMutation.isSuccess && (
                  <p className="candidate-feedback-message" role="status">
                    피드백을 저장했어요.
                  </p>
                )}
              </DetailSection>

              <a
                className="candidate-original-link"
                href={candidate.policeItem.originalUrl}
                target="_blank"
                rel="noreferrer"
              >
                경찰민원24에서 원문 확인 <span aria-hidden="true">↗</span>
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function DetailSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="candidate-detail-section">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const normalizedScore = score === null ? 0 : Math.max(0, Math.min(100, score))
  return (
    <div className="candidate-score-bar">
      <div>
        <span>{label}</span>
        <strong>{score === null ? '정보 없음' : `${Math.round(score)}점`}</strong>
      </div>
      <span aria-hidden="true">
        <i style={{ width: `${normalizedScore}%` }} />
      </span>
    </div>
  )
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return `${year}년 ${month}월 ${day}일`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'
}
