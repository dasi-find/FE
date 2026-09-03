import { z } from 'zod'

import { parseColors } from './searchCardDraft'

export const MAX_SEARCH_CARD_IMAGES = 5
export const MAX_SEARCH_CARD_IMAGE_BYTES = 10 * 1024 * 1024
export const SUPPORTED_SEARCH_CARD_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const today = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export const basicInfoSchema = z
  .object({
    category: z.string().min(1, '카테고리를 선택해 주세요.'),
    itemName: z
      .string()
      .trim()
      .min(1, '물품명을 입력해 주세요.')
      .max(100, '물품명은 100자 이하로 입력해 주세요.'),
    colors: z.string().trim().min(1, '대표 색상을 입력해 주세요.'),
    brand: z.string().trim().max(100, '브랜드는 100자 이하로 입력해 주세요.'),
  })
  .superRefine((value, context) => {
    const colors = parseColors(value.colors)
    if (colors.length > 10) {
      context.addIssue({
        code: 'custom',
        path: ['colors'],
        message: '색상은 최대 10개까지 입력할 수 있어요.',
      })
    } else if (colors.some((color) => color.length > 50)) {
      context.addIssue({
        code: 'custom',
        path: ['colors'],
        message: '각 색상은 50자 이하로 입력해 주세요.',
      })
    }
  })

export const photoFeatureSchema = z.object({
  featureDescription: z
    .string()
    .trim()
    .min(1, '기억나는 특징을 입력해 주세요.')
    .max(2000, '특징은 2,000자 이하로 입력해 주세요.'),
  images: z
    .array(
      z.object({
        file: z
          .custom<File>((value) => value instanceof File)
          .refine(
            (file) =>
              SUPPORTED_SEARCH_CARD_IMAGE_TYPES.includes(
                file.type as (typeof SUPPORTED_SEARCH_CARD_IMAGE_TYPES)[number],
              ),
            'JPG, PNG, WebP 사진만 올릴 수 있어요.',
          )
          .refine(
            (file) => file.size <= MAX_SEARCH_CARD_IMAGE_BYTES,
            '사진 한 장은 10MB 이하여야 해요.',
          ),
        imageType: z.enum(['ACTUAL', 'REFERENCE']),
      }),
    )
    .max(MAX_SEARCH_CARD_IMAGES, '사진은 최대 5장까지 올릴 수 있어요.'),
})

export const lostInfoSchema = z
  .object({
    lostDate: z.string().min(1, '분실 날짜를 선택해 주세요.'),
    timeMode: z.enum(['exact', 'approximate', 'unknown']),
    exactTime: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    placeName: z
      .string()
      .trim()
      .min(1, '장소명을 입력해 주세요.')
      .max(100, '장소명은 100자 이하로 입력해 주세요.'),
    address: z
      .string()
      .trim()
      .min(1, '주소를 입력해 주세요.')
      .max(255, '주소는 255자 이하로 입력해 주세요.'),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    situation: z.string().trim().max(1000, '상황 설명은 1,000자 이하로 입력해 주세요.'),
  })
  .superRefine((value, context) => {
    if (value.lostDate && value.lostDate > today()) {
      context.addIssue({
        code: 'custom',
        path: ['lostDate'],
        message: '분실 날짜는 오늘 이후로 선택할 수 없어요.',
      })
    }
    if (value.latitude === null || value.longitude === null) {
      context.addIssue({
        code: 'custom',
        path: ['location'],
        message: '카카오맵 검색 결과에서 장소를 선택해 주세요.',
      })
    }
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
