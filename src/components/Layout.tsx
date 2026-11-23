import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n, type Lang } from '../lib/i18n'
import { isBuilderOrContractor } from '../types'

const NAV: [string, string, string][] = [
  ['/', 'Home', 'Home'],
  ['/builders', 'Builders', 'Builders'],
  ['/workers', 'Workers', 'Workers'],
  ['/track', 'Track', 'Track'],
  ['/estimator', 'Cost', 'Cost'],
  ['/materials', 'Mat', 'Materials'],
]

export default function Layout() {
  const { t, lang, setLang } = useI18n()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  const link = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-2 xl:px-3.5 py-1 text-xs font-semibold transition ${isActive
      ? 'bg-[#1554C8] text-white shadow-sm'
      : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`

  const isBuilder = isBuilderOrContractor(user?.role)
  const isWorker = user?.role === 'Worker'
  const isArchitect = user?.role === 'Architect / Engineer'
  const hideCommonNav = isBuilder || isWorker || isArchitect

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F7FC] dark:bg-[#071328] dark:text-slate-100 transition-colors duration-200">
      {/* Floating Capsule Navbar with Clean Light / Dark Header */}
      <header className="sticky top-0 z-50 bg-[#F4F7FC]/90 dark:bg-[#030e20] backdrop-blur-md px-2 sm:px-3 xl:px-6 pt-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80 transition-colors">
        <div className={`mx-auto ${hideCommonNav ? 'max-w-[1536px]' : 'max-w-7xl'} rounded-full bg-white dark:bg-[#0c1b38] shadow-sm border border-slate-200 dark:border-slate-800/80 pl-3 sm:pl-4 xl:pl-6 pr-4 sm:pr-6 xl:pr-7 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 xl:gap-3`}>
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm xl:text-base font-black text-slate-900 dark:text-white tracking-tight">
            <div className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7900] to-amber-500 text-white shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span>
              BuildConnect <span className="text-[#FF7900] font-extrabold">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links (Hidden for dedicated environments: Builder, Worker, Architect) */}
          {!hideCommonNav && (
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink-0">
              {NAV.map(([to, k, shortK]) => (
                <NavLink key={to} to={to} end={to === '/'} className={link}>
                  <span className="hidden xl:inline">{t(k)}</span>
                  <span className="xl:hidden">{lang === 'en' ? shortK : t(shortK)}</span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right Action Items */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
            {/* Language Selector Dropdown (combobox[0] for test compatibility) */}
            <div className="relative shrink-0 flex items-center">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                aria-label="Language"
                className="appearance-none rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#08152b] pl-4 sm:pl-5 pr-3 sm:pr-4 py-0.5 text-[0.68rem] xl:text-[0.7rem] font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
              </select>
              <span className="pointer-events-none absolute left-1 sm:left-1.5 text-[0.68rem] text-slate-500">🌐</span>
              <span className="pointer-events-none absolute right-1 text-[0.6rem] text-slate-400">▾</span>
            </div>

            {/* Light / Dark Mode Toggle with Sun & Moon Icons */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex shrink-0 items-center justify-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition"
            >
              {theme === 'dark' ? (
                <>
                  <span className="text-amber-400 text-sm leading-none" role="img" aria-label="Sun">☀️</span>
                  <span className="hidden xl:inline text-[0.68rem] font-bold">{t('Light Mode')}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-500 text-sm leading-none" role="img" aria-label="Moon">🌙</span>
                  <span className="hidden xl:inline text-[0.68rem] font-bold">{t('Dark Mode')}</span>
                </>
              )}
            </button>

            {/* Dashboard Button */}
            <Link
              to="/dashboard"
              className={`${hideCommonNav ? 'inline-flex' : 'hidden sm:inline-flex'} shrink-0 whitespace-nowrap rounded-full bg-[#1554C8] hover:bg-blue-700 px-2.5 xl:px-3.5 py-0.5 text-xs font-bold text-white shadow-sm transition`}
            >
              {t('Dash')}
            </Link>

            {/* Customer Messages Option */}
            {user?.role === 'Customer' && (
              <Link
                to="/dashboard?tab=messages"
                className="hidden sm:inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 xl:px-3 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-xs transition"
              >
                <span>💬</span>
                <span>{t('Messages')}</span>
              </Link>
            )}

            {/* Architect Profile / Status on the right */}
            {isArchitect && user && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 text-xs font-semibold text-[#1554C8] dark:text-blue-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1554C8] text-white text-[0.62rem] font-black">
                  Ar
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold truncate max-w-[140px]">{user.name}</span>
                <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 font-normal hidden lg:inline">({user.coaReg || 'COA Reg'})</span>
              </div>
            )}

            {/* Logout / Login Button */}
            {user ? (
              <button
                onClick={async () => {
                  await logout()
                  nav('/')
                }}
                className={`${hideCommonNav ? 'inline-flex' : 'hidden sm:inline-flex'} shrink-0 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 px-2.5 xl:px-3 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition`}
              >
                {t('Logout')}
              </button>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex shrink-0 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 px-2.5 xl:px-3 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t('Login')}
              </Link>
            )}

            {/* Mobile / Tablet Menu Toggle Button (Not needed for dedicated dashboards) */}
            {!hideCommonNav && (
              <button
                className="lg:hidden shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm transition ml-0.5"
                aria-label="Menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
              >
                {open ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Nav */}
        {!hideCommonNav && open && (
          <div className="mx-auto max-w-7xl mt-2 p-3 bg-white dark:bg-[#0c1b38] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
              {NAV.map(([to, k]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-xs font-semibold transition ${isActive ? 'bg-[#1554C8] text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {t(k)}
                </NavLink>
              ))}

              <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('Theme')}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTheme()
                  }}
                  aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  {theme === 'dark' ? `☀️ ${t('Light Mode')}` : `🌙 ${t('Dark Mode')}`}
                </button>
              </div>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {/* Mobile direct links to Dashboard and Auth */}
              <div className="flex sm:hidden items-center gap-2 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center rounded-xl bg-[#1554C8] py-2 text-xs font-bold text-white shadow-sm"
                >
                  {t('Dash')}
                </Link>
                {user?.role === 'Customer' && (
                  <Link
                    to="/dashboard?tab=messages"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-xs"
                  >
                    💬 {t('Messages')}
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={async () => {
                      await logout()
                      nav('/')
                    }}
                    className="flex-1 text-center rounded-xl border border-slate-300 dark:border-slate-700 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {t('Logout')}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex-1 text-center rounded-xl border border-slate-300 dark:border-slate-700 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {t('Login')}
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Clean Light / Dark Footer */}
      <footer className="mt-16 bg-white dark:bg-[#030e20] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-blue-100 transition-colors">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-2 text-lg font-extrabold text-slate-900 dark:text-white">
              BuildConnect <span className="text-[#FF7900] dark:text-orange-400">AI</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-blue-100/90">
              A construction platform connecting customers, builders and workers, with AI to simplify hiring, tracking, estimating and smart purchasing.
            </p>
          </div>
          <div>
            <div className="mb-2 font-bold text-slate-900 dark:text-white">{t('Our Services')}</div>
            <ul className="space-y-1">
              {NAV.slice(1).map(([to, k]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-blue-600 dark:hover:text-white transition">{t(k)}</Link>
                </li>
              ))}
              <li>
                <Link to="/assistant" className="hover:text-blue-600 dark:hover:text-white transition">{t('Voice help')}</Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-blue-600 dark:hover:text-white transition">{t('Safety & reports')}</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-bold text-slate-900 dark:text-white">{t('Contact Us')}</div>
            <p className="leading-relaxed text-slate-600 dark:text-blue-100/90">
              support@buildconnect.example
              <br />
              Hyderabad, India (demo)
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
