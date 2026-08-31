import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { updateCurrentUser } from '../features/auth/model/authSessionStore'
import {
  getMyProfile,
  updateMyProfile,
  type UpdateUserProfileRequest,
  type UserProfile,
} from '../features/user/api/userApi'

const profileQueryKey = ['my-profile'] as const

export function ProfilePage() {
  const profileQuery = useQuery({ queryKey: profileQueryKey, queryFn: getMyProfile })

  return (
    <main className="profile-shell">
      <section className="profile-screen">
        <header className="profile-header">
          <Link to="/home" aria-label="홈으로 돌아가기">
            ‹
          </Link>
          <strong>내 정보</strong>
          <span />
        </header>

        <div className="profile-content">
          <div className="profile-intro">
            <span aria-hidden="true">ME</span>
            <p>ACCOUNT</p>
            <h1>내 정보를 관리해요.</h1>
          </div>

          {profileQuery.isPending && (
            <div className="profile-loading" aria-label="내 정보를 불러오는 중" aria-busy="true">
              <span />
              <span />
              <span />
            </div>
          )}

          {profileQuery.isError && (
            <div className="profile-state" role="alert">
              <strong>내 정보를 불러오지 못했어요.</strong>
              <p>잠시 후 다시 시도해 주세요.</p>
              <button
                type="button"
                onClick={() => profileQuery.refetch()}
                disabled={profileQuery.isFetching}
              >
                {profileQuery.isFetching ? '불러오는 중...' : '다시 시도'}
              </button>
            </div>
          )}

          {profileQuery.data && <ProfileForm profile={profileQuery.data} />}
        </div>
      </section>
    </main>
  )
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.name)
  const [emailNotificationEnabled, setEmailNotificationEnabled] = useState(
    profile.emailNotificationEnabled,
  )
  const [nameError, setNameError] = useState('')
  const updateMutation = useMutation({
    mutationFn: (request: UpdateUserProfileRequest) => updateMyProfile(request),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileQueryKey, updatedProfile)
      updateCurrentUser({
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
      })
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setNameError('표시명은 2자 이상 50자 이하로 입력해 주세요.')
      return
    }

    setNameError('')
    updateMutation.mutate({ name: trimmedName, emailNotificationEnabled })
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>
        <span>이메일</span>
        <input type="email" value={profile.email} readOnly />
        <small>이메일은 현재 변경할 수 없어요.</small>
      </label>

      <label>
        <span>표시명</span>
        <input
          type="text"
          value={name}
          maxLength={50}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'profile-name-error' : undefined}
          onChange={(event) => {
            setName(event.target.value)
            setNameError('')
            updateMutation.reset()
          }}
        />
        {nameError && (
          <small id="profile-name-error" className="profile-field-error">
            {nameError}
          </small>
        )}
      </label>

      <label className="profile-toggle">
        <span>
          <strong>이메일 알림</strong>
          <small>새로운 후보와 수색 만료 소식을 받아요.</small>
        </span>
        <input
          type="checkbox"
          checked={emailNotificationEnabled}
          onChange={(event) => {
            setEmailNotificationEnabled(event.target.checked)
            updateMutation.reset()
          }}
        />
        <i aria-hidden="true" />
      </label>

      {updateMutation.isError && (
        <p className="profile-submit-message is-error" role="alert">
          정보를 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="profile-submit-message" role="status">
          내 정보를 저장했어요.
        </p>
      )}

      <button className="profile-submit" type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? '저장 중...' : '변경사항 저장'}
      </button>
    </form>
  )
}
