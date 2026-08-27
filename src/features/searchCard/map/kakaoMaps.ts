export type KakaoPlace = {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
}

type KakaoLatLng = object
type KakaoMarkerImage = object

export type KakaoMapInstance = {
  relayout: () => void
  setCenter: (position: KakaoLatLng) => void
}

type KakaoMaps = {
  load: (callback: () => void) => void
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance
  Size: new (width: number, height: number) => object
  Point: new (x: number, y: number) => object
  MarkerImage: new (source: string, size: object, options: { offset: object }) => KakaoMarkerImage
  Marker: new (options: { position: KakaoLatLng; image: KakaoMarkerImage }) => {
    setMap: (map: KakaoMapInstance | null) => void
  }
  services: {
    Status: { OK: string }
    Places: new () => {
      keywordSearch: (
        query: string,
        callback: (results: KakaoPlace[], status: string) => void,
      ) => void
    }
  }
}

type KakaoWindow = Window & { kakao?: { maps: KakaoMaps } }

let loader: Promise<KakaoMaps> | null = null

export function loadKakaoMaps(appKey: string) {
  if (!appKey) return Promise.reject(new Error('카카오맵 앱 키가 설정되지 않았어요.'))
  const browserWindow = window as KakaoWindow
  if (browserWindow.kakao?.maps) return loadReadyMaps(browserWindow.kakao.maps)
  if (loader) return loader

  loader = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`
    script.async = true
    script.addEventListener('load', () => {
      const maps = (window as KakaoWindow).kakao?.maps
      if (!maps) {
        reject(new Error('카카오맵을 불러오지 못했어요.'))
        return
      }
      maps.load(() => resolve(maps))
    })
    script.addEventListener('error', () => reject(new Error('카카오맵을 불러오지 못했어요.')))
    document.head.append(script)
  })

  return loader
}

function loadReadyMaps(maps: KakaoMaps) {
  return new Promise<KakaoMaps>((resolve) => maps.load(() => resolve(maps)))
}
