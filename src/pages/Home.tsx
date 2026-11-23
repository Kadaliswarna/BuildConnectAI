import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

export default function Home() {
  const { t } = useI18n()

  return (
    <div className="relative overflow-hidden w-full">
      {/* HERO SECTION - Clean Light in Light Mode, Rich Navy in Dark Mode */}
      <section
        className="relative bg-gradient-to-b from-blue-50/90 via-slate-50/60 to-[#F4F7FC] dark:bg-[linear-gradient(135deg,#051b44_0%,#08265b_45%,#1554c8_100%)] text-slate-900 dark:text-white pt-6 sm:pt-10 pb-20 sm:pb-28 lg:pb-32 overflow-hidden transition-colors duration-200"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[36rem] h-[36rem] rounded-full bg-blue-400/10 dark:bg-blue-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-80 h-80 rounded-full bg-[#FF7900]/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Description, CTAs */}
            <div className="lg:col-span-7 space-y-5 z-10 text-left">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-white/20 bg-blue-50 dark:bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#1554C8] dark:text-white/95 backdrop-blur-md shadow-xs">
                <span className="text-amber-500">⚡</span>
                <span>{t('Smarter Construction. Stronger Tomorrow')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.85rem] xl:text-[3.25rem] font-black text-slate-900 dark:text-white leading-[1.12] tracking-tight">
                {t('tag')}
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-sm sm:text-base text-slate-600 dark:text-blue-100/90 leading-relaxed font-normal">
                {t('One place for customers, builders and workers: hire, coordinate and follow every stage of a build in English, Telugu or हिन्दी.')}
              </p>

              {/* CTA Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF7900] to-amber-500 hover:from-[#e06b00] hover:to-amber-600 px-6 sm:px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>🔍</span>
                  <span>{t('start')} →</span>
                </Link>
                <button
                  type="button"
                  onClick={() => document.getElementById('feature-cards')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/30 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 px-6 sm:px-7 py-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>▶</span>
                  <span>{t('explore')}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Large High-Quality Architectural Construction Image */}
            <div className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-none aspect-[16/10] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/11] rounded-2xl lg:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,38,91,0.15)] dark:shadow-[0_20px_50px_rgba(4,23,56,0.45)] border border-slate-200/80 dark:border-white/20 bg-white dark:bg-slate-900/40 backdrop-blur-sm group">
                <img
                  src="/hero-architecture-hd.jpg"
                  alt="Modern Architecture and Construction Engineering"
                  className="w-full h-full object-cover object-center transform transition duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />
                {/* Subtle depth gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Floating Architectural Status Badges */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs text-white shadow-lg">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-slate-100">{t('Smart Villa Construction')}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-xl bg-[#FF7900]/90 backdrop-blur-md border border-orange-400/30 px-2.5 py-1 text-[0.7rem] font-bold text-white shadow-lg">
                    <span>⚡ {t('AI Monitored')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smooth Organic Wave Divider at bottom of Hero */}
        <div className="absolute inset-x-0 bottom-0 leading-none overflow-hidden pointer-events-none">
          <svg
            className="relative block w-full h-12 sm:h-20 text-[#F4F7FC] dark:text-[#071328] transition-colors"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C320,110 760,120 1440,30 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* 3 FLOATING ACTION FEATURE CARDS */}
      <section id="feature-cards" className="relative -mt-10 sm:-mt-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {/* Card 1: Builder & Contractor Hiring */}
          <Link
            to="/builders"
            className="group relative flex flex-col justify-between rounded-2xl xl:rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(8,38,91,0.08)] hover:shadow-[0_20px_40px_rgba(8,38,91,0.15)] border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 h-full min-h-[160px]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-2xl shadow-inner border border-blue-100/60">
                👷
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition tracking-tight">
                  {t('Builder & Contractor Hiring')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {t('Find verified builders and contractors near you.')}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                {t('Explore Builders')}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs group-hover:bg-[#1554C8] group-hover:text-white transition shadow-sm">
                →
              </div>
            </div>
          </Link>

          {/* Card 2: Worker Hiring */}
          <Link
            to="/workers"
            className="group relative flex flex-col justify-between rounded-2xl xl:rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(8,38,91,0.08)] hover:shadow-[0_20px_40px_rgba(8,38,91,0.15)] border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 h-full min-h-[160px]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF7900] text-2xl shadow-inner border border-orange-100/60">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition tracking-tight">
                  {t('Worker Hiring')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {t('Get skilled and verified workers for your project.')}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7900] group-hover:underline">
                {t('Find Workers')}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#FF7900] font-bold text-xs group-hover:bg-[#FF7900] group-hover:text-white transition shadow-sm">
                →
              </div>
            </div>
          </Link>

          {/* Card 3: Project Tracking */}
          <Link
            to="/track"
            className="group relative flex flex-col justify-between rounded-2xl xl:rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(8,38,91,0.08)] hover:shadow-[0_20px_40px_rgba(8,38,91,0.15)] border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 h-full min-h-[160px]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-2xl shadow-inner border border-emerald-100/60">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition tracking-tight">
                  {t('Project Tracking')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {t('Monitor work progress in real-time.')}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 group-hover:underline">
                {t('Track Milestones')}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Centered Scroll Indicator */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => document.getElementById('platform-overview')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label="Scroll to platform overview"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-orange-500 transition-all transform hover:scale-110"
          >
            <span className="text-xs font-bold">↓</span>
          </button>
        </div>
      </section>

      {/* PLATFORM OVERVIEW & ADDITIONAL MODULES */}
      <section id="platform-overview" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
            {t('Intelligent Construction Management')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {t('Everything Your Construction Project Needs')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Connecting Customers, Builders, Sub-Contractors, Tradesmen, and Structural Architects on one integrated AI platform.')}
          </p>
        </div>

        {/* Feature Value Pillars */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/estimator" className="card p-5 border border-slate-200/70 bg-white space-y-2 hover:border-blue-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-xl font-bold">
              🧮
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{t('Cost')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('Calculate material, labour, and finishing budget estimates based on plot area and floors.')}
            </p>
          </Link>

          <Link to="/materials" className="card p-5 border border-slate-200/70 bg-white space-y-2 hover:border-blue-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-xl font-bold">
              📈
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{t('Price Forecasting Engine')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('Predict future prices of cement, steel, sand, and bricks. Get clear BUY NOW or WAIT advice with estimated savings.')}
            </p>
          </Link>

          <Link to="/dashboard" className="card p-5 border border-slate-200/70 bg-white space-y-2 hover:border-blue-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 text-xl font-bold">
              🚨
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{t('Emergency Worker Dispatch')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('When a worker is unable to attend, our emergency engine instantly dispatches alternative available workers in the same city.')}
            </p>
          </Link>

          <Link to="/assistant" className="card p-5 border border-slate-200/70 bg-white space-y-2 hover:border-blue-300 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xl font-bold">
              🎙️
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{t('Multilingual Voice AI')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('Speak naturally in Telugu ("నాకు ఇద్దరు మేస్త్రీలు కావాలి"), Hindi, or English to find workers, track jobs, and calculate wages.')}
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
