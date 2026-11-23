// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './lib/i18n'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import WorkerDashboard from './components/dashboards/WorkerDashboard'
import ChatPanel from './components/ChatPanel'
import type { Booking, UserProfile } from './types'

const customerUser: UserProfile = {
  uid: 'u-cust-101',
  email: 'customer@buildconnect.ai',
  name: 'Sirisha Customer',
  role: 'Customer',
  city: 'Hyderabad',
  phone: '+91 98480 12345',
}

const workerUser: UserProfile = {
  uid: 'w-worker-202',
  email: 'worker@buildconnect.ai',
  name: 'Raju Sharma',
  role: 'Worker',
  city: 'Hyderabad',
  phone: '+91 98480 54321',
  skill: 'Mason',
}

const testBooking: Booking = {
  id: 'BK-TEST-001',
  bookingType: 'worker',
  workerId: workerUser.uid,
  workerName: workerUser.name,
  skill: 'Mason',
  customerId: customerUser.uid,
  customerName: customerUser.name,
  customerRole: 'Customer',
  customerPhone: customerUser.phone,
  date: '2026-11-25',
  site: 'Plot 42, Jubilee Hills, Hyderabad',
  note: 'Foundation leveling and perimeter brickwork',
  status: 'pending',
  createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
}

const testBuilderBooking: Booking = {
  id: 'BK-BLD-002',
  bookingType: 'builder',
  builderName: 'BuildCraft Infra',
  workerId: 'bld-buildcraft-01',
  workerName: 'BuildCraft Infra',
  date: '2026-11-28',
  skill: 'Builder',
  customerId: customerUser.uid,
  customerName: customerUser.name,
  customerRole: 'Customer',
  customerPhone: customerUser.phone,
  meetingDate: '2026-11-28',
  site: 'Plot 42, Jubilee Hills, Hyderabad',
  note: 'Full G+2 villa structural execution consultation',
  status: 'accepted',
  budget: 4500000,
  createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
}

