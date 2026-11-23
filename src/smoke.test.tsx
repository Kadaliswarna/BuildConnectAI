// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './components/Layout'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Builders from './pages/Builders'
import Workers from './pages/Workers'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './lib/i18n'

const app = (path: string) => render(
  <I18nProvider><ToastProvider><AuthProvider><MemoryRouter initialEntries={[path]}>
    <Routes><Route element={<Layout />}>
      <Route index element={<Home />} /><Route path="builders" element={<Builders />} />
      <Route path="workers" element={<Workers />} /><Route path="login" element={<Login />} /><Route path="register" element={<Register />} />
    </Route></Routes>
  </MemoryRouter></AuthProvider></ToastProvider></I18nProvider>)

afterEach(cleanup)
describe('smoke', () => {
  it('home', () => { app('/'); expect(screen.getAllByText(/Build Your Dreams/).length).toBeGreaterThan(0) })
  it('builders filter + compare', () => {
    app('/builders'); expect(screen.getAllByRole('article').length).toBe(6)
    const boxes = screen.getAllByRole('checkbox'); fireEvent.click(boxes[0]); fireEvent.click(boxes[1])
    expect(screen.getByLabelText('Comparison')).toBeTruthy()
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Warangal' } })
    expect(screen.getAllByRole('article').length).toBe(1)
  })
  it('workers filter + login gate', () => {
    app('/workers'); expect(screen.getAllByRole('article').length).toBe(10)
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Mason' } })
    expect(screen.getAllByRole('article').length).toBe(3)
  })
  it('register validation', () => {
    app('/register'); fireEvent.submit(screen.getByRole('button', { name: 'Register', hidden: false }).closest('form')!)
    expect(screen.getByText('Enter your full name.')).toBeTruthy()
  })
})
