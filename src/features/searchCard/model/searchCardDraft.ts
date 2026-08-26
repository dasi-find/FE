export type SearchCardCategory = 'WALLET' | 'BAG' | 'ELECTRONICS' | 'ETC'

export type LostTimeMode = 'exact' | 'approximate' | 'unknown'

export type SearchCardDraftImage = {
  file: File
  imageType: 'ACTUAL' | 'REFERENCE'
}

export type SearchCardDraft = {
  category: SearchCardCategory | ''
  itemName: string
  colors: string
  brand: string
  featureDescription: string
  images: SearchCardDraftImage[]
  lostDate: string
  timeMode: LostTimeMode
  exactTime: string
  startTime: string
  endTime: string
  placeName: string
  address: string
  latitude: number | null
  longitude: number | null
  situation: string
}

export const initialSearchCardDraft: SearchCardDraft = {
  category: '',
  itemName: '',
  colors: '',
  brand: '',
  featureDescription: '',
  images: [],
  lostDate: '',
  timeMode: 'unknown',
  exactTime: '',
  startTime: '',
  endTime: '',
  placeName: '',
  address: '',
  latitude: null,
  longitude: null,
  situation: '',
}

export const categoryOptions: Array<{ value: SearchCardCategory; label: string }> = [
  { value: 'WALLET', label: '지갑' },
  { value: 'BAG', label: '가방' },
  { value: 'ELECTRONICS', label: '전자기기' },
  { value: 'ETC', label: '기타' },
]

export function parseColors(value: string) {
  return value
    .split(/[,，]/)
    .map((color) => color.trim())
    .filter(Boolean)
}

export function getLostTimes(draft: SearchCardDraft) {
  if (draft.timeMode === 'exact') {
    return { lostStartTime: draft.exactTime || null, lostEndTime: draft.exactTime || null }
  }
  if (draft.timeMode === 'approximate') {
    return {
      lostStartTime: draft.startTime || null,
      lostEndTime: draft.endTime || null,
    }
  }
  return { lostStartTime: null, lostEndTime: null }
}
