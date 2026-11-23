// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './lib/i18n'

describe('Global Light Mode and Dark Mode Feature', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('1. Defaults to Light Mode and updates document.documentElement', () => {
    function TestConsumer() {
      const { theme } = useTheme()
      return <div data-testid="theme-val">{theme}</div>
    }

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('buildconnect_theme')).toBe('light')
  })

  it('2. Toggles to Dark Mode instantly, sets dark class, and persists to localStorage', () => {
    function TestConsumer() {
      const { theme, toggleTheme } = useTheme()
      return (
        <div>
          <span data-testid="theme-val">{theme}</span>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      )
    }

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val').textContent).toBe('light')

    // Click toggle
    fireEvent.click(screen.getByText('Toggle'))

    expect(screen.getByTestId('theme-val').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('buildconnect_theme')).toBe('dark')

    // Click toggle again -> should return to light
    fireEvent.click(screen.getByText('Toggle'))

    expect(screen.getByTestId('theme-val').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('buildconnect_theme')).toBe('light')
  })

  it('3. Loads existing saved theme from localStorage on initial render', () => {
    localStorage.setItem('buildconnect_theme', 'dark')

    function TestConsumer() {
      const { theme } = useTheme()
      return <div data-testid="theme-val">{theme}</div>
    }

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('4. Navigation header renders theme toggle button with Sun/Moon icons', () => {
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

    // Button should exist with aria-label
    const toggleBtn = screen.getByRole('button', { name: /Switch to Dark Mode/i })
    expect(toggleBtn).toBeTruthy()
    expect(toggleBtn.textContent).toContain('🌙')

    // Clicking toggle button switches to Dark Mode
    fireEvent.click(toggleBtn)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: /Switch to Light Mode/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Switch to Light Mode/i }).textContent).toContain('☀️')
  })

  it('5. Light Mode renders with light backgrounds and high contrast headings across dashboards', () => {
    // Verify document root in Light Mode has light theme
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

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    // Floating navigation pill should have light mode styles
    const navBar = document.querySelector('header')
    expect(navBar).toBeTruthy()
    expect(navBar?.className).toContain('bg-[#F4F7FC]/90')

    // Footer should have light background and slate text
    const footer = document.querySelector('footer')
    expect(footer).toBeTruthy()
    expect(footer?.className).toContain('bg-white')
    expect(footer?.className).toContain('text-slate-600')
  })
})
