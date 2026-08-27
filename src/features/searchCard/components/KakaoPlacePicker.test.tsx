import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadKakaoMaps } from '../map/kakaoMaps'
import { KakaoPlacePicker } from './KakaoPlacePicker'

vi.mock('../map/kakaoMaps', () => ({ loadKakaoMaps: vi.fn() }))

const mockedLoadKakaoMaps = vi.mocked(loadKakaoMaps)
const relayout = vi.fn()
const setCenter = vi.fn()
const setMap = vi.fn()

describe('KakaoPlacePicker', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'javascript-app-key')
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    relayout.mockReset()
    setCenter.mockReset()
    setMap.mockReset()
    mockedLoadKakaoMaps.mockReset()
    mockedLoadKakaoMaps.mockResolvedValue(createMaps())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('지도 생성 후 영역을 다시 계산하고 선택 좌표를 중앙에 유지한다', async () => {
    render(
      <KakaoPlacePicker
        query="판교역"
        latitude={37.3947}
        longitude={127.1112}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('선택한 장소 지도')).toBeInTheDocument()
    await waitFor(() => expect(relayout).toHaveBeenCalledOnce())
    expect(setCenter).toHaveBeenCalledWith({ latitude: 37.3947, longitude: 127.1112 })
    expect(setMap).toHaveBeenCalledOnce()
  })
})

function createMaps() {
  return {
    load: vi.fn(),
    LatLng: class {
      latitude: number
      longitude: number

      constructor(latitude: number, longitude: number) {
        this.latitude = latitude
        this.longitude = longitude
      }
    },
    Map: class {
      relayout = relayout
      setCenter = setCenter
    },
    Size: class {},
    Point: class {},
    MarkerImage: class {},
    Marker: class {
      setMap = setMap
    },
    services: {
      Status: { OK: 'OK' },
      Places: class {},
    },
  } as unknown as Awaited<ReturnType<typeof loadKakaoMaps>>
}
