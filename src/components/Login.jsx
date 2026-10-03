import { useEffect, useState } from 'react'
import { loginWithPassword, sendOtp, verifyOtp } from '../api'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
const buttonClass =
  'mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50'

const RESEND_SECONDS = 60

function Login({ onLogin }) {
  const [mode, setMode] = useState('otp')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setInfo('')
  }

  const run = async (fn) => {
    setLoading(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = () =>
    run(async () => {
      const data = await sendOtp(phone)
      setOtpSent(true)
      setOtp('')
      setCooldown(RESEND_SECONDS)
      setInfo(data.message)
    })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'password') {
      run(async () => onLogin(await loginWithPassword(phone, password)))
    } else if (!otpSent) {
      handleSendOtp()
    } else {
      run(async () => onLogin(await verifyOtp(phone, otp)))
    }
  }

  const phoneValid = phone.replace(/\D/g, '').length >= 10

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900">Orders admin</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in with your registered mobile number</p>

        <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm">
          {[
            ['otp', 'OTP'],
            ['password', 'Password'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={`rounded-md py-1.5 font-medium ${
                mode === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Mobile number
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setOtpSent(false)
            }}
            placeholder="98765 43210"
            autoFocus
            className={inputClass}
          />
        </label>

        {mode === 'password' && (
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        {mode === 'otp' && otpSent && (
          <>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              OTP
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                autoFocus
                className={`${inputClass} tracking-widest`}
              />
            </label>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500">{info}</span>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={cooldown > 0 || loading}
                className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        {mode === 'password' && (
          <button type="submit" disabled={!phoneValid || !password || loading} className={buttonClass}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        )}
        {mode === 'otp' && !otpSent && (
          <button type="submit" disabled={!phoneValid || loading} className={buttonClass}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        )}
        {mode === 'otp' && otpSent && (
          <button type="submit" disabled={otp.length !== 6 || loading} className={buttonClass}>
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
        )}
      </form>
    </div>
  )
}

export default Login
