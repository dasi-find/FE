import { Link } from 'react-router-dom'

import { PlaceholderPage } from '../components/PlaceholderPage'

export function NotFoundPage() {
  return (
    <PlaceholderPage
      title="페이지를 찾을 수 없어요"
      description="주소를 다시 확인해 주세요."
      action={
        <Link className="primary-button" to="/">
          처음으로 돌아가기
        </Link>
      }
    />
  )
}
