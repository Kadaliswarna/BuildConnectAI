// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Builders from './pages/Builders'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './lib/i18n'
import type { UserProfile } from './types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const renderApp = (initialPath = '/builders', userProfile?: UserProfile) => {
  if (userProfile) {
    localStorage.setItem('bc-active-user-v2', JSON.stringify(userProfile))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(userProfile))
  }
  return render(
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="builders" element={<Builders />} />
                <Route path="dashboard" element={<Dashboard />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}

describe('Find Builder Booking Workflow & Preservation', () => {
  it('1. Preserves existing filters, listings, quotes, and comparison while adding Book Now to every builder card', () => {
    renderApp('/builders')

    const cards = screen.getAllByRole('article')
    expect(cards.length).toBe(6)

    const bookButtons = screen.getAllByRole('button', { name: /Book Now/i })
    expect(bookButtons.length).toBe(6)

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Warangal' } })
    expect(screen.getAllByRole('article').length).toBe(1)
    expect(screen.getByText('Kakatiya Developers')).toBeTruthy()

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '' } })
    expect(screen.getAllByRole('article').length).toBe(6)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    expect(screen.getByLabelText('Comparison')).toBeTruthy()
    expect(screen.getByText('Material')).toBeTruthy()
    expect(screen.getByText('Labour')).toBeTruthy()
    expect(screen.getByText('Total')).toBeTruthy()
  })

  it('2. Clicking Book Now opens the booking form with all required fields', () => {
    renderApp('/builders')

    const bookButtons = screen.getAllByRole('button', { name: /Book Now/i })
    act(() => {
      fireEvent.click(bookButtons[0])
    })

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/Book Builder:/i)).toBeTruthy()
    expect(screen.getByLabelText(/Customer Name/i)).toBeTruthy()
    expect(screen.getByLabelText(/Phone \/ Mobile Number/i)).toBeTruthy()
    expect(screen.getByLabelText(/Project Location \/ Site Address/i)).toBeTruthy()
    expect(screen.getByLabelText(/Construction Requirements & Scope/i)).toBeTruthy()
    expect(screen.getByLabelText(/Estimated Budget/i)).toBeTruthy()
    expect(screen.getByLabelText(/Preferred Meeting Date/i)).toBeTruthy()
  })

  it('3. Submitting the booking request generates a Booking ID and creates a confirmed booking', async () => {
    renderApp('/builders')

    const bookButtons = screen.getAllByRole('button', { name: /Book Now/i })
    act(() => {
      fireEvent.click(bookButtons[0])
    })

    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/Customer Name/i), { target: { value: 'Kavitha Reddy' } })
    fireEvent.change(screen.getByLabelText(/Phone \/ Mobile Number/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getByLabelText(/Project Location \/ Site Address/i), {
      target: { value: 'Plot 42, Jubilee Hills, Hyderabad' },
    })
    fireEvent.change(screen.getByLabelText(/Construction Requirements & Scope/i), {
      target: { value: 'Full turnkey construction for G+2 residential duplex' },
    })

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(screen.getByText(/Official Booking Reference ID/i)).toBeTruthy()
    expect(screen.getAllByText(/BK-BLD-/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Plot 42, Jubilee Hills, Hyderabad/i)).toBeTruthy()
  })

  it('4. User can track their builder booking request under My Bookings on the Dashboard', async () => {
    const customerUser: UserProfile = {
      uid: 'u-cust',
      email: 'customer@gmail.com',
      name: 'Demo Customer',
      role: 'Customer',
      phone: '+91 98765 43210',
      city: 'Hyderabad',
      verified: true,
    }

    renderApp('/dashboard', customerUser)

    expect(await screen.findByRole('region', { name: /My bookings/i })).toBeTruthy()
    expect(screen.getAllByText(/Builder/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BK-BLD-/i).length).toBeGreaterThan(0)
  })
})
