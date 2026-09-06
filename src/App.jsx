import { useEffect, useMemo, useState } from 'react'
import {
  clearAuthSession,
  forgetPassword,
  getStoredUser,
  saveAuthSession,
  sendOtp,
  signIn,
  signUp,
  verifyOtp,
} from './api/auth'
import OpportunityDashboard from './components/OpportunityDashboard'

function App() {
  const [view, setView] = useState('login')
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState('')

  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupOtp, setSignupOtp] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupOtpSent, setSignupOtpSent] = useState(false)
  const [signupOtpVerified, setSignupOtpVerified] = useState(false)
  const [signupMessage, setSignupMessage] = useState('')

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')

const isCollegeEmail = useMemo(
  () => /^\S+@\S+\.(?:edu|ac)(?:\.\w+)?$|^\S+@gmail\.com$/i.test(signupEmail.trim()),
  [signupEmail],
);

  useEffect(() => {
    const handleAuthExpired = (event) => {
      clearAuthSession()
      setUser(null)
      setView('login')
      setLoginPassword('')
      setLoginMessage(
        event.detail?.message || 'Your session has expired. Please log in again.',
      )
    }

    window.addEventListener('auth:expired', handleAuthExpired)

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [])

  const resetMessages = () => {
    setLoginMessage('')
    setSignupMessage('')
    setForgotMessage('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginMessage('Please enter both email and password.')
      return
    }

    setLoading(true)
    setLoginMessage('')
    try {
      const data = await signIn(loginEmail.trim(), loginPassword)
      saveAuthSession(data.accessToken, data.refreshToken, data.user)
      setUser(data.user)
      setLoginMessage(data.message || 'Login successful.')
      setLoginPassword('')
    } catch (error) {
      setLoginMessage(
        error instanceof Error ? error.message : 'Login failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSendSignupOtp = async () => {
    if (!signupName.trim()) {
      setSignupMessage('Please enter your name.')
      return
    }
    if (!signupEmail.trim()) {
      setSignupMessage('Please enter your college email ID.')
      return
    }
    if (!isCollegeEmail) {
      setSignupMessage('Please use a valid college email ID.')
      return
    }

    setLoading(true)
    setSignupMessage('')
    try {
      const data = await sendOtp(signupEmail.trim())
      setSignupOtpSent(true)
      setSignupOtpVerified(false)
      setSignupMessage(data.message || 'OTP sent to your college email.')
    } catch (error) {
      setSignupMessage(
        error instanceof Error ? error.message : 'Failed to send OTP.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySignupOtp = async () => {
    if (!signupOtp.trim()) {
      setSignupMessage('Please enter the OTP.')
      return
    }

    setLoading(true)
    setSignupMessage('')
    try {
      const data = await verifyOtp(signupEmail.trim(), signupOtp.trim())
      setSignupOtpVerified(true)
      setSignupMessage(
        data.message || 'Email verified successfully. Set your password now.',
      )
    } catch (error) {
      setSignupOtpVerified(false)
      setSignupMessage(
        error instanceof Error ? error.message : 'Invalid OTP.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    if (!signupOtpVerified) {
      setSignupMessage('Please verify your college email with OTP first.')
      return
    }
    if (signupPassword.trim().length < 8) {
      setSignupMessage('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setSignupMessage('')
    try {
      const data = await signUp(
        signupName.trim(),
        signupEmail.trim(),
        signupPassword,
        'student',
      )
      setSignupMessage(data.message || 'Account created successfully.')
      setSignupPassword('')
      setSignupOtp('')
      setSignupOtpSent(false)
      setSignupOtpVerified(false)
      setView('login')
      setLoginEmail(signupEmail.trim())
      setLoginMessage('Account created. Please log in.')
    } catch (error) {
      setSignupMessage(
        error instanceof Error ? error.message : 'Sign up failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSendForgotOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage('Please enter your email ID.')
      return
    }

    setLoading(true)
    setForgotMessage('')
    try {
      const data = await sendOtp(forgotEmail.trim())
      setForgotOtpSent(true)
      setForgotOtpVerified(false)
      setForgotMessage(data.message || 'OTP sent to your email.')
    } catch (error) {
      setForgotMessage(
        error instanceof Error ? error.message : 'Failed to send OTP.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyForgotOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotMessage('Please enter the OTP.')
      return
    }

    setLoading(true)
    setForgotMessage('')
    try {
      const data = await verifyOtp(forgotEmail.trim(), forgotOtp.trim())
      setForgotOtpVerified(true)
      setForgotMessage(data.message || 'OTP verified. Enter your new password.')
    } catch (error) {
      setForgotOtpVerified(false)
      setForgotMessage(
        error instanceof Error ? error.message : 'Invalid OTP.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    if (!forgotOtpVerified) {
      setForgotMessage('Please verify OTP first.')
      return
    }
    if (forgotNewPassword.trim().length < 8) {
      setForgotMessage('New password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setForgotMessage('')
    try {
      const data = await forgetPassword(
        forgotEmail.trim(),
        forgotNewPassword,
      )
      setForgotMessage(data.message || 'Password updated successfully.')
      setLoginEmail(forgotEmail.trim())
      setLoginPassword('')
      setForgotOtp('')
      setForgotNewPassword('')
      setForgotOtpSent(false)
      setForgotOtpVerified(false)
      setView('login')
      setLoginMessage('Password updated successfully. Please log in.')
    } catch (error) {
      setForgotMessage(
        error instanceof Error ? error.message : 'Password reset failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setUser(null)
    setLoginMessage('Logged out successfully.')
    setView('login')
  }

  const switchView = (nextView) => {
    setView(nextView)
    resetMessages()
  }

  if (user) {
    return <OpportunityDashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Opportunity Updates
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Your campus placement platform to explore on-campus opportunities
            and apply through company application forms.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-6 grid grid-cols-3 rounded-xl border border-white/10 bg-slate-900/70 p-1">
            <button
              type="button"
              onClick={() => switchView('login')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === 'login'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchView('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === 'signup'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => switchView('forgot')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === 'forgot'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Forgot
            </button>
          </div>

          {view === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <h3 className="text-xl font-semibold">Login to Your Account</h3>
              <label className="block text-sm text-slate-200">
                Email ID
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                  placeholder="ex- 2024pgcsca022@nitjsr.ac.in"
                />
              </label>

            
              <label className="block text-sm text-slate-200">
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                  placeholder="Enter password"
                />
              </label>
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              {loginMessage && (
                <p className="text-sm text-indigo-200">{loginMessage}</p>
              )}
            </form>
          )}

          {view === 'signup' && (
            <form className="space-y-4" onSubmit={handleSignup}>
              <h3 className="text-xl font-semibold">Create Student Account</h3>
              <label className="block text-sm text-slate-200">
                Name
                <input
                  type="text"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                  placeholder="Enter full name"
                />
              </label>
              <label className="block text-sm text-slate-200">
                College Email ID
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                    placeholder="ex- 2024pgcsca022@nitjsr.ac.in"
                  />
                  <button
                    type="button"
                    onClick={handleSendSignupOtp}
                    disabled={loading}
                    className="rounded-lg border border-indigo-300/30 bg-indigo-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send OTP
                  </button>
                </div>
              </label>
              {signupOtpSent && (
                <label className="block text-sm text-slate-200">
                  Enter OTP
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={signupOtp}
                      onChange={(event) => setSignupOtp(event.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                      placeholder="6-digit OTP"
                    />
                    <button
                      type="button"
                      onClick={handleVerifySignupOtp}
                      disabled={loading}
                      className="rounded-lg border border-emerald-300/30 bg-emerald-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify
                    </button>
                  </div>
                </label>
              )}
              <label className="block text-sm text-slate-200">
                Password
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  disabled={!signupOtpVerified}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Minimum 8 characters"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !signupOtpVerified}
                className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              {signupMessage && (
                <p className="text-sm text-indigo-200">{signupMessage}</p>
              )}
            </form>
          )}

          {view === 'forgot' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <h3 className="text-xl font-semibold">Reset Password</h3>
              <label className="block text-sm text-slate-200">
                Email ID
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                    placeholder="Enter your email"
                  />
                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={loading}
                    className="rounded-lg border border-indigo-300/30 bg-indigo-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send OTP
                  </button>
                </div>
              </label>
              {forgotOtpSent && (
                <label className="block text-sm text-slate-200">
                  OTP
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(event) => setForgotOtp(event.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring"
                      placeholder="Enter OTP"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyForgotOtp}
                      disabled={loading}
                      className="rounded-lg border border-emerald-300/30 bg-emerald-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify
                    </button>
                  </div>
                </label>
              )}
              <label className="block text-sm text-slate-200">
                New Password
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(event) => setForgotNewPassword(event.target.value)}
                  disabled={!forgotOtpVerified}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-3 text-sm outline-none ring-indigo-400/40 transition focus:ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter new password"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !forgotOtpVerified}
                className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Change Password
              </button>
              {forgotMessage && (
                <p className="text-sm text-indigo-200">{forgotMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
