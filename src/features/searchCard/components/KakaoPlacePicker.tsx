import { useEffect, useRef, useState } from 'react'

import { loadKakaoMaps, type KakaoMapInstance, type KakaoPlace } from '../map/kakaoMaps'

type SelectedPlace = {
  placeName: string
  address: string
  latitude: number
  longitude: number
}

export function KakaoPlacePicker({
  query,
  latitude,
  longitude,
  onSelect,
}: {
  query: string
  latitude: number | null
  longitude: number | null
  onSelect: (place: SelectedPlace) => void
}) {
  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY ?? ''
  const mapElement = useRef<HTMLDivElement>(null)
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!appKey || latitude === null || longitude === null || !mapElement.current) return
    let marker: { setMap: (map: KakaoMapInstance | null) => void } | null = null
    void loadKakaoMaps(appKey).then((maps) => {
      if (!mapElement.current) return
      const position = new maps.LatLng(latitude, longitude)
      const map = new maps.Map(mapElement.current, { center: position, level: 3 })
      const image = new maps.MarkerImage('/dasi-find-map-marker.svg', new maps.Size(52, 64), {
        offset: new maps.Point(26, 62),
      })
      marker = new maps.Marker({ position, image })
      marker.setMap(map)
    })
    return () => marker?.setMap(null)
  }, [appKey, latitude, longitude])

  const search = async () => {
    if (!appKey) {
      setMessage('카카오맵 앱 키를 설정하면 장소 검색을 사용할 수 있어요.')
      return
    }
    if (!query.trim()) {
      setMessage('먼저 장소명을 입력해 주세요.')
      return
    }
    setIsSearching(true)
    setMessage('')
    try {
      const maps = await loadKakaoMaps(appKey)
      const places = new maps.services.Places()
      places.keywordSearch(query.trim(), (nextResults, status) => {
        setIsSearching(false)
        if (status !== maps.services.Status.OK || nextResults.length === 0) {
          setResults([])
          setMessage('검색 결과가 없어요. 다른 장소명으로 검색해 보세요.')
          return
        }
        setResults(nextResults.slice(0, 5))
      })
    } catch (error) {
      setIsSearching(false)
      setMessage(error instanceof Error ? error.message : '장소를 검색하지 못했어요.')
    }
  }

  return (
    <div className="kakao-place-picker">
      <button className="search-map-button" type="button" onClick={search} disabled={isSearching}>
        <span aria-hidden="true">⌕</span>
        {isSearching ? '카카오맵에서 검색 중...' : '카카오맵에서 장소 검색'}
      </button>
      {message && <p className="search-map-message">{message}</p>}
      {results.length > 0 && (
        <ul className="search-place-results" aria-label="카카오맵 장소 검색 결과">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect({
                    placeName: place.place_name,
                    address: place.road_address_name || place.address_name,
                    latitude: Number(place.y),
                    longitude: Number(place.x),
                  })
                  setResults([])
                  setMessage(`${place.place_name} 장소를 선택했어요.`)
                }}
              >
                <strong>{place.place_name}</strong>
                <small>{place.road_address_name || place.address_name}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {latitude !== null && longitude !== null ? (
        <div className="search-kakao-map" ref={mapElement} aria-label="선택한 장소 지도" />
      ) : (
        <div className="search-map-placeholder" aria-label="장소 선택 전 지도">
          <img src="/dasi-find-map-marker.svg" alt="다시찾음 지도 마커" />
          <strong>장소를 선택하면 지도에 표시돼요.</strong>
          <small>검은 핀 안에 다시찾음 로고가 들어간 전용 마커를 사용해요.</small>
        </div>
      )}
    </div>
  )
}
