// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider, useI18n } from './lib/i18n'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ArchitectDashboard from './components/dashboards/ArchitectDashboard'
import ContractorDashboard from './components/dashboards/ContractorDashboard'
import WorkerDashboard from './components/dashboards/WorkerDashboard'
import type { UserProfile } from './types'

const customerUser: UserProfile = {
  uid: 'u-cust-1',
  email: 'customer@example.com',
  name: 'Sirisha Reddy',
  role: 'Customer',
  city: 'Hyderabad',
  phone: '+91 98480 12345',
}

const architectUser: UserProfile = {
  uid: 'u-arch-1',
  email: 'architect@example.com',
  name: 'Ar. Rajesh Kumar',
  role: 'Architect / Engineer',
  city: 'Hyderabad',
  phone: '+91 98480 54321',
  qualifications: 'B.Arch, Structural Consultant',
  coaReg: 'CA/2019/12345',
}

const contractorUser: UserProfile = {
  uid: 'u-cont-1',
  email: 'contractor@example.com',
  name: 'Venkat Subbaiah',
  role: 'Contractor',
  city: 'Hyderabad',
  phone: '+91 98480 88888',
  specialization: 'Civil & Structural Sub-Contractor',
}

const workerUser: UserProfile = {
  uid: 'u-work-1',
  email: 'worker@example.com',
  name: 'Krishna Varma',
  role: 'Worker',
  city: 'Hyderabad',
  phone: '+91 98480 77777',
  skill: 'Mason',
}

