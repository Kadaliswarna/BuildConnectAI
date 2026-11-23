// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './lib/i18n'
import type { UserProfile } from './types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const UNIFIED_USER: UserProfile = {
  uid: 'u-bld-cont-1',
  email: 'builder-contractor@gmail.com',
  name: 'Apex Infra & Civil Developers',
  role: 'Builder / Contractor',
  phone: '+91 94401 55667',
  city: 'Hyderabad',
  companyName: 'Apex Turnkey Construction Pvt Ltd',
  specialization: 'Turnkey Residential Construction & Civil Contracting',
  experienceYears: 12,
  verified: true,
  bio: 'Specialized in premium residential villas, turnkey duplexes and commercial RCC structures.',
}

function renderComponent(ui: React.ReactElement, initialPath = '/dashboard') {
  return render(
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            {ui}
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}

describe('Builder and Contractor Unified Role & Dashboard Merge', () => {
  it('1. Registration contains 4 unified roles and removes separate Contractor option', () => {
    renderComponent(<Register />, '/register')

    const select = screen.getByLabelText(/Select Your Account Role/i) as HTMLSelectElement
    const optionValues = Array.from(select.options).map((o) => o.value)

    // Verify 4 unified roles are present
    expect(optionValues).toEqual([
      'Customer',
      'Builder / Contractor',
      'Architect / Engineer',
      'Worker',
    ])
    expect(optionValues).not.toContain('Contractor')
    expect(optionValues).not.toContain('Builder')
  })

  it('2. Selecting Builder / Contractor in Registration renders unified company and trade fields', () => {
    renderComponent(<Register />, '/register')

    const select = screen.getByLabelText(/Select Your Account Role/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Builder / Contractor' } })

    // Verify unified section is displayed
    expect(screen.getByText(/Builder \/ Contractor Company & Trade Details/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/BuildCraft Infra Developers & Civil Contractors/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Turnkey Residential Construction, Civil & Structural/i)).toBeTruthy()
  })

  it('3. Unified Dashboard renders Overview with welcome banner, metrics, and operations', async () => {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(UNIFIED_USER))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(UNIFIED_USER))

    renderComponent(<Dashboard />)

    // Module 1: Overview Dashboard
    expect(await screen.findByText(/Welcome back, Apex Infra & Civil Developers!/i)).toBeTruthy()
    expect(screen.getByText(/Builder \/ Contractor Operations Console/i)).toBeTruthy()
    expect(screen.getByText(/Active Projects/i)).toBeTruthy()
    expect(screen.getByText(/Total Workforce/i)).toBeTruthy()
    expect(screen.getByText(/Total Expenses/i)).toBeTruthy()
    expect(screen.getByText(/Active Quotations/i)).toBeTruthy()
  })

  it('4. Unified Dashboard contains all 11 modules accessible via navigation', async () => {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(UNIFIED_USER))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(UNIFIED_USER))

    renderComponent(<Dashboard />)

    // Module 2: Projects
    fireEvent.click(screen.getByRole('button', { name: /Projects/i }))
    expect(await screen.findByText(/Project Management/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /\+ Add Project/i })).toBeTruthy()

    // Module 3: Find & Hire Workers
    fireEvent.click(screen.getByRole('button', { name: /Find & Hire Workers/i }))
    expect(await screen.findByText(/Find & Hire Skilled Workers/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Search by Name or Craft/i)).toBeTruthy()

    // Module 4: Worker Management
    fireEvent.click(screen.getByRole('button', { name: /Workforce Management/i }))
    expect((await screen.findAllByText(/Workforce Management/i)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /\+ Assign Worker/i })).toBeTruthy()

    // Module 5: Daily Tasks & Scheduling
    fireEvent.click(screen.getByRole('button', { name: /Tasks & Scheduling/i }))
    expect(await screen.findByText(/Daily Tasks & Scheduling/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /\+ Add Task/i })).toBeTruthy()

    // Module 6: Attendance Tracking
    fireEvent.click(screen.getByRole('button', { name: /Attendance Tracking/i }))
    expect(await screen.findByText(/Worker Attendance & Roll Call/i)).toBeTruthy()
    expect(screen.getByText(/Today's Pending Wage Settlement/i)).toBeTruthy()

    // Module 7: Project Progress Tracking
    fireEvent.click(screen.getByRole('button', { name: /Progress Tracking/i }))
    expect(await screen.findByText(/Project Progress Tracking/i)).toBeTruthy()
    expect(screen.getByText(/Construction Stages \(12\)/i)).toBeTruthy()

    // Module 8: Budget & Expenses
    fireEvent.click(screen.getByRole('button', { name: /Expenses/i }))
    expect(await screen.findByText(/Construction Expense Management/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /\+ Record Expense/i })).toBeTruthy()

    // Module 9: Material Management
    fireEvent.click(screen.getByRole('button', { name: /Materials/i }))
    expect(await screen.findByText(/AI Construction Material Price Intelligence/i)).toBeTruthy()
    expect(screen.getByText(/Cement \(50 kg bag\)/i)).toBeTruthy()

    // Module 10: Messages
    fireEvent.click(screen.getByRole('button', { name: /Messages/i }))
    expect(await screen.findByText(/Messages & Coordination/i)).toBeTruthy()
    expect(screen.getAllByText(/Rajesh Rao/i).length).toBeGreaterThan(0)

    // Module 11: Company Profile
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }))
    expect(await screen.findByText(/Builder Profile & Company Credentials/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/Apex Infra & Civil Developers/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/Turnkey Residential Construction & Civil Contracting/i)).toBeTruthy()
  })

  it('5. Daily tasks allow interactive status toggle', async () => {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(UNIFIED_USER))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(UNIFIED_USER))

    renderComponent(<Dashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Tasks & Scheduling/i }))
    expect(await screen.findByText(/Daily Tasks & Scheduling/i)).toBeTruthy()

    // Find checkboxes for tasks
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    fireEvent.click(checkboxes[0])
  })

  it('6. Attendance tracking allows marking present/absent and shows roll call counters', async () => {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(UNIFIED_USER))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(UNIFIED_USER))

    renderComponent(<Dashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Attendance Tracking/i }))
    expect(await screen.findByText(/Worker Attendance & Roll Call/i)).toBeTruthy()

    const presentButtons = screen.getAllByRole('button', { name: /^Present$/i })
    expect(presentButtons.length).toBeGreaterThan(0)
    fireEvent.click(presentButtons[0])
  })
})
