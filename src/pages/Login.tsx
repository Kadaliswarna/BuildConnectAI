import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, PageShell } from '../components/ui'
import { useI18n } from '../lib/i18n'
import { authMessage } from '../lib/errors'

export default function Login() {
  const { t } = useI18n()
  const { login, resetPassword } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [busy, setBusy] = useState(false)

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotBusy, setForgotBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast('Please enter both your email address and password', 'err')
      return
    }

    setBusy(true)
    try {
      await login(email.trim(), password)
      toast('Signed in successfully. Welcome!')
      nav((loc.state as { from?: string } | null)?.from ?? '/dashboard')
    } catch (err: any) {
      toast(authMessage(err) || err?.message || 'Login failed. Please verify your credentials.', 'err')
    } finally {
      setBusy(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast('Please enter your registered email address', 'err')
      return
    }

    setForgotBusy(true)
    try {
      await resetPassword(forgotEmail.trim())
      toast(`Password reset link sent to ${forgotEmail.trim()}! Please check your inbox.`)
      setShowForgotModal(false)
      setForgotEmail('')
    } catch (err: any) {
      toast(err?.message || 'Could not send reset link. Verify your email.', 'err')
    } finally {
      setForgotBusy(false)
    }
  }

  return (
    <PageShell title={t('Login')} subtitle={t('Sign in to your personalized construction management dashboard')}>
      <div className="mx-auto max-w-md card p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('email')}>
            <input
              className="inp text-sm"
              type="email"
              required
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label={t('password')}>
            <div className="relative">
              <input
                className="inp text-sm pr-12"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                {showPassword ? t('Hide') : t('Show')}
              </button>
            </div>
          </Field>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-brand focus:ring-brand"
              />
              <span>{t('Remember me')}</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email)
                setShowForgotModal(true)
              }}
              className="font-semibold text-brand hover:underline"
            >
              {t('Forgot password?')}
            </button>
          </div>

          <div className="pt-2">
            <button className="btn w-full py-2.5 text-sm font-bold shadow-md" disabled={busy}>
              {busy ? 'Authenticating…' : t('Login')}
            </button>
          </div>

          {/* Quick 1-Click Demo Login */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              1-Click Demo Sign-In
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setEmail('builder@gmail.com')
                  setPassword('123456')
                }}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-left transition"
              >
                🏗️ <strong>Builder / Contractor</strong>
                <span className="block text-[10px] text-blue-600 font-mono">builder@gmail.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('customer@gmail.com')
                  setPassword('123456')
                }}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition"
              >
                👤 <strong>Customer</strong>
                <span className="block text-[10px] text-slate-500 font-mono">customer@gmail.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('architect@gmail.com')
                  setPassword('123456')
                }}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition"
              >
                📐 <strong>Architect</strong>
                <span className="block text-[10px] text-slate-500 font-mono">architect@gmail.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('worker@gmail.com')
                  setPassword('123456')
                }}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition"
              >
                🔨 <strong>Worker</strong>
                <span className="block text-[10px] text-slate-500 font-mono">worker@gmail.com</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
            Don't have an account?{' '}
            <Link className="font-bold text-brand hover:underline" to="/register">
              Register Now →
            </Link>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-sm p-6 space-y-4 text-xs font-semibold shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-extrabold text-slate-900">Reset Your Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>

            <p className="text-slate-600 font-normal">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <Field label="Registered Email Address">
                <input
                  type="email"
                  required
                  className="inp text-sm"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={forgotBusy}
                  className="btn flex-1 py-2 text-xs"
                >
                  {forgotBusy ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn2 !bg-slate-200 !text-slate-800 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
