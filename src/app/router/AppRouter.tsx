import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { HomePage } from '../../pages/HomePage'
import { LandingPage } from '../../pages/LandingPage'
import { LoginPage } from '../../pages/LoginPage'
import { NewSearchCardPage } from '../../pages/NewSearchCardPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { SignupPage } from '../../pages/SignupPage'

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
    path: '/search-cards/new',
    element: (
      <ProtectedRoute>
        <NewSearchCardPage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
