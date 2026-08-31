import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  getSearchCard,
  updateSearchCard,
  type SearchCardDetail,
  type UpdateSearchCardRequest,
} from '../features/searchCard/api/searchCardApi'
import { KakaoPlacePicker } from '../features/searchCard/components/KakaoPlacePicker'
import {
  categoryOptions,
  getLostTimes,
  parseColors,
  type LostTimeMode,
  type SearchCardCategory,
  type SearchCardDraft,
} from '../features/searchCard/model/searchCardDraft'
import {
  basicInfoSchema,
  issuesByField,
  lostInfoSchema,
} from '../features/searchCard/model/searchCardSchemas'

type FieldErrors = Record<string, string>

export function SearchCardEditPage() {
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
          <Link
            to={isValidId ? `/search-cards/${parsedSearchCardId}` : '/search-cards'}
            aria-label="수색카드 상세로 돌아가기"
          >
            ‹
          </Link>
          <strong>수색카드 수정</strong>
          <span />
        </header>

        <div className="candidate-page-content search-card-edit-content">
          {!isValidId && (
            <EditState
              title="잘못된 수색카드예요."
              description="수색카드 목록에서 다시 선택해 주세요."
              listLink
            />
          )}

          {isValidId && searchCardQuery.isPending && (
            <div
              className="search-card-detail-loading"
              aria-label="수색카드 수정 정보를 불러오는 중"
              aria-busy="true"
            >
              <span />
              <span />
              <span />
            </div>
          )}

          {isValidId && searchCardQuery.isError && (
            <EditState
              title="수색카드를 불러오지 못했어요."
              description="잠시 후 다시 시도해 주세요."
              isRetrying={searchCardQuery.isFetching}
              onRetry={() => searchCardQuery.refetch()}
            />
          )}

          {searchCardQuery.data && searchCardQuery.data.status !== 'ACTIVE' && (
            <EditState
              title="수정할 수 없는 수색카드예요."
              description="수색 중인 카드만 수정할 수 있어요."
              detailId={searchCardQuery.data.id}
            />
          )}

          {searchCardQuery.data?.status === 'ACTIVE' && (
            <SearchCardEditForm key={searchCardQuery.data.id} searchCard={searchCardQuery.data} />
          )}
        </div>
      </section>
    </main>
  )
}

function SearchCardEditForm({ searchCard }: { searchCard: SearchCardDetail }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<SearchCardDraft>(() => toDraft(searchCard))
  const [material, setMaterial] = useState(searchCard.material ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateMutation = useMutation({
    mutationFn: (request: UpdateSearchCardRequest) => updateSearchCard(searchCard.id, request),
    onSuccess: async (updatedSearchCard) => {
      queryClient.setQueryData(['search-card', searchCard.id], updatedSearchCard)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['search-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['home-summary'] }),
      ])
      navigate(`/search-cards/${searchCard.id}`, { replace: true })
    },
  })

  const updateDraft = <Key extends keyof SearchCardDraft>(
    key: Key,
    value: SearchCardDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    updateMutation.reset()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const basicResult = basicInfoSchema.safeParse(draft)
    const lostResult = lostInfoSchema.safeParse(draft)
    if (!basicResult.success || !lostResult.success) {
      setErrors({
        ...(!basicResult.success ? issuesByField(basicResult.error) : {}),
        ...(!lostResult.success ? issuesByField(lostResult.error) : {}),
      })
      return
    }

    setErrors({})
    updateMutation.mutate(buildUpdateRequest(draft, material))
  }

  return (
    <form className="search-card-edit-form" onSubmit={submit}>
      <div className="search-card-edit-intro">
        <p>EDIT SEARCH CARD</p>
        <h1>
          기억난 정보를
          <br />
          고쳐주세요.
        </h1>
        <span>사진과 AI 분석 결과는 유지되고 입력 정보만 변경돼요.</span>
      </div>

      <EditSection number="01" title="기본 정보">
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
        <EditInput
          label="물품명"
          value={draft.itemName}
          error={errors.itemName}
          onChange={(value) => updateDraft('itemName', value)}
        />
        <EditInput
          label="대표 색상"
          value={draft.colors}
          error={errors.colors}
          hint="여러 색상은 쉼표로 구분해 주세요."
          onChange={(value) => updateDraft('colors', value)}
        />
        <EditInput
          label="브랜드 (선택)"
          value={draft.brand}
          onChange={(value) => updateDraft('brand', value)}
        />
        <EditInput
          label="재질 (선택)"
          value={material}
          onChange={(value) => {
            setMaterial(value)
            updateMutation.reset()
          }}
        />
      </EditSection>

      <EditSection number="02" title="특징">
        <label className="search-field">
          <span>기억나는 특징 (선택)</span>
          <textarea
            value={draft.featureDescription}
            onChange={(event) => updateDraft('featureDescription', event.target.value)}
          />
        </label>
      </EditSection>

      <EditSection number="03" title="분실 날짜와 시간">
        <EditInput
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
          <EditInput
            type="time"
            label="분실 시간"
            value={draft.exactTime}
            error={errors.exactTime}
            onChange={(value) => updateDraft('exactTime', value)}
          />
        )}
        {draft.timeMode === 'approximate' && (
          <div className="search-time-range">
            <EditInput
              type="time"
              label="시작 시간"
              value={draft.startTime}
              error={errors.startTime}
              onChange={(value) => updateDraft('startTime', value)}
            />
            <span>~</span>
            <EditInput
              type="time"
              label="종료 시간"
              value={draft.endTime}
              onChange={(value) => updateDraft('endTime', value)}
            />
          </div>
        )}
      </EditSection>

      <EditSection number="04" title="분실 장소">
        <EditInput
          label="장소명"
          value={draft.placeName}
          error={errors.placeName}
          onChange={(value) => updateDraft('placeName', value)}
        />
        <EditInput
          label="주소"
          value={draft.address}
          error={errors.address}
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
        <label className="search-field">
          <span>상황 설명 (선택)</span>
          <textarea
            value={draft.situation}
            onChange={(event) => updateDraft('situation', event.target.value)}
          />
        </label>
      </EditSection>

      {updateMutation.isError && (
        <p className="search-submit-error" role="alert">
          수색카드를 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      <div className="search-wizard-footer">
        <button className="search-primary-button" type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? '저장 중...' : '변경사항 저장'}
        </button>
        <Link className="search-secondary-button" to={`/search-cards/${searchCard.id}`}>
          취소
        </Link>
      </div>
    </form>
  )
}

function EditSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="search-numbered-section search-card-edit-section">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      <div className="search-form">{children}</div>
    </section>
  )
}

function EditInput({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  error?: string
  hint?: string
}) {
  return (
    <label className="search-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
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

function EditState({
  title,
  description,
  isRetrying = false,
  onRetry,
  listLink = false,
  detailId,
}: {
  title: string
  description: string
  isRetrying?: boolean
  onRetry?: () => void
  listLink?: boolean
  detailId?: number
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
      {detailId && <Link to={`/search-cards/${detailId}`}>상세로 돌아가기</Link>}
    </div>
  )
}

function toDraft(searchCard: SearchCardDetail): SearchCardDraft {
  const timeMode = getTimeMode(searchCard.lostStartTime, searchCard.lostEndTime)
  return {
    category: toCategory(searchCard.category),
    itemName: searchCard.itemName,
    colors: searchCard.colors.join(', '),
    brand: searchCard.brand ?? '',
    featureDescription: searchCard.featureDescription ?? '',
    images: [],
    lostDate: searchCard.lostDate,
    timeMode,
    exactTime: timeMode === 'exact' ? toInputTime(searchCard.lostStartTime) : '',
    startTime: timeMode === 'approximate' ? toInputTime(searchCard.lostStartTime) : '',
    endTime: timeMode === 'approximate' ? toInputTime(searchCard.lostEndTime) : '',
    placeName: searchCard.lostLocation.placeName,
    address: searchCard.lostLocation.address,
    latitude: searchCard.lostLocation.latitude,
    longitude: searchCard.lostLocation.longitude,
    situation: searchCard.lostLocation.description ?? '',
  }
}

function buildUpdateRequest(draft: SearchCardDraft, material: string): UpdateSearchCardRequest {
  return {
    category: draft.category,
    itemName: draft.itemName.trim(),
    color: parseColors(draft.colors),
    brand: draft.brand.trim() || null,
    material: material.trim() || null,
    featureDescription: draft.featureDescription.trim() || null,
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

function getTimeMode(start: string | null, end: string | null): LostTimeMode {
  if (!start && !end) return 'unknown'
  if (start === end) return 'exact'
  return 'approximate'
}

function toInputTime(value: string | null) {
  return value?.slice(0, 5) ?? ''
}

function toCategory(value: string): SearchCardCategory | '' {
  return categoryOptions.some((option) => option.value === value)
    ? (value as SearchCardCategory)
    : ''
}
