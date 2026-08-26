import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../features/auth/api/authApi'
import { AuthShell } from '../features/auth/components/AuthShell'
import { loginSchema, type LoginFormValues } from '../features/auth/model/authSchemas'
import { saveAuthSession } from '../features/auth/model/authSessionStore'

type LoginLocationState = {
  from?: unknown
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)

    try {
      const result = await login({ email: values.email.trim(), password: values.password })
      saveAuthSession(result)
      navigate(getRedirectPath(location.state), { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  })

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title={
        <>
          다시, 이어서
          <br />
          찾아볼까요?
        </>
      }
      description="로그인하면 등록한 수색카드와 새로운 후보를 확인할 수 있어요."
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label className="auth-field">
          <span>이메일</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="hello@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <small className="auth-field-error">{errors.email.message}</small>}
        </label>

        <label className="auth-field">
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력해 주세요"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && <small className="auth-field-error">{errors.password.message}</small>}
        </label>

        {serverError && (
          <p className="auth-alert" role="alert">
            {serverError}
          </p>
        )}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
        <Link className="auth-secondary" to="/signup">
          이메일로 회원가입
        </Link>
      </form>
    </AuthShell>
  )
}

function getRedirectPath(state: unknown) {
  const from = (state as LoginLocationState | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/home'
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '로그인에 실패했습니다. 다시 시도해 주세요.'
}
