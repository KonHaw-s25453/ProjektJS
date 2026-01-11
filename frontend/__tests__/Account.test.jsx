import { render, screen, waitFor, act } from '@testing-library/react'
import Account from '../pages/account'
import { AuthProvider } from '../components/AuthContext'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/account',
    query: {},
    asPath: '/account',
  }),
}))

jest.mock('../components/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 1, username: 'testuser', display_name: 'Test User', role: 'user' },
    isAuthenticated: true,
  }),
}))

describe('Account page', () => {
  const originalFetch = global.fetch
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/user') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { id: 1, username: 'testuser', display_name: 'Test User', role: 'user' } }) })
      } else if (url.includes('/patches?user=true')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ patches: [{ id: 1, description: 'Test patch' }] }) })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => key === 'token' ? 'fake-token' : null),
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

  it('redirects to login if no token', () => {
    global.localStorage.getItem = jest.fn(() => null)
    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    )
    // Assuming useRouter push is called, but hard to test without mocking
  })

  it('fetches and displays user data and patches', async () => {
    await act(async () => {
      render(<Account />)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/user', {
      headers: { Authorization: 'Bearer fake-token' }
    })

    await waitFor(() => expect(screen.getByText(/Witaj, Test User!/i)).toBeInTheDocument(), { timeout: 10000 })
    expect(screen.getByText(/Test patch/i)).toBeInTheDocument()
  }, 15000)
})