import { useCallback, useEffect, useState } from 'react'
import { AuthError, getSession, setSession } from './api'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSessionState] = useState(getSession)

  const login = (value) => {
    setSession(value)
    setSessionState(value)
  }

  const logout = useCallback(() => {
    setSession(null)
    setSessionState(null)
  }, [])

  // Sign out the moment the JWT expires, even if no request is made
  useEffect(() => {
    if (!session) return
    const t = setTimeout(logout, Math.max(session.expiresAt - Date.now(), 0))
    return () => clearTimeout(t)
  }, [session, logout])

  // Returns true when the error was an expired/invalid session (and we signed out)
  const handleAuthError = useCallback(
    (err) => {
      if (err instanceof AuthError) {
        logout()
        return true
      }
      return false
    },
    [logout]
  )

  if (!session) return <Login onLogin={login} />

  return <Dashboard admin={session.admin} onLogout={logout} onAuthError={handleAuthError} />
}

export default App
