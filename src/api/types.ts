export type ApiResponse<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
}

export type PageResult<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  hasNext: boolean
}

export type ApiErrorCode =
  | 'COMMON4001'
  | 'COMMON4004'
  | 'COMMON4011'
  | 'COMMON4031'
  | 'COMMON4041'
  | 'COMMON4091'
  | 'COMMON4291'
  | 'COMMON5001'
  | 'AUTH4001'
  | 'AUTH4011'
  | 'AUTH4012'
  | 'AUTH4091'
  | 'AUTH4101'
  | 'SEARCH4091'
  | 'IMAGE4131'
  | 'IMAGE4151'
  | 'AI5021'
  | 'AI5031'

export type ApiErrorResponse = ApiResponse<null>
