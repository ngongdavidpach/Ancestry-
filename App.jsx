// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import CommunitiesPage from './pages/CommunitiesPage'
import AncestryPage from './pages/AncestryPage'
import LoadingScreen from './components/LoadingScreen'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<PrivateRoute><CommunitiesPage /></PrivateRoute>} />
      <Route path="/community/:communityId" element={<PrivateRoute><AncestryPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
