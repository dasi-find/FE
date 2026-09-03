import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'

const CandidateDetailPage = lazy(() =>
  import('../../pages/CandidateDetailPage').then(({ CandidateDetailPage }) => ({
    default: CandidateDetailPage,
  })),
)
const CandidateListPage = lazy(() =>
  import('../../pages/CandidateListPage').then(({ CandidateListPage }) => ({
    default: CandidateListPage,
  })),
)
const HomePage = lazy(() =>
  import('../../pages/HomePage').then(({ HomePage }) => ({ default: HomePage })),
)
const LandingPage = lazy(() =>
  import('../../pages/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })),
)
const LoginPage = lazy(() =>
  import('../../pages/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
)
const NewSearchCardPage = lazy(() =>
  import('../../pages/NewSearchCardPage').then(({ NewSearchCardPage }) => ({
    default: NewSearchCardPage,
  })),
)
const NotificationListPage = lazy(() =>
  import('../../pages/NotificationListPage').then(({ NotificationListPage }) => ({
    default: NotificationListPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('../../pages/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)
const ProfilePage = lazy(() =>
  import('../../pages/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })),
)
const SignupPage = lazy(() =>
  import('../../pages/SignupPage').then(({ SignupPage }) => ({ default: SignupPage })),
)
const SearchCardListPage = lazy(() =>
  import('../../pages/SearchCardListPage').then(({ SearchCardListPage }) => ({
    default: SearchCardListPage,
  })),
)
const SearchCardDetailPage = lazy(() =>
  import('../../pages/SearchCardDetailPage').then(({ SearchCardDetailPage }) => ({
    default: SearchCardDetailPage,
  })),
)
const SearchCardEditPage = lazy(() =>
  import('../../pages/SearchCardEditPage').then(({ SearchCardEditPage }) => ({
    default: SearchCardEditPage,
  })),
)

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search-cards',
    element: (
      <ProtectedRoute>
        <SearchCardListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search-cards/new',
    element: (
      <ProtectedRoute>
        <NewSearchCardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search-cards/:searchCardId',
    element: (
      <ProtectedRoute>
        <SearchCardDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search-cards/:searchCardId/edit',
    element: (
      <ProtectedRoute>
        <SearchCardEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search-cards/:searchCardId/candidates',
    element: (
      <ProtectedRoute>
        <CandidateListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/candidates/:candidateId',
    element: (
      <ProtectedRoute>
        <CandidateDetailPage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

function RouteLoading() {
  return (
    <main className="route-loading" aria-label="화면을 불러오는 중" aria-busy="true">
      <span aria-hidden="true" />
      <p>잠시만 기다려 주세요.</p>
    </main>
  )
}
