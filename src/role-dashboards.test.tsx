// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './lib/i18n'
import type { UserProfile } from './types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const TEST_PROFILES: Record<string, UserProfile> = {
  'customer@gmail.com': {
    uid: 'u-cust',
    email: 'customer@gmail.com',
    name: 'Demo Customer',
    role: 'Customer',
    phone: '+91 98765 43210',
    city: 'Hyderabad',
    verified: true,
  },
  'architect@gmail.com': {
    uid: 'u-arch',
    email: 'architect@gmail.com',
    name: 'Ar. Priya Sharma',
    role: 'Architect / Engineer',
    phone: '+91 98123 45678',
    city: 'Hyderabad',
    qualifications: 'B.Arch, Structural Consultant',
    coaReg: 'CA/2018/98421',
    experienceYears: 11,
    verified: true,
  },
  'builder@gmail.com': {
    uid: 'u-bld',
    email: 'builder@gmail.com',
    name: 'BuildCraft Infra',
    role: 'Builder',
    phone: '+91 94401 23456',
    city: 'Hyderabad',
    companyName: 'BuildCraft Infrastructure Pvt Ltd',
    experienceYears: 14,
    verified: true,
  },
  'contractor@gmail.com': {
    uid: 'u-cont',
    email: 'contractor@gmail.com',
    name: 'Venkateshwara Civil Contractors',
    role: 'Contractor',
    phone: '+91 98480 11223',
    city: 'Hyderabad',
    specialization: 'Civil & Structural Sub-Contractor',
    experienceYears: 12,
    verified: true,
  },
  'builder-contractor@gmail.com': {
    uid: 'u-bld-cont',
    email: 'builder-contractor@gmail.com',
    name: 'Sri Sai Infra & Civil Contractors',
    role: 'Builder / Contractor',
    phone: '+91 94401 99887',
    city: 'Hyderabad',
    companyName: 'Sri Sai Turnkey Construction Pvt Ltd',
    specialization: 'Turnkey Residential Construction & Civil Contracting',
    experienceYears: 15,
    verified: true,
  },
  'worker@gmail.com': {
    uid: 'u-wrk',
    email: 'worker@gmail.com',
    name: 'Ramesh Kumar',
    role: 'Worker',
    phone: '+91 91234 56789',
    city: 'Hyderabad',
    skill: 'Mason',
    experienceYears: 10,
    verified: true,
  },
}

