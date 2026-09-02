import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { CandidateDetailPage } from '../../pages/CandidateDetailPage'
import { CandidateListPage } from '../../pages/CandidateListPage'
import { HomePage } from '../../pages/HomePage'
import { LandingPage } from '../../pages/LandingPage'
import { LoginPage } from '../../pages/LoginPage'
import { NewSearchCardPage } from '../../pages/NewSearchCardPage'
import { NotificationListPage } from '../../pages/NotificationListPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { SignupPage } from '../../pages/SignupPage'
import { SearchCardListPage } from '../../pages/SearchCardListPage'
import { SearchCardDetailPage } from '../../pages/SearchCardDetailPage'
import { SearchCardEditPage } from '../../pages/SearchCardEditPage'
import { SettingsPage } from '../../pages/SettingsPage'

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
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
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
  return <RouterProvider router={router} />
}
