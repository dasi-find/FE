import { describe, expect, it } from 'vitest'

import { basicInfoSchema, lostInfoSchema, photoFeatureSchema } from './searchCardSchemas'

describe('searchCardSchemas', () => {
  it('분석 요청의 문자열과 색상 개수 제한을 검증한다', () => {
    expect(
      basicInfoSchema.safeParse({
        category: 'WALLET',
        itemName: '지갑',
        colors: Array.from({ length: 11 }, (_, index) => `색상${index}`).join(','),
        brand: '',
      }).success,
    ).toBe(false)

    expect(
      basicInfoSchema.safeParse({
        category: 'WALLET',
        itemName: '가'.repeat(101),
        colors: '검정',
        brand: '',
      }).success,
    ).toBe(false)
  })

  it('특징 설명을 필수로 검증한다', () => {
    expect(photoFeatureSchema.safeParse({ featureDescription: '', images: [] }).success).toBe(false)
    expect(
      photoFeatureSchema.safeParse({ featureDescription: '앞면에 은색 로고가 있어요.', images: [] })
        .success,
    ).toBe(true)
  })

  it('미래 날짜와 선택되지 않은 지도 위치를 거부한다', () => {
    const result = lostInfoSchema.safeParse({
      lostDate: '2999-01-01',
      timeMode: 'unknown',
      exactTime: '',
      startTime: '',
      endTime: '',
      placeName: '판교역',
      address: '경기도 성남시 분당구 판교역로 160',
      latitude: null,
      longitude: null,
      situation: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['lostDate', 'location']),
      )
    }
  })
})
