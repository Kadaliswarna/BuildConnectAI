// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './lib/i18n'
import type { UserProfile } from './types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const BUILDER_USER: UserProfile = {
  uid: 'u-bld-test',
  email: 'builder@gmail.com',
  name: 'Builder Infra',
  role: 'Builder',
  phone: '+91 98765 00000',
  city: 'Hyderabad',
  companyName: 'Builder Infra Developers',
  experienceYears: 10,
  verified: true,
  bio: 'Commercial and premium residential builder in Telangana and Andhra Pradesh.',
}

function renderBuilderDashboard() {
  localStorage.setItem('bc-active-user-v2', JSON.stringify(BUILDER_USER))
  localStorage.setItem('bc-active-user-v1', JSON.stringify(BUILDER_USER))

  return render(
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}

describe('Builder Dashboard Complete Redesign Verification', () => {
  it('1. Module 1 - Dashboard: renders welcome banner, KPI cards, and project progress list', async () => {
    renderBuilderDashboard()

    // Welcome banner
    expect(await screen.findByText(/Welcome back, Builder Infra!/i)).toBeTruthy()
    expect(screen.getByText(/Build, Manage and Track your Construction Projects/i)).toBeTruthy()
    expect(screen.getByText(/Builder Infra Developers · Hyderabad/i)).toBeTruthy()

    // 4 KPI Cards
    expect(screen.getByText(/Active Projects/i)).toBeTruthy()
    expect(screen.getByText(/Total Expenses/i)).toBeTruthy()
    expect(screen.getByText(/Active Quotations/i)).toBeTruthy()
    expect(screen.getByText(/Material Alerts/i)).toBeTruthy()

    // Construction Projects list with progress percentages
    expect(screen.getByText(/Green Villa Premium Residence/i)).toBeTruthy()
    expect(screen.getByText(/Lakeview Gated Apartments/i)).toBeTruthy()
    expect(screen.getByText(/Madhapur Commercial Complex/i)).toBeTruthy()
    expect(screen.getByText('68%')).toBeTruthy()
    expect(screen.getByText('35%')).toBeTruthy()
    expect(screen.getByText('88%')).toBeTruthy()
  })

  it('2. Module 2 - Project Management: filters projects and opens Add Project modal', async () => {
    renderBuilderDashboard()

    // Switch to Projects tab
    fireEvent.click(screen.getByRole('button', { name: /Projects/i }))

    expect(screen.getByText(/Create, track and manage your construction projects/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /All Projects/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /In Progress/i })).toBeTruthy()

    // Click Add Project
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Project/i }))
    expect(screen.getByText(/Create Construction Project/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Hyderabad Luxury Villa/i)).toBeTruthy()
  })

  it('3. Module 3 - Workforce Management: displays assigned workers and provides emergency replacement dispatch', async () => {
    renderBuilderDashboard()

    // Switch to Workforce Management tab
    fireEvent.click(screen.getByRole('button', { name: /Workforce Management/i }))

    expect(screen.getByText(/Assign, monitor and manage skilled trades across your active construction sites/i)).toBeTruthy()
    expect(screen.getByText(/Assigned Workers by Project/i)).toBeTruthy()
    expect(screen.getAllByText(/Ramesh K/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Suresh P/i).length).toBeGreaterThan(0)

    // Verify + Assign Worker modal trigger
    expect(screen.getByRole('button', { name: /\+ Assign Worker/i })).toBeTruthy()
  })

  it('4. Module 4 - Expense Management: displays 3 financial category cards and recent expenses', async () => {
    renderBuilderDashboard()

    // Switch to Expenses tab
    fireEvent.click(screen.getByRole('button', { name: /Expenses/i }))

    expect(screen.getByText(/Construction Expense Management/i)).toBeTruthy()
    expect(screen.getByText(/Material Expenses/i)).toBeTruthy()
    expect(screen.getByText(/Labour Wages/i)).toBeTruthy()
    expect(screen.getAllByText(/Equipment/i).length).toBeGreaterThan(0)

    // Recent expense table rows
    expect(screen.getByText(/Ultratech Cement \(400 Bags\)/i)).toBeTruthy()
    expect(screen.getByText(/Tata Tiscon Fe550D Steel/i)).toBeTruthy()
    expect(screen.getByText(/Mason & Shuttering Weekly Wage/i)).toBeTruthy()
  })

  it('5. Module 5 - Quotations: lists client estimates with status tags, download, and send actions', async () => {
    renderBuilderDashboard()

    // Switch to Quotations tab
    fireEvent.click(screen.getByRole('button', { name: /Quotations/i }))

    expect(screen.getByText(/Client Quotations & Estimates/i)).toBeTruthy()
    expect(screen.getByText(/3BHK Duplex Construction/i)).toBeTruthy()
    expect(screen.getAllByText(/Approved/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Independent House Renovation & 2nd Floor/i)).toBeTruthy()
    expect(screen.getAllByText(/Sent/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Download PDF/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Send to Client/i).length).toBeGreaterThan(0)
  })

  it('6. Module 6 - Materials: shows 4 AI material cards with buy advice, forecast, and savings', async () => {
    renderBuilderDashboard()

    // Switch to Materials tab
    fireEvent.click(screen.getByRole('button', { name: /Materials/i }))

    expect(screen.getByText(/AI Construction Material Price Intelligence/i)).toBeTruthy()
    expect(screen.getByText(/Cement \(50 kg bag\)/i)).toBeTruthy()
    expect(screen.getByText(/Buy in Bulk/i)).toBeTruthy()
    expect(screen.getByText(/Steel \(Fe550D TMT \/ kg\)/i)).toBeTruthy()
    expect(screen.getByText(/Sand \(River Sand \/ cu.ft\)/i)).toBeTruthy()
    expect(screen.getByText(/Wait/i)).toBeTruthy()
    expect(screen.getByText(/Red Clay Bricks \(per brick\)/i)).toBeTruthy()
  })

  it('7. Module 7 - Profile: renders company profile fields, ISO verification, and save action', async () => {
    renderBuilderDashboard()

    // Switch to Profile tab
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }))

    expect(screen.getByText(/Builder Profile & Company Credentials/i)).toBeTruthy()
    expect(screen.getByDisplayValue('Builder Infra')).toBeTruthy()
    expect(screen.getByDisplayValue('Builder Infra Developers')).toBeTruthy()
    expect(screen.getByDisplayValue('Hyderabad')).toBeTruthy()
    expect(screen.getByText(/ISO 9001:2015 Verified General Contractor/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeTruthy()
  })

  it('8. Top Navbar for Builder: contains only logo, language selector, dashboard and logout, hiding public links', async () => {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(BUILDER_USER))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(BUILDER_USER))

    render(
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/dashboard']}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    )

    const header = await screen.findByRole('banner')
    const headerWithin = within(header)

    // BuildConnect AI logo exists in header
    expect(headerWithin.getAllByText(/BuildConnect/i).length).toBeGreaterThan(0)

    // Language dropdown exists in header
    expect(headerWithin.getByLabelText(/Language/i)).toBeTruthy()

    // Dashboard & Logout buttons exist in header
    expect(headerWithin.getByText(/Dashboard/i)).toBeTruthy()
    expect(headerWithin.getByRole('button', { name: /Logout/i })).toBeTruthy()

    // Public links are NOT present in the top navbar
    expect(headerWithin.queryByRole('link', { name: /Home/i })).toBeNull()
    expect(headerWithin.queryByRole('link', { name: /Builders/i })).toBeNull()
    expect(headerWithin.queryByRole('link', { name: /Workers/i })).toBeNull()
    expect(headerWithin.queryByRole('link', { name: /Track/i })).toBeNull()
    expect(headerWithin.queryByRole('link', { name: /Cost/i })).toBeNull()
    expect(headerWithin.queryByRole('link', { name: /Materials/i })).toBeNull()
  })

  it('9. Project cards have valid image URLs and consistent styling', async () => {
    renderBuilderDashboard()

    const projectImages = screen.getAllByRole('img')
    expect(projectImages.length).toBeGreaterThanOrEqual(3)

    // Verify images use real local asset paths
    const srcList = projectImages.map((img) => img.getAttribute('src'))
    expect(srcList).toContain('/hero-house-clean.png')
    expect(srcList).toContain('/hero-architecture-hd.jpg')
    expect(srcList).toContain('/hero-visual-hd.png')
  })
})
