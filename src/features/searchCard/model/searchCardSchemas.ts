import { z } from 'zod'

export const basicInfoSchema = z.object({
  category: z.string().min(1, '카테고리를 선택해 주세요.'),
  itemName: z.string().trim().min(1, '물품명을 입력해 주세요.'),
  colors: z.string().trim().min(1, '대표 색상을 입력해 주세요.'),
})

export const lostInfoSchema = z
  .object({
    lostDate: z.string().min(1, '분실 날짜를 선택해 주세요.'),
    timeMode: z.enum(['exact', 'approximate', 'unknown']),
    exactTime: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    placeName: z.string().trim().min(1, '장소명을 입력해 주세요.'),
    address: z.string().trim().min(1, '주소를 입력해 주세요.'),
  })
  .superRefine((value, context) => {
    if (value.timeMode === 'exact' && !value.exactTime) {
      context.addIssue({ code: 'custom', path: ['exactTime'], message: '시간을 선택해 주세요.' })
    }
    if (value.timeMode === 'approximate') {
      if (!value.startTime || !value.endTime) {
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: '시작과 종료 시간을 모두 선택해 주세요.',
        })
      } else if (value.startTime > value.endTime) {
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: '시작 시간은 종료 시간보다 빨라야 해요.',
        })
      }
    }
  })

export function issuesByField(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]))
}
