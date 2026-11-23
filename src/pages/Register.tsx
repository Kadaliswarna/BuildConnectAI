import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field, PageShell } from '../components/ui'
import { useI18n } from '../lib/i18n'
import { authMessage } from '../lib/errors'
import { ROLES, SKILLS, isBuilderOrContractor, type Role, type Skill } from '../types'

export default function Register() {
  const { t } = useI18n()
  const { register } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  // Form states
  const [role, setRole] = useState<Role>('Customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Dynamic role-specific fields
  const [companyName, setCompanyName] = useState('')
  const [companyLocation, setCompanyLocation] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(3)
  const [skill, setSkill] = useState<Skill>('Mason')
  const [qualifications, setQualifications] = useState('')
  const [coaReg, setCoaReg] = useState('')

  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    const isBuilderRole = isBuilderOrContractor(role)

    if (name.trim().length < 2) next.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!/^[0-9+\-\s]{10,15}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit mobile number.'

    const targetCity = isBuilderRole ? companyLocation : city
    if (!targetCity.trim()) {
      if (isBuilderRole) next.companyLocation = 'Enter your company location / city.'
      else next.city = 'Enter your city / location.'
    }

    if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.'

    // Role-specific validation
    if (isBuilderRole && !companyName.trim()) {
      next.companyName = 'Enter your registered company or business name.'
    }
    if (role === 'Architect / Engineer') {
      if (!qualifications.trim()) next.qualifications = 'Enter your architectural or engineering degree/credentials.'
      if (!coaReg.trim()) next.coaReg = 'Enter your Council of Architecture or Engineering License Number.'
    }

    if (!agreeTerms) {
      next.terms = 'You must agree to the Terms of Service & Privacy Policy.'
    }

    setErrs(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setBusy(true)
    const isBuilderRole = isBuilderOrContractor(role)
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        city: (isBuilderRole ? companyLocation : city).trim(),
        role,
        companyName: isBuilderRole ? companyName.trim() : undefined,
        experienceYears: role !== 'Customer' ? Number(experienceYears) || 0 : undefined,
        specialization: isBuilderRole
          ? (specialization.trim() || 'Turnkey Construction & Civil Contracting')
          : role === 'Architect / Engineer'
          ? specialization.trim()
          : undefined,
        skill: role === 'Worker' ? skill : undefined,
        qualifications: role === 'Architect / Engineer' ? qualifications.trim() : undefined,
        coaReg: role === 'Architect / Engineer' ? coaReg.trim() : undefined,
      })
      toast(`Welcome, ${name.trim()}! Your ${role} account was created successfully.`)
      nav('/dashboard')
    } catch (err: any) {
      toast(authMessage(err) || err?.message || 'Registration failed', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell title={t('Create Your BuildConnect AI Account')} subtitle={t("Join India's connected construction platform for customers, builders, contractors, workers, and architects.")}>
      <div className="mx-auto max-w-xl card p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {/* Step 1: Select Your Role */}
          <Field label="Select Your Account Role *">
            <select
              className="inp text-sm font-semibold text-slate-800"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role)
                setErrs({})
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'Customer' && '👤 Customer (Homeowner / Plot Owner)'}
                  {r === 'Builder / Contractor' && '🏗️ Builder / Contractor (General Contractor, Home Builder, Civil Contracting)'}
                  {r === 'Architect / Engineer' && '📐 Architect / Structural Engineer (Licensed Designer)'}
                  {r === 'Worker' && '🔨 Worker / Skilled Craftsman (Mason, Plumber, Painter)'}
                </option>
              ))}
            </select>
          </Field>

          {/* Role explanation pill */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2">
            <span className="text-base">ℹ️</span>
            <div>
              <strong className="block font-bold">Signing up as: {role}</strong>
              <span className="text-[0.72rem] text-blue-800">
                {role === 'Customer' && 'Post projects, request architectural blueprints, find builders & contractors and book skilled workers.'}
                {isBuilderOrContractor(role) && 'Manage turnkey projects, coordinate trade crews, hire skilled workers, track daily attendance, budget expenses, and deliver quality construction.'}
                {role === 'Worker' && 'Accept local daily wage work, use multilingual voice commands and track earnings.'}
                {role === 'Architect / Engineer' && 'Deliver AutoCAD 2D floor plans, 3D elevations, structural audits and collaborate with clients.'}
              </span>
            </div>
          </div>

          {/* Common Field: Full Name */}
          <Field label="Full Name *" error={errs.name}>
            <input
              className="inp"
              placeholder="e.g. Sirisha Reddy, Ar. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>

          {/* Common Field: Email & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email Address *" error={errs.email}>
              <input
                className="inp"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>

            <Field label="Mobile Number *" error={errs.phone}>
              <input
                className="inp"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </Field>
          </div>

          {/* DYNAMIC ROLE FIELDS: Customer */}
          {role === 'Customer' && (
            <Field label="City / Location *" error={errs.city}>
              <input
                className="inp"
                placeholder="e.g. Hyderabad, Bengaluru, Warangal"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </Field>
          )}

          {/* DYNAMIC ROLE FIELDS: Builder / Contractor */}
          {isBuilderOrContractor(role) && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
                Builder / Contractor Company & Trade Details
              </span>
              <Field label="Company / Entity Name *" error={errs.companyName}>
                <input
                  className="inp"
                  placeholder="e.g. BuildCraft Infra Developers & Civil Contractors"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Headquarters / Operating City *" error={errs.companyLocation}>
                  <input
                    className="inp"
                    placeholder="e.g. Hyderabad"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                  />
                </Field>
                <Field label="Years of Experience">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    className="inp"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Field label="Trade Specialization / Scope">
                <input
                  className="inp"
                  placeholder="e.g. Turnkey Residential Construction, Civil & Structural, Electrical & Plumbing"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* DYNAMIC ROLE FIELDS: Worker */}
          {role === 'Worker' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
                Work Craft & Skill
              </span>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary Trade Craft *">
                  <select
                    className="inp"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value as Skill)}
                  >
                    {SKILLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Experience (Years)">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    className="inp"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Field label="Work Location / City *" error={errs.city}>
                <input
                  className="inp"
                  placeholder="e.g. Hyderabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* DYNAMIC ROLE FIELDS: Architect / Engineer */}
          {role === 'Architect / Engineer' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
                Professional Credentials & Licensing
              </span>
              <Field label="Degrees & Qualifications *" error={errs.qualifications}>
                <input
                  className="inp"
                  placeholder="e.g. B.Arch (SPA), M.Tech (IIT Structural Engineering)"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Professional Reg No (COA / License) *" error={errs.coaReg}>
                  <input
                    className="inp font-mono"
                    placeholder="e.g. CA/2021/77102"
                    value={coaReg}
                    onChange={(e) => setCoaReg(e.target.value)}
                  />
                </Field>
                <Field label="Specialization Area">
                  <input
                    className="inp"
                    placeholder="e.g. Vaastu Duplexes, Cantilever Villas"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consulting Office City *" error={errs.city}>
                  <input
                    className="inp"
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Field>
                <Field label="Years in Practice">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    className="inp"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Password & Confirm Password with Visibility Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Password *" error={errs.password}>
              <div className="relative">
                <input
                  className="inp pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password *" error={errs.confirmPassword}>
              <input
                className="inp"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-brand focus:ring-brand"
              />
              <span>
                I agree to BuildConnect AI's{' '}
                <a href="#terms" className="font-bold text-brand hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="font-bold text-brand hover:underline">
                  Privacy Policy
                </a>. I confirm all provided professional and identity credentials are valid.
              </span>
            </label>
            {errs.terms && <p className="err mt-1">{errs.terms}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              aria-label="Register"
              className="btn w-full py-2.5 text-sm font-bold shadow-md"
              disabled={busy}
            >
              {busy ? 'Creating Your Account…' : `Register as ${role}`}
            </button>
          </div>

          {/* Link to Login */}
          <p className="text-center text-xs text-slate-600 pt-2">
            Already have an account?{' '}
            <Link className="font-bold text-brand hover:underline" to="/login">
              {t('Login')}
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  )
}
