// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Estimator from './pages/Estimator'
import Materials from './pages/Materials'
import Projects from './pages/Projects'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

afterEach(() => { cleanup(); localStorage.clear() })

describe('new construction modules', () => {
  it('recalculates the cost estimate when area changes', () => {
    const { container } = render(<Estimator />)
    const total = container.querySelector('.text-3xl.text-brand')
    const original = total?.textContent
    fireEvent.change(screen.getByLabelText('Area per floor (sq ft)'), { target: { value: '2000' } })
    expect(total?.textContent).not.toBe(original)
  })

  it('stores and compares a user-entered material quote', () => {
    render(<Materials />)
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Steel' } })
    fireEvent.change(screen.getByLabelText('Supplier or quote label'), { target: { value: 'Verified local quote' } })
    fireEvent.change(screen.getByLabelText('Price per kg (₹)'), { target: { value: '72' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save quote' }))
    expect(screen.getByText('Verified local quote')).toBeTruthy()
    expect(screen.getByText(/Lowest entered/)).toBeTruthy()
  })

  it('creates a demo project and records a task and stage update', async () => {
    render(<ToastProvider><AuthProvider><Projects /></AuthProvider></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: '+ New project' }))
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Test home' } })
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Hyderabad' } })
    fireEvent.change(screen.getByLabelText('Budget (₹)'), { target: { value: '2500000' } })
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-11-20' } })
    fireEvent.submit(document.querySelector('form')!)
    await screen.findAllByText('Test home')
    fireEvent.change(screen.getByLabelText('Add a project task'), { target: { value: 'Pour the foundation' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(await screen.findByText('Pour the foundation')).toBeTruthy()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save stage' }))
    await waitFor(() => expect(screen.getByText(/Updated Land preparation to 50%/)).toBeTruthy())
  })
})
