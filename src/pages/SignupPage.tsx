import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import {
  confirmEmailVerification,
  sendEmailVerification,
  signup,
} from '../features/auth/api/authApi'
import { AuthShell } from '../features/auth/components/AuthShell'
import { signupSchema, type SignupFormValues } from '../features/auth/model/authSchemas'
import { saveAuthSession } from '../features/auth/model/authSessionStore'

type VerificationState = {
  email: string
  verificationId: string
  verificationToken: string | null
}

export function SignupPage() {
  const navigate = useNavigate()
  const [verification, setVerification] = useState<VerificationState | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      verificationCode: '',
      name: '',
      password: '',
      passwordConfirm: '',
      terms: false,
      privacy: false,
      emailNotification: true,
    },
  })
  const isVerified = Boolean(verification?.verificationToken)
  const emailRegistration = register('email')

  useEffect(() => {
    if (remainingSeconds <= 0 || isVerified) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [isVerified, remainingSeconds])

  async function handleSendVerification() {
    if (!(await trigger('email'))) return

    setIsSending(true)
    setServerError(null)
    setVerificationMessage(null)

    try {
      const normalizedEmail = getValues('email').trim()
      const result = await sendEmailVerification(normalizedEmail)
      setVerification({
        email: normalizedEmail,
        verificationId: result.verificationId,
        verificationToken: null,
      })
      setRemainingSeconds(result.expiresInSeconds)
      setVerificationMessage('인증번호를 보냈습니다. 메일함을 확인해 주세요.')
    } catch (error) {
      setServerError(getErrorMessage(error, '인증번호를 보내지 못했습니다.'))
    } finally {
      setIsSending(false)
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    emailRegistration.onChange(event)
    if (!verification || verification.email === event.target.value.trim()) return

    setVerification(null)
    setRemainingSeconds(0)
    setVerificationMessage('이메일이 변경되어 인증을 다시 진행해 주세요.')
  }

  async function handleConfirmVerification() {
    if (!verification || remainingSeconds <= 0) {
      setServerError('인증 시간이 만료되었습니다. 인증번호를 다시 받아 주세요.')
      return
    }
    if (!(await trigger('verificationCode'))) return

    setIsConfirming(true)
    setServerError(null)

    try {
      const result = await confirmEmailVerification(
        verification.verificationId,
        getValues('verificationCode'),
      )
      setVerification((current) =>
        current
          ? { ...current, email: result.verifiedEmail, verificationToken: result.verificationToken }
          : current,
      )
      setVerificationMessage('이메일 인증이 완료되었습니다.')
    } catch (error) {
      setServerError(getErrorMessage(error, '인증번호를 확인하지 못했습니다.'))
    } finally {
      setIsConfirming(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!verification?.verificationToken || verification.email !== values.email.trim()) {
      setServerError('이메일 인증을 완료해 주세요.')
      return
    }

    setServerError(null)

    try {
      const result = await signup({
        email: values.email.trim(),
        verificationToken: verification.verificationToken,
        password: values.password,
        name: values.name.trim(),
        agreements: {
          terms: values.terms,
          privacy: values.privacy,
          emailNotification: values.emailNotification,
        },
      })
      saveAuthSession(result)
      navigate('/home', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, '회원가입에 실패했습니다.'))
    }
  })

  return (
    <AuthShell
      eyebrow="CREATE ACCOUNT"
      title={
        <>
          찾는 여정을
          <br />
          시작해 볼까요?
        </>
      }
      description="이메일 인증 후 수색카드를 만들고 새로운 후보 알림을 받아보세요."
    >
      <form className="auth-form signup-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="signup-email">이메일</label>
          <div className="auth-inline">
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
              readOnly={isVerified}
              aria-invalid={Boolean(errors.email)}
              {...emailRegistration}
              onChange={handleEmailChange}
            />
            <button
              className="auth-inline-button"
              type="button"
              onClick={handleSendVerification}
              disabled={isSending || isVerified}
            >
              {verification ? '재전송' : '인증 요청'}
            </button>
          </div>
          {errors.email && <small className="auth-field-error">{errors.email.message}</small>}
        </div>

        {verification && !isVerified && (
          <div className="auth-field">
            <label htmlFor="verification-code">
              인증번호
              <span className="auth-timer" aria-live="polite">
                {formatTime(remainingSeconds)}
              </span>
            </label>
            <div className="auth-inline">
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6자리 입력"
                aria-invalid={Boolean(errors.verificationCode)}
                {...register('verificationCode')}
              />
              <button
                className="auth-inline-button"
                type="button"
                onClick={handleConfirmVerification}
                disabled={isConfirming || remainingSeconds <= 0}
              >
                확인
              </button>
            </div>
            {errors.verificationCode && (
              <small className="auth-field-error">{errors.verificationCode.message}</small>
            )}
          </div>
        )}

        {verificationMessage && (
          <p className={isVerified ? 'auth-success' : 'auth-help'} aria-live="polite">
            {verificationMessage}
          </p>
        )}

        <label className="auth-field">
          <span>표시명</span>
          <input
            type="text"
            autoComplete="nickname"
            placeholder="서비스에서 사용할 이름"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <small className="auth-field-error">{errors.name.message}</small>}
        </label>

        <label className="auth-field">
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상 입력해 주세요"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && <small className="auth-field-error">{errors.password.message}</small>}
        </label>

        <label className="auth-field">
          <span>비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 다시 입력해 주세요"
            aria-invalid={Boolean(errors.passwordConfirm)}
            {...register('passwordConfirm')}
          />
          {errors.passwordConfirm && (
            <small className="auth-field-error">{errors.passwordConfirm.message}</small>
          )}
        </label>

        <fieldset className="auth-agreements">
          <legend>약관 동의</legend>
          <label>
            <input type="checkbox" {...register('terms')} />
            <span>[필수] 이용약관에 동의합니다.</span>
          </label>
          {errors.terms && <small className="auth-field-error">{errors.terms.message}</small>}
          <label>
            <input type="checkbox" {...register('privacy')} />
            <span>[필수] 개인정보 처리방침에 동의합니다.</span>
          </label>
          {errors.privacy && <small className="auth-field-error">{errors.privacy.message}</small>}
          <label>
            <input type="checkbox" {...register('emailNotification')} />
            <span>[선택] 새로운 후보를 이메일로 알림 받습니다.</span>
          </label>
        </fieldset>

        {serverError && (
          <p className="auth-alert" role="alert">
            {serverError}
          </p>
        )}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '계정 만드는 중...' : '회원가입 완료'}
        </button>
        <p className="auth-login-link">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </AuthShell>
  )
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