function renderDashboardWithUser(email: string) {
  const profile = TEST_PROFILES[email]
  localStorage.setItem('bc-active-user-v2', JSON.stringify(profile))
  localStorage.setItem('bc-active-user-v1', JSON.stringify(profile))

  return render(
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
}

function renderAppWithUser(email?: string, path = '/dashboard') {
  if (email) {
    const profile = TEST_PROFILES[email]
    localStorage.setItem('bc-active-user-v2', JSON.stringify(profile))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(profile))
  } else {
    localStorage.clear()
  }

  return render(
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route index element={<div>Public Home</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

describe('Role-Based Dashboards and Clean User Experience', () => {
  it('1. Customer sees the preserved Customer Dashboard without demo role-switcher bar', async () => {
    renderDashboardWithUser('customer@gmail.com')

    // Verifies the preserved Customer Portal sections
    expect(await screen.findByText('Customer Portal')).toBeTruthy()
    expect(screen.getAllByText('Demo Customer').length).toBeGreaterThan(0)
    expect(screen.getByText(/Manage your bookings, requests, and direct chat/)).toBeTruthy()

    // Verifies the Customer-Architect integration section
    expect(screen.getByText('Architectural Design & Planning Requests')).toBeTruthy()

    // Ensures demo toolbar is NOT displayed
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
    expect(screen.queryByText(/Switch Role Demo/i)).toBeNull()
  })

  it('2. Architect sees the Architect Dashboard without demo role-switcher bar', async () => {
    renderDashboardWithUser('architect@gmail.com')

    expect(await screen.findByText('Architectural & Structural Engineering Suite')).toBeTruthy()
    expect(screen.getByText('Ar. Priya Sharma')).toBeTruthy()
    expect(screen.getByText(/Dashboard Overview/)).toBeTruthy()
    expect(screen.getAllByText(/Customer Requests/).length).toBeGreaterThan(0)

    // Ensures demo toolbar is NOT displayed
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
    expect(screen.queryByText(/Switch Role Demo/i)).toBeNull()
  })

  it('3. Builder sees the Builder Dashboard', async () => {
    renderDashboardWithUser('builder@gmail.com')

    expect((await screen.findAllByText(/BuildCraft Infra/)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
    expect(screen.queryByText(/Switch Role Demo/i)).toBeNull()
  })

  it('4. Contractor sees the Contractor Dashboard', async () => {
    renderDashboardWithUser('contractor@gmail.com')

    expect(await screen.findByText(/Venkateshwara Civil Contractors/)).toBeTruthy()
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
    expect(screen.queryByText(/Switch Role Demo/i)).toBeNull()
  })

  it('5. Worker sees the Worker Dashboard', async () => {
    renderDashboardWithUser('worker@gmail.com')

    expect(await screen.findByText(/Ramesh Kumar/)).toBeTruthy()
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
    expect(screen.queryByText(/Switch Role Demo/i)).toBeNull()
  })

  it('6. Unified Builder / Contractor role user sees the unified BuilderDashboard with merged modules', async () => {
    renderDashboardWithUser('builder-contractor@gmail.com')

    expect(await screen.findByText(/Sri Sai Infra & Civil Contractors/)).toBeTruthy()
    expect(screen.getByText(/Builder \/ Contractor Operations Console/)).toBeTruthy()
    expect(screen.getByText(/Find & Hire Workers/)).toBeTruthy()
    expect(screen.getByText(/Tasks & Scheduling/)).toBeTruthy()
    expect(screen.getByText(/Attendance Tracking/)).toBeTruthy()
    expect(screen.getByText(/Progress Tracking/)).toBeTruthy()
    expect(screen.queryByText(/CURRENT ACTIVE ROLE/i)).toBeNull()
  })

  it('7. Public website retains original navigation (Home, Builders, Workers, Track, Cost, Materials)', async () => {
    renderAppWithUser(undefined, '/')
    const header = screen.getByRole('banner')

    expect(within(header).getAllByText('Home').length).toBeGreaterThan(0)
    expect(within(header).getByText('Find Builders')).toBeTruthy()
    expect(within(header).getByText('Hire Workers')).toBeTruthy()
    expect(within(header).getByText('Track Progress')).toBeTruthy()
    expect(within(header).getByText('Cost Estimator')).toBeTruthy()
    expect(within(header).getByText('Material Insights')).toBeTruthy()
  })

  it('8. Customer dashboard keeps existing navigation links intact', async () => {
    renderAppWithUser('customer@gmail.com', '/dashboard')

    expect(await screen.findByText('Customer Portal')).toBeTruthy()
    const header = screen.getByRole('banner')
    expect(within(header).getAllByText('Home').length).toBeGreaterThan(0)
    expect(within(header).getByText('Find Builders')).toBeTruthy()
    expect(within(header).getByText('Hire Workers')).toBeTruthy()
    expect(within(header).getByText('Track Progress')).toBeTruthy()
    expect(within(header).getByText('Cost Estimator')).toBeTruthy()
    expect(within(header).getByText('Material Insights')).toBeTruthy()
  })

  it('9. Worker dashboard removes common nav links while keeping worker-specific navigation and features', async () => {
    renderAppWithUser('worker@gmail.com', '/dashboard')

    expect(await screen.findByText(/Ramesh Kumar/)).toBeTruthy()

    // Common nav links are REMOVED from the navigation header
    const header = screen.getByRole('banner')
    expect(within(header).queryByText('Find Builders')).toBeNull()
    expect(within(header).queryByText('Hire Workers')).toBeNull()
    expect(within(header).queryByText('Track Progress')).toBeNull()
    expect(within(header).queryByText('Cost Estimator')).toBeNull()
    expect(within(header).queryByText('Material Insights')).toBeNull()

    // Worker-specific navigation and features are fully kept
    expect(screen.getAllByText(/AI Voice Assistant/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Job Requests/)).toBeTruthy()
    expect(screen.getByText(/Find Daily Jobs/)).toBeTruthy()
    expect(screen.getByText(/Wages & Wallet/)).toBeTruthy()
    expect(screen.getByText(/My Profile & Badges/)).toBeTruthy()
    expect(screen.getAllByText(/Logout/i).length).toBeGreaterThan(0)
  })

  it('10. Architect dashboard removes common nav links while keeping both Architect modules and logout', async () => {
    renderAppWithUser('architect@gmail.com', '/dashboard')

    expect(await screen.findByText('Architectural & Structural Engineering Suite')).toBeTruthy()

    // Common nav links are REMOVED from the navigation header
    const header = screen.getByRole('banner')
    expect(within(header).queryByText('Find Builders')).toBeNull()
    expect(within(header).queryByText('Hire Workers')).toBeNull()
    expect(within(header).queryByText('Track Progress')).toBeNull()
    expect(within(header).queryByText('Cost Estimator')).toBeNull()
    expect(within(header).queryByText('Material Insights')).toBeNull()

    // Module 1: Architectural Design & Engineering features kept
    expect(screen.getAllByText(/Customer Requests/).length).toBeGreaterThan(0)
    expect(screen.getByText(/2D Floor Plans & CAD/)).toBeTruthy()
    expect(screen.getByText(/3D Elevations & Models/)).toBeTruthy()
    expect(screen.getByText(/Design Revisions/)).toBeTruthy()
    expect(screen.getByText(/Structural Inspections/)).toBeTruthy()
    expect(screen.getByText(/Material Takeoff Calc/)).toBeTruthy()
    expect(screen.getByText(/Upload 2D \/ 3D Design/)).toBeTruthy()
    expect(screen.getAllByText(/3D Visualizer/).length).toBeGreaterThan(0)

    // Module 2: Project & Client Management features kept
    expect(screen.getByText(/Dashboard Overview/)).toBeTruthy()
    expect(screen.getAllByText(/Active Projects/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Customer Messages/)).toBeTruthy()
    expect(screen.getByText(/Profile & Qualifications/)).toBeTruthy()
    expect(screen.getAllByText(/Logout/i).length).toBeGreaterThan(0)
  })

  it('11. Builder and Contractor dashboards keep common nav links removed as existing', async () => {
    renderAppWithUser('builder@gmail.com', '/dashboard')
    expect((await screen.findAllByText(/BuildCraft Infra/)).length).toBeGreaterThan(0)
    const header = screen.getByRole('banner')
    expect(within(header).queryByText('Find Builders')).toBeNull()
    expect(within(header).queryByText('Hire Workers')).toBeNull()
  })
})
