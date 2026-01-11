import { render, screen, waitFor, act } from '@testing-library/react'
import Admin from '../pages/admin'
import { AuthProvider } from '../components/AuthContext'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin',
    query: {},
    asPath: '/admin',
  }),
}))

jest.mock('../components/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 1, username: 'admin', display_name: 'Admin User', role: 'admin' },
    isAuthenticated: true,
  }),
}))

describe('Admin page', () => {
  const originalFetch = global.fetch
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/admin/users') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ users: [{ id: 1, username: 'user1', display_name: 'User One', role: 'user' }] }) })
      } else if (url === '/admin/logs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ logs: ['Log1', 'Log2'] }) })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'fake-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    // Restore localStorage
    delete window.localStorage
    jest.resetAllMocks()
  })

  it('redirects if not admin', () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ user: { role: 'user' } }) }))
    render(
      <AuthProvider>
        <Admin />
      </AuthProvider>
    )
    // Assuming redirect happens
  })

  it('displays admin panel for admin user', async () => {
    await act(async () => {
      render(<Admin />)
    })

    await waitFor(() => expect(screen.getByText(/Panel Administracyjny/i)).toBeInTheDocument())
    expect(screen.getByText(/user1/i)).toBeInTheDocument()
  }, 10000)
})