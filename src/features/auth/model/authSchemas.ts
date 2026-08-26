import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .email('이메일 형식을 확인해 주세요.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    email: emailSchema,
    verificationCode: z.string().regex(/^\d{6}$/, '인증번호 6자리를 입력해 주세요.'),
    name: z
      .string()
      .trim()
      .min(2, '표시명은 2자 이상 입력해 주세요.')
      .max(50, '표시명은 50자 이하로 입력해 주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상 입력해 주세요.'),
    passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.'),
    terms: z.boolean().refine(Boolean, '이용약관 동의가 필요합니다.'),
    privacy: z.boolean().refine(Boolean, '개인정보 처리방침 동의가 필요합니다.'),
    emailNotification: z.boolean(),
  })
  .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  })

export type SignupFormValues = z.infer<typeof signupSchema>
