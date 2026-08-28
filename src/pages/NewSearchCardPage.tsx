import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  createSearchCard,
  deleteSearchCardImage,
  requestSearchCardAnalysis,
  uploadSearchCardImage,
  type CreatedSearchCard,
  type SearchCardAnalysis,
  type SearchCardAnalysisRequest,
} from '../features/searchCard/api/searchCardApi'
import {
  categoryOptions,
  getLostTimes,
  initialSearchCardDraft,
  parseColors,
  type LostTimeMode,
  type SearchCardDraft,
} from '../features/searchCard/model/searchCardDraft'
import {
  basicInfoSchema,
  issuesByField,
  lostInfoSchema,
} from '../features/searchCard/model/searchCardSchemas'
import { KakaoPlacePicker } from '../features/searchCard/components/KakaoPlacePicker'

type FieldErrors = Record<string, string>

export function NewSearchCardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<SearchCardDraft>(initialSearchCardDraft)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [analysis, setAnalysis] = useState<SearchCardAnalysis | null>(null)
  const [uploadedImageIds, setUploadedImageIds] = useState<number[]>([])
  const [createdCard, setCreatedCard] = useState<CreatedSearchCard | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateDraft = <Key extends keyof SearchCardDraft>(
    key: Key,
    value: SearchCardDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const goBack = () => {
    setSubmitError('')
    if (step === 1) navigate('/home')
    else if (step === 4) setStep(3)
    else setStep((current) => current - 1)
  }

  const nextFromBasic = () => {
    const result = basicInfoSchema.safeParse(draft)
    if (!result.success) {
      setErrors(issuesByField(result.error))
      return
    }
    setErrors({})
    setStep(2)
  }

  const analyze = async () => {
    const result = lostInfoSchema.safeParse(draft)
    if (!result.success) {
      setErrors(issuesByField(result.error))
      return
    }

    setErrors({})
    setSubmitError('')
    setIsSubmitting(true)
    let pendingImageIds: number[] = []
    try {
      const uploadResults = await Promise.allSettled(
        draft.images.map(({ file, imageType }) => uploadSearchCardImage(file, imageType)),
      )
      pendingImageIds = uploadResults.flatMap((uploadResult) =>
        uploadResult.status === 'fulfilled' ? [uploadResult.value.imageId] : [],
      )
      const failedUpload = uploadResults.find(
        (uploadResult): uploadResult is PromiseRejectedResult => uploadResult.status === 'rejected',
      )
      if (failedUpload) throw failedUpload.reason

      const nextAnalysis = await requestSearchCardAnalysis(
        buildAnalysisPayload(draft, pendingImageIds),
      )
      setUploadedImageIds(pendingImageIds)
      setAnalysis(nextAnalysis)
      setStep(4)
    } catch (error) {
      await Promise.allSettled(pendingImageIds.map((imageId) => deleteSearchCardImage(imageId)))
      setSubmitError(getErrorMessage(error, 'AI 분석을 시작하지 못했어요.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const startSearch = async () => {
    if (!analysis) return
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const result = await createSearchCard({
        ...buildAnalysisPayload(draft, uploadedImageIds),
        analysisId: analysis.analysisId,
        material: analysis.materials[0] ?? null,
      })
      setCreatedCard(result)
      setStep(5)
    } catch (error) {
      setSubmitError(getErrorMessage(error, '수색을 시작하지 못했어요.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="search-wizard-shell">
      <section className="search-wizard-screen">
        {step < 5 && (
          <header className="search-wizard-header">
            <button type="button" onClick={goBack} aria-label="이전 단계">
              ‹
            </button>
            <strong>{step === 4 ? 'AI 분석 확인' : '수색카드 만들기'}</strong>
            <span>{step <= 3 ? `${step} / 3` : ''}</span>
          </header>
        )}

        {step === 1 && (
          <BasicInfoStep
            draft={draft}
            errors={errors}
            updateDraft={updateDraft}
            onNext={nextFromBasic}
          />
        )}
        {step === 2 && (
          <PhotoFeatureStep draft={draft} updateDraft={updateDraft} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <LostInfoStep
            draft={draft}
            errors={errors}
            updateDraft={updateDraft}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onAnalyze={analyze}
          />
        )}
        {step === 4 && analysis && (
          <AnalysisStep
            draft={draft}
            analysis={analysis}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onEdit={() => setStep(1)}
            onStart={startSearch}
          />
        )}
        {step === 5 && createdCard && <SearchStartedStep card={createdCard} />}
      </section>
    </main>
  )
}

type StepProps = {
  draft: SearchCardDraft
  updateDraft: <Key extends keyof SearchCardDraft>(key: Key, value: SearchCardDraft[Key]) => void
}

function BasicInfoStep({
  draft,
  errors,
  updateDraft,
  onNext,
}: StepProps & { errors: FieldErrors; onNext: () => void }) {
  return (
    <div className="search-wizard-content">
      <StepIntro
        eyebrow="BASIC INFO"
        title={
          <>
            어떤 물건을
            <br />
            잃어버렸나요?
          </>
        }
        description="기억나는 기본 정보를 알려주세요."
      />
      <div className="search-form">
        <fieldset className="search-fieldset">
          <legend>카테고리</legend>
          <div className="search-chips">
            {categoryOptions.map((option) => (
              <button
                className={draft.category === option.value ? 'is-selected' : ''}
                key={option.value}
                type="button"
                onClick={() => updateDraft('category', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <FieldError message={errors.category} />
        </fieldset>
        <SearchInput
          label="물품명"
          value={draft.itemName}
          error={errors.itemName}
          placeholder="예) 남색 카드지갑"
          onChange={(value) => updateDraft('itemName', value)}
        />
        <SearchInput
          label="대표 색상"
          value={draft.colors}
          error={errors.colors}
          hint="여러 색상은 쉼표로 구분해 주세요."
          placeholder="예) 남색, 검정"
          onChange={(value) => updateDraft('colors', value)}
        />
        <SearchInput
          label="브랜드 (선택)"
          value={draft.brand}
          placeholder="기억나지 않으면 비워두세요"
          onChange={(value) => updateDraft('brand', value)}
        />
      </div>
      <WizardFooter>
        <button className="search-primary-button" type="button" onClick={onNext}>
          다음
        </button>
      </WizardFooter>
    </div>
  )
}

function PhotoFeatureStep({ draft, updateDraft, onNext }: StepProps & { onNext: () => void }) {
  const addImages = (files: FileList | null) => {
    if (!files) return
    const additions = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ file, imageType: 'ACTUAL' as const }))
    updateDraft('images', [...draft.images, ...additions])
  }

  return (
    <div className="search-wizard-content">
      <StepIntro
        eyebrow="PHOTO & FEATURES"
        title={
          <>
            눈에 띄는 특징이
            <br />
            있었나요?
          </>
        }
        description="사진이나 고유한 특징이 많을수록 정교하게 비교할 수 있어요."
      />
      <div className="search-form">
        <label className="search-upload">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => addImages(event.target.files)}
          />
          <span aria-hidden="true">＋</span>
          <strong>사진 추가</strong>
          <small>사진이 없어도 괜찮아요</small>
        </label>
        {draft.images.length > 0 && (
          <ul className="search-image-list">
            {draft.images.map((image, index) => (
              <li key={`${image.file.name}-${index}`}>
                <span>
                  <strong>{image.file.name}</strong>
                  <small>{formatFileSize(image.file.size)}</small>
                </span>
                <select
                  aria-label={`${image.file.name} 사진 종류`}
                  value={image.imageType}
                  onChange={(event) =>
                    updateDraft(
                      'images',
                      draft.images.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, imageType: event.target.value as 'ACTUAL' | 'REFERENCE' }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="ACTUAL">실제 사진</option>
                  <option value="REFERENCE">참고 사진</option>
                </select>
                <button
                  type="button"
                  aria-label={`${image.file.name} 삭제`}
                  onClick={() =>
                    updateDraft(
                      'images',
                      draft.images.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="search-field">
          <span>기억나는 특징</span>
          <textarea
            value={draft.featureDescription}
            placeholder="예) 앞면에 작은 은색 로고가 있고 오른쪽 아래에 긁힌 자국이 있어요."
            onChange={(event) => updateDraft('featureDescription', event.target.value)}
          />
        </label>
      </div>
      <WizardFooter>
        <button className="search-primary-button" type="button" onClick={onNext}>
          다음
        </button>
      </WizardFooter>
    </div>
  )
}

function LostInfoStep({
  draft,
  errors,
  updateDraft,
  isSubmitting,
  submitError,
  onAnalyze,
}: StepProps & {
  errors: FieldErrors
  isSubmitting: boolean
  submitError: string
  onAnalyze: () => void
}) {
  return (
    <div className="search-wizard-content">
      <StepIntro
        eyebrow="WHEN & WHERE"
        title={
          <>
            언제, 어디에서
            <br />
            잃어버렸나요?
          </>
        }
        description="정확하지 않아도 괜찮아요. 기억나는 만큼만 알려주세요."
      />
      <NumberedSection number="1" title="분실 날짜와 시간">
        <SearchInput
          type="date"
          label="날짜"
          value={draft.lostDate}
          error={errors.lostDate}
          onChange={(value) => updateDraft('lostDate', value)}
        />
        <fieldset className="search-fieldset">
          <legend>시간</legend>
          <div className="search-time-choices">
            {(
              [
                ['exact', '정확한 시간'],
                ['approximate', '대략적인 시간'],
                ['unknown', '잘 모르겠어요'],
              ] as Array<[LostTimeMode, string]>
            ).map(([value, label]) => (
              <button
                className={draft.timeMode === value ? 'is-selected' : ''}
                type="button"
                key={value}
                onClick={() => updateDraft('timeMode', value)}
              >
                <span />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {draft.timeMode === 'exact' && (
          <SearchInput
            type="time"
            label="분실 시간"
            value={draft.exactTime}
            error={errors.exactTime}
            onChange={(value) => updateDraft('exactTime', value)}
          />
        )}
        {draft.timeMode === 'approximate' && (
          <div className="search-time-range">
            <SearchInput
              type="time"
              label="시작 시간"
              value={draft.startTime}
              error={errors.startTime}
              onChange={(value) => updateDraft('startTime', value)}
            />
            <span>~</span>
            <SearchInput
              type="time"
              label="종료 시간"
              value={draft.endTime}
              onChange={(value) => updateDraft('endTime', value)}
            />
          </div>
        )}
      </NumberedSection>
      <NumberedSection number="2" title="마지막으로 기억나는 장소">
        <SearchInput
          label="장소명"
          value={draft.placeName}
          error={errors.placeName}
          placeholder="예) 판교역 스타벅스"
          onChange={(value) => updateDraft('placeName', value)}
        />
        <SearchInput
          label="주소"
          value={draft.address}
          error={errors.address}
          placeholder="도로명 또는 지번 주소"
          onChange={(value) => updateDraft('address', value)}
        />
        <KakaoPlacePicker
          query={draft.placeName}
          latitude={draft.latitude}
          longitude={draft.longitude}
          onSelect={(place) => {
            updateDraft('placeName', place.placeName)
            updateDraft('address', place.address)
            updateDraft('latitude', place.latitude)
            updateDraft('longitude', place.longitude)
          }}
        />
      </NumberedSection>
      <NumberedSection number="3" title="기억나는 상황 추가">
        <label className="search-field">
          <span>상황 설명 (선택)</span>
          <textarea
            value={draft.situation}
            placeholder="예) 카페에서 나올 때까지는 있었는데 집에 와서 확인하니 없어졌어요."
            onChange={(event) => updateDraft('situation', event.target.value)}
          />
        </label>
        <p className="search-note">
          ⓘ 이동 경로나 마지막으로 물건을 확인한 순간을 적으면 후보 비교에 도움이 돼요.
        </p>
      </NumberedSection>
      {submitError && (
        <p className="search-submit-error" role="alert">
          {submitError}
        </p>
      )}
      <WizardFooter>
        <button
          className="search-primary-button"
          type="button"
          disabled={isSubmitting}
          onClick={onAnalyze}
        >
          {isSubmitting ? '분석을 준비하고 있어요...' : 'AI로 분석하기'}
        </button>
      </WizardFooter>
    </div>
  )
}

function AnalysisStep({
  draft,
  analysis,
  isSubmitting,
  submitError,
  onEdit,
  onStart,
}: {
  draft: SearchCardDraft
  analysis: SearchCardAnalysis
  isSubmitting: boolean
  submitError: string
  onEdit: () => void
  onStart: () => void
}) {
  return (
    <div className="search-wizard-content">
      <article className="search-analysis-hero">
        <p>ANALYSIS COMPLETE</p>
        <h1>특징을 정리했어요.</h1>
        <span>다른 부분은 입력 단계에서 수정할 수 있어요.</span>
      </article>
      <section className="search-analysis-section">
        <h2>분석 결과</h2>
        <dl>
          <div>
            <dt>종류</dt>
            <dd>{analysis.itemName}</dd>
          </div>
          <div>
            <dt>색상</dt>
            <dd>{analysis.colors.join(' · ') || parseColors(draft.colors).join(' · ')}</dd>
          </div>
          <div>
            <dt>특징</dt>
            <dd>
              {analysis.features.join(' · ') || draft.featureDescription || '입력된 특징 없음'}
            </dd>
          </div>
          <div>
            <dt>분실 정보</dt>
            <dd>
              {draft.lostDate} {formatLostTime(draft)} · {draft.placeName}
            </dd>
          </div>
        </dl>
      </section>
      <p className="search-disclaimer">
        AI 후보 적합도는 소유물을 확정하는 결과가 아니며, 최종 확인과 반환은 경찰 및 보관기관의 공식
        절차를 따라야 합니다.
      </p>
      {submitError && (
        <p className="search-submit-error" role="alert">
          {submitError}
        </p>
      )}
      <WizardFooter>
        <button
          className="search-primary-button"
          type="button"
          disabled={isSubmitting}
          onClick={onStart}
        >
          {isSubmitting ? '수색을 시작하고 있어요...' : '이 내용으로 수색 시작'}
        </button>
        <button
          className="search-secondary-button"
          type="button"
          disabled={isSubmitting}
          onClick={onEdit}
        >
          입력 내용 수정
        </button>
      </WizardFooter>
    </div>
  )
}

function SearchStartedStep({ card }: { card: CreatedSearchCard }) {
  return (
    <div className="search-complete">
      <span aria-hidden="true">✓</span>
      <p>SEARCH STARTED</p>
      <h1>수색을 시작했어요.</h1>
      <strong>앞으로 30일 동안 새로운 습득물을 계속 비교할게요.</strong>
      <small>현재 확인할 후보 {card.initialCandidateCount}개</small>
      <Link className="search-primary-button" to="/home">
        홈으로 돌아가기
      </Link>
    </div>
  )
}

function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: ReactNode
  description: string
}) {
  return (
    <div className="search-step-intro">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{description}</span>
    </div>
  )
}

function NumberedSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="search-numbered-section">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      <div className="search-form">{children}</div>
    </section>
  )
}

function SearchInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
  hint?: string
}) {
  return (
    <label className="search-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <small>{hint}</small>}
      <FieldError message={error} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <small className="search-field-error" role="alert">
      {message}
    </small>
  ) : null
}

function WizardFooter({ children }: { children: ReactNode }) {
  return <div className="search-wizard-footer">{children}</div>
}

function buildAnalysisPayload(
  draft: SearchCardDraft,
  imageIds: number[],
): SearchCardAnalysisRequest {
  return {
    category: draft.category,
    itemName: draft.itemName.trim(),
    color: parseColors(draft.colors),
    brand: draft.brand.trim() || null,
    featureDescription: draft.featureDescription.trim() || null,
    imageIds,
    lostDate: draft.lostDate,
    ...getLostTimes(draft),
    lostLocation: {
      placeName: draft.placeName.trim(),
      address: draft.address.trim(),
      latitude: draft.latitude,
      longitude: draft.longitude,
      description: draft.situation.trim() || null,
    },
  }
}

function formatLostTime(draft: SearchCardDraft) {
  if (draft.timeMode === 'exact') return draft.exactTime
  if (draft.timeMode === 'approximate') return `${draft.startTime}~${draft.endTime}`
  return '시간 미상'
}

function formatFileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)}KB` : `${(size / 1024 / 1024).toFixed(1)}MB`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