describe('Customer & Worker Two-Way Chat Functionality', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('bc-lang', 'en')
    localStorage.setItem('bc-bookings-v1', JSON.stringify([testBooking, testBuilderBooking]))
    localStorage.setItem('bc-active-user-v2', JSON.stringify(customerUser))
    localStorage.setItem('bc-active-user-v1', JSON.stringify(customerUser))
    document.documentElement.lang = 'en'
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('1. ChatPanel displays worker name, trade skill, site location and chat header properly', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    // Worker full name displayed in header
    expect(screen.getByRole('heading', { level: 3, name: /Raju Sharma/i })).toBeTruthy()

    // Trade and site displayed
    expect(screen.getAllByText(/Mason/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Plot 42, Jubilee Hills/i).length).toBeGreaterThan(0)
    expect(screen.getByText('BK-TEST-001')).toBeTruthy()

    // Phone call button available
    expect(screen.getByTitle('Call Contact')).toBeTruthy()
  })

  it('2. Loads and displays existing messages including initial booking request & greeting', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    // Initial message from booking note is displayed
    await waitFor(() => {
      expect(screen.getByText('Foundation leveling and perimeter brickwork')).toBeTruthy()
      expect(screen.getByText(/Hello Sirisha Customer! I received your booking request/i)).toBeTruthy()
    })
  })

  it('3. Customer can type and send a message, which appears immediately in the chat feed', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    const input = screen.getByPlaceholderText('Type a message…') as HTMLInputElement
    const sendButton = screen.getByRole('button', { name: /Send/i })

    // Initially Send button is disabled when empty
    expect((sendButton as HTMLButtonElement).disabled).toBe(true)

    // Type a new message
    fireEvent.change(input, { target: { value: 'Can you bring 2 helper masons as well?' } })
    expect(input.value).toBe('Can you bring 2 helper masons as well?')
    expect((sendButton as HTMLButtonElement).disabled).toBe(false)

    // Click Send
    fireEvent.click(sendButton)

    // Input is cleared
    expect(input.value).toBe('')

    // Message appears immediately in the message list
    await waitFor(() => {
      expect(screen.getByText('Can you bring 2 helper masons as well?')).toBeTruthy()
    })

    // Stored in localStorage for the booking
    const stored = JSON.parse(localStorage.getItem(`bc-chat-v1:${testBooking.id}`) || '[]')
    expect(stored.some((m: any) => m.text === 'Can you bring 2 helper masons as well?')).toBe(true)
  })

  it('4. Two-Way Messaging: Worker receives customer message and replies from Worker Dashboard', async () => {
    // 1. Customer sends a question
    const customerChat = JSON.parse(localStorage.getItem(`bc-chat-v1:${testBooking.id}`) || '[]')
    customerChat.push({
      id: 'msg-cust-1',
      from: customerUser.uid,
      fromName: customerUser.name,
      text: 'What time will you arrive on site?',
      ts: { seconds: Math.floor(Date.now() / 1000) },
    })
    localStorage.setItem(`bc-chat-v1:${testBooking.id}`, JSON.stringify(customerChat))

    // 2. Render Worker Dashboard
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

    // Switch to Job Requests tab
    const requestsTab = screen.getByRole('button', { name: /Job Requests/i })
    fireEvent.click(requestsTab)

    // Worker sees the booking and customer's message
    await waitFor(() => {
      expect(screen.getAllByText('Sirisha Customer').length).toBeGreaterThan(0)
      expect(screen.getByText('What time will you arrive on site?')).toBeTruthy()
    })

    // Worker types a reply
    const replyInput = screen.getByPlaceholderText('Type a message…') as HTMLInputElement
    fireEvent.change(replyInput, { target: { value: 'I will be there at 8:30 AM with my tools.' } })

    const sendBtn = screen.getByRole('button', { name: /Send/i })
    fireEvent.click(sendBtn)

    // Worker sees their reply immediately
    await waitFor(() => {
      expect(screen.getByText('I will be there at 8:30 AM with my tools.')).toBeTruthy()
    })

    // Verify localStorage has both messages
    const updated = JSON.parse(localStorage.getItem(`bc-chat-v1:${testBooking.id}`) || '[]')
    expect(updated.some((m: any) => m.text === 'What time will you arrive on site?')).toBe(true)
    expect(updated.some((m: any) => m.text === 'I will be there at 8:30 AM with my tools.' && m.from === workerUser.uid)).toBe(true)
  })

  it('5. Chat Panel renders seamlessly in Telugu and Hindi', async () => {
    // Render in Telugu
    localStorage.setItem('bc-lang', 'te')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('సందేశాన్ని టైప్ చేయండి…')).toBeTruthy()
      expect(screen.getByRole('button', { name: /పంపు/i })).toBeTruthy()
    })

    cleanup()

    // Render in Hindi
    localStorage.setItem('bc-lang', 'hi')

    render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('संदेश लिखें…')).toBeTruthy()
      expect(screen.getByRole('button', { name: /भेजें/i })).toBeTruthy()
    })
  })

  it('6. Dark Mode styling ensures proper contrast without white-on-white text or blank white panel', async () => {
    document.documentElement.classList.add('dark')

    const { container } = render(
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ChatPanel booking={testBooking} user={customerUser} />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    )

    // Header has dark styling classes
    const card = container.querySelector('.card')
    expect(card?.className).toContain('dark:bg-[#0c1b38]')

    // Messages feed has dark background class
    const feed = container.querySelector('.flex-1')
    expect(feed?.className).toContain('dark:bg-[#07132b]/50')

    // Message bubbles have distinct text-slate-900 / dark:text-slate-100 classes
    const otherBubble = screen.getByText(/Hello Sirisha Customer/i).closest('.rounded-2xl')
    expect(otherBubble?.className).toContain('dark:text-slate-100')
  })

  it('7. Dashboard is the main overview page showing booking summaries & project status without auto-opening chat', async () => {
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

    // Displays customer header
    expect(await screen.findByText('Customer Portal')).toBeTruthy()
    expect(screen.getAllByText('Sirisha Customer').length).toBeGreaterThan(0)

    // Overview components are visible
    expect(screen.getByText('Project Status')).toBeTruthy()
    expect(screen.getByText('Active Site Execution')).toBeTruthy()
    expect(screen.getByText(/Booking Summaries/)).toBeTruthy()
    expect(screen.getByText('Total Bookings')).toBeTruthy()
    expect(screen.getByText('Active Workers')).toBeTruthy()
    expect(screen.getByText('Builders Hired')).toBeTruthy()

    // Both bookings summaries are displayed
    expect(screen.getByText('BuildCraft Infra')).toBeTruthy()
    expect(screen.getByText('Raju Sharma')).toBeTruthy()

    // CRITICAL: Chat input is NOT rendered on the overview page (never open a chat automatically)
    expect(screen.queryByPlaceholderText('Type a message…')).toBeNull()
  })

  it('8. Customer Dashboard navigation provides separate Dashboard and Messages tabs with count', async () => {
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

    await screen.findByText('Customer Portal')

    // Find tab navigation buttons
    const dashTab = screen.getByRole('button', { name: /Dashboard/i })
    const messagesTab = screen.getByRole('button', { name: /Messages/i })

    expect(dashTab).toBeTruthy()
    expect(messagesTab).toBeTruthy()
    expect(within(messagesTab).getByText('2')).toBeTruthy()
  })

  it('9. Clicking Messages tab opens booking contacts and conversations', async () => {
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

    await screen.findByText('Customer Portal')

    const messagesTab = screen.getByRole('button', { name: /Messages/i })
    fireEvent.click(messagesTab)

    // Displays Booking Contacts list
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Booking Contacts/i })).toBeTruthy()
    })

    // Both builder and worker contacts are listed in contacts panel
    const contactsSection = screen.getByRole('region', { name: /Booking Contacts/i })
    expect(within(contactsSection).getByRole('button', { name: /BuildCraft Infra/i })).toBeTruthy()
    expect(within(contactsSection).getByRole('button', { name: /Raju Sharma/i })).toBeTruthy()
  })

  it('10. Customer can select a builder or worker to open their chat', async () => {
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

    await screen.findByText('Customer Portal')

    // Click Messages tab
    fireEvent.click(screen.getByRole('button', { name: /Messages/i }))

    // Select the builder contact from the contacts panel
    const contactsSection = await screen.findByRole('region', { name: /Booking Contacts/i })
    const builderContactBtn = within(contactsSection).getByRole('button', { name: /BuildCraft Infra/i })
    fireEvent.click(builderContactBtn)

    // Chat conversation for BuildCraft Infra opens
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /BuildCraft Infra/i })).toBeTruthy()
      expect(screen.getByPlaceholderText('Type a message…')).toBeTruthy()
    })

    // Switch to Worker contact from the contacts panel
    const workerContactBtn = within(contactsSection).getByRole('button', { name: /Raju Sharma/i })
    fireEvent.click(workerContactBtn)

    // Chat conversation switches to Raju Sharma
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Raju Sharma/i })).toBeTruthy()
      expect(screen.getAllByText('BK-TEST-001').length).toBeGreaterThan(0)
    })
  })

  it('11. Clicking "Chat with Builder" on a summary card in Overview opens that chat in Messages', async () => {
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

    await screen.findByText('Customer Portal')

    // Click "Chat with Builder" on BuildCraft Infra summary card
    const chatBuilderBtn = screen.getByRole('button', { name: /Chat with Builder/i })
    fireEvent.click(chatBuilderBtn)

    // Automatically transitions to Messages tab with BuildCraft Infra chat active
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /BuildCraft Infra/i })).toBeTruthy()
      expect(screen.getByPlaceholderText('Type a message…')).toBeTruthy()
    })
  })

  it('12. Top navigation displays Messages option for Customer role', async () => {
    render(
      <ThemeProvider>
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
      </ThemeProvider>
    )

    await screen.findByText('Customer Portal')

    const banner = screen.getByRole('banner')
    // Top banner contains Messages link for customer
    const messagesLink = within(banner).getByRole('link', { name: /Messages/i })
    expect(messagesLink).toBeTruthy()
    expect(messagesLink.getAttribute('href')).toBe('/dashboard?tab=messages')
  })
})