describe('Full Language Switching Functionality (English, Telugu, Hindi)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    document.documentElement.removeAttribute('data-lang')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.lang = 'en'
    document.documentElement.removeAttribute('data-lang')
  })

  it('1. English is default language and persists selected language in localStorage', async () => {
    function LangConsumer() {
      const { lang, setLang, t } = useI18n()
      return (
        <div>
          <span data-testid="current-lang">{lang}</span>
          <span data-testid="greeting">{t('Customer Portal')}</span>
          <button onClick={() => setLang('te')}>Switch to Telugu</button>
          <button onClick={() => setLang('hi')}>Switch to Hindi</button>
        </div>
      )
    }

    render(
      <I18nProvider>
        <LangConsumer />
      </I18nProvider>
    )

    // Default is English
    expect(screen.getByTestId('current-lang').textContent).toBe('en')
    expect(screen.getByTestId('greeting').textContent).toBe('Customer Portal')
    expect(document.documentElement.lang).toBe('en')

    // Switch to Telugu
    fireEvent.click(screen.getByText('Switch to Telugu'))
    expect(screen.getByTestId('current-lang').textContent).toBe('te')
    expect(screen.getByTestId('greeting').textContent).toBe('కస్టమర్ పోర్టల్')
    expect(localStorage.getItem('bc-lang')).toBe('te')
    expect(document.documentElement.lang).toBe('te')

    // Switch to Hindi
    fireEvent.click(screen.getByText('Switch to Hindi'))
    expect(screen.getByTestId('current-lang').textContent).toBe('hi')
    expect(screen.getByTestId('greeting').textContent).toBe('ग्राहक पोर्टल')
    expect(localStorage.getItem('bc-lang')).toBe('hi')
    expect(document.documentElement.lang).toBe('hi')
  })

  it('2. Navigation header translates all links when selecting Telugu or Hindi', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <Layout />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    const langSelect = screen.getByLabelText('Language') as HTMLSelectElement
    expect(langSelect.value).toBe('en')

    // Check English nav items exist
    expect(screen.getAllByText('Find Builders').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hire Workers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Track Progress').length).toBeGreaterThan(0)

    // Switch to Telugu
    fireEvent.change(langSelect, { target: { value: 'te' } })

    await waitFor(() => {
      expect(screen.getAllByText('బిల్డర్లను కనుగొనండి').length).toBeGreaterThan(0)
      expect(screen.getAllByText('కార్మికులను నియమించండి').length).toBeGreaterThan(0)
      expect(screen.getAllByText('పురోగతి ట్రాక్').length).toBeGreaterThan(0)
      expect(screen.getByText('మా సేవలు')).toBeTruthy()
      expect(screen.getByText('మమ్మల్ని సంప్రదించండి')).toBeTruthy()
    })

    // Switch to Hindi
    fireEvent.change(langSelect, { target: { value: 'hi' } })

    await waitFor(() => {
      expect(screen.getAllByText('बिल्डर खोजें').length).toBeGreaterThan(0)
      expect(screen.getAllByText('कारीगर नियुक्त करें').length).toBeGreaterThan(0)
      expect(screen.getAllByText('प्रगति ट्रैक').length).toBeGreaterThan(0)
      expect(screen.getByText('हमारी सेवाएँ')).toBeTruthy()
      expect(screen.getByText('संपर्क करें')).toBeTruthy()
    })
  })

  it('3. Homepage content translates completely in Telugu and Hindi', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <Home />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    // English check
    expect(
      screen.getByText('Find Builders, Hire Workers, Track Every Step, Build Your Dreams!')
    ).toBeTruthy()

    // Clean up and render with Telugu
    cleanup()
    localStorage.setItem('bc-lang', 'te')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <Home />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('బిల్డర్లను కనుగొనండి, కార్మికులను నియమించండి, ప్రతి అడుగు ట్రాక్ చేయండి, మీ కలలను సాకారం చేసుకోండి!')
      ).toBeTruthy()
      expect(screen.getByText('తెలివైన నిర్మాణం. పటిష్టమైన భవిష్యత్తు')).toBeTruthy()
      expect(screen.getByText('బిల్డర్లు & కాంట్రాక్టర్ల నియామకం')).toBeTruthy()
      expect(screen.getByText('కార్మికుల నియామకం')).toBeTruthy()
      expect(screen.getByText('ప్రాజెక్ట్ ట్రాకింగ్')).toBeTruthy()
    })

    // Clean up and render with Hindi
    cleanup()
    localStorage.setItem('bc-lang', 'hi')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <Home />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('बिल्डर खोजें, कारीगर नियुक्त करें, हर कदम ट्रैक करें, अपना सपना बनाएं!')
      ).toBeTruthy()
      expect(screen.getByText('बेहतर निर्माण। मजबूत भविष्य')).toBeTruthy()
      expect(screen.getByText('बिल्डर और ठेकेदार भर्ती')).toBeTruthy()
      expect(screen.getByText('कारीगर भर्ती')).toBeTruthy()
      expect(screen.getByText('प्रोजेक्ट ट्रैकिंग')).toBeTruthy()
    })
  })

  it('4. Customer Dashboard translates interface while keeping user name unchanged', async () => {
    localStorage.setItem('bc-lang', 'te')
    localStorage.setItem('bc-active-user-v2', JSON.stringify(customerUser))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(customerUser))

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/dashboard']}>
                <Dashboard />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      // Interface label in Telugu
      expect(screen.getByText('కస్టమర్ పోర్టల్')).toBeTruthy()
      expect(screen.getByText(/తిరిగి స్వాగతం/)).toBeTruthy()

      // User's name must NOT be translated
      expect(screen.getByText('Sirisha Reddy')).toBeTruthy()

      // Buttons in Telugu
      expect(screen.getByText('+ బిల్డర్‌ను బుక్ చేయండి')).toBeTruthy()
      expect(screen.getByText('+ కార్మికుడిని బుక్ చేయండి')).toBeTruthy()
    })
  })

  it('5. Architect Dashboard translates interface in Telugu and Hindi while keeping qualifications & name intact', async () => {
    localStorage.setItem('bc-lang', 'te')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/dashboard']}>
                <ArchitectDashboard user={architectUser} />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('తిరిగి స్వాగతం, ఆర్కిటెక్ట్!')).toBeTruthy()
      expect(screen.getByText('“రూపకల్పన. ప్రణాళిక. మెరుగైన రేపటి నిర్మాణం.”')).toBeTruthy()
      // Architect name remains untouched
      expect(screen.getByText('Ar. Rajesh Kumar')).toBeTruthy()
    })

    // Now test in Hindi
    cleanup()
    localStorage.setItem('bc-lang', 'hi')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/dashboard']}>
                <ArchitectDashboard user={architectUser} />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('वापसी पर स्वागत है, आर्किटेक्ट!')).toBeTruthy()
      expect(screen.getByText('“डिज़ाइन। योजना। एक बेहतर कल का निर्माण।”')).toBeTruthy()
      expect(screen.getByText('Ar. Rajesh Kumar')).toBeTruthy()
    })
  })

  it('6. Contractor and Worker Dashboards translate while preserving names & skills', async () => {
    localStorage.setItem('bc-lang', 'te')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/dashboard']}>
                <ContractorDashboard user={contractorUser} />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('కాంట్రాక్టర్ ఆపరేషన్స్ కన్సోల్')).toBeTruthy()
      expect(screen.getByText('సైట్ పర్యవేక్షణ & కార్మిక బృందం')).toBeTruthy()
      expect(screen.getByText('Venkat Subbaiah')).toBeTruthy()
    })

    cleanup()
    localStorage.setItem('bc-lang', 'te')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/dashboard']}>
                <WorkerDashboard user={workerUser} />
              </MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/తిరిగి స్వాగతం/)).toBeTruthy()
      expect(screen.getByText('Krishna Varma')).toBeTruthy()
    })
  })

  it('7. Prefix, icon, count, and punctuation normalization works seamlessly', async () => {
    function NormTestComponent() {
      const { t } = useI18n()
      return (
        <div>
          <span data-testid="t1">{t('📋 Assigned Projects')}</span>
          <span data-testid="t2">{t('⚠️ Absence & Replacements')}</span>
          <span data-testid="t3">{t('All (10)')}</span>
          <span data-testid="t4">{t('Budget:')}</span>
          <span data-testid="t5">{t('+ Start Designing')}</span>
          <span data-testid="t6">{t('Get Started →')}</span>
        </div>
      )
    }

    // In Telugu
    localStorage.setItem('bc-lang', 'te')
    render(
      <I18nProvider>
        <NormTestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('t1').textContent).toBe('📋 కేటాయించిన ప్రాజెక్ట్‌లు')
    expect(screen.getByTestId('t2').textContent).toBe('⚠️ గైర్హాజరు & ప్రత్యామ్నాయాలు')
    expect(screen.getByTestId('t3').textContent).toBe('అన్నీ (10)')
    expect(screen.getByTestId('t4').textContent).toBe('బడ్జెట్:')
    expect(screen.getByTestId('t5').textContent).toBe('+ డిజైనింగ్ ప్రారంభించండి')
    expect(screen.getByTestId('t6').textContent).toBe('ప్రారంభించండి →')

    // In Hindi
    cleanup()
    localStorage.setItem('bc-lang', 'hi')
    render(
      <I18nProvider>
        <NormTestComponent />
      </I18nProvider>
    )

    expect(screen.getByTestId('t1').textContent).toBe('📋 सौंपी गई परियोजनाएँ')
    expect(screen.getByTestId('t2').textContent).toBe('⚠️ अनुपस्थिति और प्रतिस्थापन')
    expect(screen.getByTestId('t3').textContent).toBe('सभी (10)')
    expect(screen.getByTestId('t4').textContent).toBe('बजट:')
    expect(screen.getByTestId('t5').textContent).toBe('+ डिजाइनिंग शुरू करें')
    expect(screen.getByTestId('t6').textContent).toBe('शुरू करें →')
  })

  it('8. Dynamic user data, phone numbers, emails, project IDs, and currencies are protected from translation', async () => {
    function ProtectedDataComponent() {
      return (
        <div>
          <div data-testid="email">customer@buildconnect.ai</div>
          <div data-testid="phone">+91 98480 99999</div>
          <div data-testid="project-id">PRJ-2026-004</div>
          <div data-testid="license">CA/2021/77102</div>
          <div data-testid="currency">₹1,79,50,000</div>
          <div data-testid="unit-price">₹390 / bag</div>
          <div data-testid="user-desc" data-no-translate="true">
            Custom client brief: We want a 3BHK duplex with spacious terrace garden.
          </div>
        </div>
      )
    }

    localStorage.setItem('bc-lang', 'te')
    render(
      <I18nProvider>
        <ProtectedDataComponent />
      </I18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('email').textContent).toBe('customer@buildconnect.ai')
      expect(screen.getByTestId('phone').textContent).toBe('+91 98480 99999')
      expect(screen.getByTestId('project-id').textContent).toBe('PRJ-2026-004')
      expect(screen.getByTestId('license').textContent).toBe('CA/2021/77102')
      expect(screen.getByTestId('currency').textContent).toBe('₹1,79,50,000')
      expect(screen.getByTestId('unit-price').textContent).toBe('₹390 / bag')
      expect(screen.getByTestId('user-desc').textContent).toContain('Custom client brief')
    })
  })
})
